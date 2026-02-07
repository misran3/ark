'use client';

import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';
import { noiseGLSL, fresnelGLSL } from '@/lib/shaders';

const vertexShader = /* glsl */ `
  uniform float time;
  uniform float seed;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vLocalPosition;
  varying vec3 vViewDir;

  ${noiseGLSL}

  void main() {
    vUv = uv;
    vLocalPosition = position;

    // FBM vertex displacement — 2 octaves for craggy surface
    vec3 noiseInput = position * 2.0 + vec3(seed * 0.37);
    float displacement = fbm(noiseInput, 2) * 0.35;

    vec3 displaced = position + normal * displacement;

    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
    vWorldPosition = worldPos.xyz;
    vViewDir = normalize(cameraPosition - worldPos.xyz);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const fragmentShader = `
  ${noiseGLSL}
  ${fresnelGLSL}
` + /* glsl */ `
  uniform float time;
  uniform float seed;
  uniform float heatIntensity;
  uniform vec3 crackColor;
  uniform vec3 crackColorInner;
  uniform vec3 baseColor;
  uniform float emissiveStrength;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vLocalPosition;
  varying vec3 vViewDir;

  void main() {
    // --- Voronoi lava cracks ---
    // Scroll UV slowly so cracks shift over time
    vec2 voronoiUV = vLocalPosition.xz * 4.0 + vec2(seed * 0.13) + vec2(time * 0.06, time * 0.04);
    vec2 cell = voronoi(voronoiUV);

    // Thin bright lines at cell edges
    float crackWidth = smoothstep(0.06, 0.0, cell.x);

    // Secondary crack layer at different scale for detail
    vec2 cell2 = voronoi(vLocalPosition.yz * 6.0 + vec2(seed * 0.29) + vec2(time * 0.03));
    float crackWidth2 = smoothstep(0.04, 0.0, cell2.x) * 0.5;
    crackWidth = max(crackWidth, crackWidth2);

    // --- Heat gradient — hotter toward center ---
    float distFromCenter = length(vLocalPosition);
    float heatFactor = 1.0 - smoothstep(0.3, 1.5, distFromCenter);
    heatFactor *= heatIntensity;

    // Pulse the cracks subtly
    float pulse = sin(time * 2.0 + cell.y * 6.28) * 0.15 + 0.85;
    crackWidth *= pulse;

    // --- Fresnel rim glow ---
    vec3 n = normalize(vNormal);
    float rim = fresnel(normalize(vViewDir), n, 3.0);

    // --- Compose final color ---
    vec3 rockColor = baseColor; // charcoal #1a1a1a

    // Lava crack color: orange at outer edges, red-hot toward center
    vec3 lavaColor = mix(crackColor, crackColorInner, heatFactor);

    // Base surface: dark rock with subtle heat glow toward center
    vec3 surface = mix(rockColor, lavaColor * 0.25, heatFactor * 0.4);

    // Add glowing cracks
    float crackEmissive = crackWidth * emissiveStrength * (0.5 + heatFactor * 0.5);
    surface = mix(surface, lavaColor * emissiveStrength, crackWidth);

    // Fresnel rim — orange glow at glancing angles
    surface += crackColor * rim * 0.5;

    // Output with emissive energy for bloom pickup
    gl_FragColor = vec4(surface, 1.0);
  }
`;

const AsteroidShaderMaterial = shaderMaterial(
  {
    time: 0,
    seed: 0,
    heatIntensity: 1.0,
    crackColor: new THREE.Color(0.976, 0.451, 0.086),     // #f97316 orange
    crackColorInner: new THREE.Color(0.863, 0.149, 0.149), // #dc2626 red
    baseColor: new THREE.Color(0.102, 0.102, 0.102),       // #1a1a1a charcoal
    emissiveStrength: 3.0,
  },
  vertexShader,
  fragmentShader
);

extend({ AsteroidShaderMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    asteroidShaderMaterial: any;
  }
}

export { AsteroidShaderMaterial };
export default AsteroidShaderMaterial;
