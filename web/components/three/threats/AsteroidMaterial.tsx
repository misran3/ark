'use client';

import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';

// Shared GLSL noise utilities (used in both vertex and fragment shaders)
const noiseGLSL = /* glsl */ `
  float hash(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
  }

  float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float n000 = hash(i);
    float n100 = hash(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash(i + vec3(1.0, 1.0, 1.0));

    float n00 = mix(n000, n100, f.x);
    float n10 = mix(n010, n110, f.x);
    float n01 = mix(n001, n101, f.x);
    float n11 = mix(n011, n111, f.x);

    float n0 = mix(n00, n10, f.y);
    float n1 = mix(n01, n11, f.y);

    return mix(n0, n1, f.z);
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise3D(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
`;

const vertexShader = /* glsl */ `
  uniform float time;
  uniform float seed;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vLocalPosition;
  varying float vNoise;

  ${noiseGLSL}

  void main() {
    vUv = uv;
    vLocalPosition = position;

    // Displace vertices along normal using seeded noise
    vec3 noiseInput = position * 2.0 + vec3(seed);
    float displacement = fbm(noiseInput) * 0.3;
    vNoise = displacement;

    vec3 displaced = position + normal * displacement;

    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
    vWorldPosition = worldPos.xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float time;
  uniform float seed;
  uniform float heatIntensity;
  uniform vec3 crackColor;
  uniform vec3 baseColor;
  uniform float emissiveStrength;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vLocalPosition;
  varying float vNoise;

  ${noiseGLSL}

  void main() {
    // Lava crack pattern - high frequency noise creates vein-like cracks
    vec3 crackInput = vLocalPosition * 6.0 + vec3(seed * 0.1);
    float crackNoise = fbm(crackInput);
    // Sharpen cracks: values near threshold become bright veins
    float crackMask = smoothstep(0.38, 0.42, crackNoise) * (1.0 - smoothstep(0.42, 0.52, crackNoise));
    crackMask += smoothstep(0.62, 0.66, crackNoise) * (1.0 - smoothstep(0.66, 0.76, crackNoise));
    crackMask = clamp(crackMask * 2.0, 0.0, 1.0);

    // Heat gradient - hotter toward center (distance from origin in local space)
    float distFromCenter = length(vLocalPosition);
    float heatFactor = 1.0 - smoothstep(0.3, 1.2, distFromCenter);
    heatFactor *= heatIntensity;

    // Animate crack glow with subtle pulse
    float pulse = sin(time * 2.0) * 0.15 + 0.85;
    crackMask *= pulse;

    // Fresnel rim glow
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - max(0.0, dot(viewDirection, vNormal)), 3.0);

    // Compose final color
    vec3 rockColor = baseColor;
    vec3 hotColor = crackColor;

    // Base surface: dark rock with subtle heat toward center
    vec3 surface = mix(rockColor, hotColor * 0.3, heatFactor * 0.4);

    // Add glowing cracks
    surface = mix(surface, hotColor * emissiveStrength, crackMask);

    // Add fresnel rim
    vec3 rimColor = hotColor * 0.6;
    surface += rimColor * fresnel * 0.5;

    gl_FragColor = vec4(surface, 1.0);
  }
`;

const AsteroidShaderMaterial = shaderMaterial(
  {
    time: 0,
    seed: 0,
    heatIntensity: 1.0,
    crackColor: new THREE.Color(0.976, 0.451, 0.086), // #f97316 orange
    baseColor: new THREE.Color(0.1, 0.1, 0.1), // charcoal
    emissiveStrength: 2.0,
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
