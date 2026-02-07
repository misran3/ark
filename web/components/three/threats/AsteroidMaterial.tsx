'use client';

import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';
import { noiseGLSL, fresnelGLSL } from '@/lib/shaders';

const vertexShader = /* glsl */ `
  uniform float time;
  uniform float seed;
  uniform float damageLevel;

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

    // Damage: displace vertices inward to look "fractured"
    float damageCrumble = damageLevel * fbm(position * 4.0 + vec3(seed * 1.13), 2) * 0.15;
    displacement -= damageCrumble;

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
  uniform float damageLevel;
  uniform float sympatheticGlow;

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

    // Thin bright lines at cell edges — widen with damage
    float crackThreshold = mix(0.06, 0.14, damageLevel);
    float crackWidth = smoothstep(crackThreshold, 0.0, cell.x);

    // Secondary crack layer at different scale for detail
    vec2 cell2 = voronoi(vLocalPosition.yz * 6.0 + vec2(seed * 0.29) + vec2(time * 0.03));
    float crackThreshold2 = mix(0.04, 0.10, damageLevel);
    float crackWidth2 = smoothstep(crackThreshold2, 0.0, cell2.x) * 0.5;
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

    // --- Damage color shift: emissive dims, color cools toward gray ---
    float emissiveDampen = 1.0 - damageLevel * 0.6; // Dims to 40% at full damage
    vec3 damagedBaseColor = mix(baseColor, vec3(0.15, 0.14, 0.13), damageLevel * 0.5); // Shift toward cooler gray
    vec3 damagedCrackColor = mix(crackColor, vec3(0.6, 0.3, 0.1), damageLevel * 0.4); // Orange dims toward brown
    vec3 damagedCrackInner = mix(crackColorInner, vec3(0.4, 0.15, 0.1), damageLevel * 0.3);

    // --- Compose final color ---
    vec3 rockColor = damagedBaseColor;

    // Lava crack color: orange at outer edges, red-hot toward center
    vec3 lavaColor = mix(damagedCrackColor, damagedCrackInner, heatFactor);

    // Base surface: dark rock with subtle heat glow toward center
    vec3 surface = mix(rockColor, lavaColor * 0.25, heatFactor * 0.4);

    // Add glowing cracks (dampened by damage)
    float finalEmissive = emissiveStrength * emissiveDampen;
    surface = mix(surface, lavaColor * finalEmissive, crackWidth);

    // Fresnel rim — orange glow at glancing angles (dampened by damage)
    surface += damagedCrackColor * rim * 0.5 * emissiveDampen;

    // --- Critically damaged: expose glowing core through gaps ---
    float coreExposure = smoothstep(0.6, 1.0, damageLevel);
    float coreGlow = coreExposure * (1.0 - smoothstep(0.0, 0.8, distFromCenter));
    surface += vec3(1.0, 0.5, 0.1) * coreGlow * 2.0;

    // --- Sympathetic glow: field-level pulse from sibling destruction ---
    surface += damagedCrackColor * sympatheticGlow * 0.15;

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
    damageLevel: 0,        // 0 = pristine, 1 = critically damaged
    sympatheticGlow: 0,    // 0 = none, 1 = full field-pulse intensity
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
