'use client';

import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';
import { fresnelGLSL } from '@/lib/shaders';

const VolumetricGlowMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color(0.4, 0.6, 1.0),
    glowStrength: 1.0,
    noiseScale: 1.0,
    noiseSpeed: 0.5,
    rimPower: 3.0,
    opacity: 1.0,
  },
  // vertex
  /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;
    void main(){
      vNormal = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position,1.0);
      vViewPosition = -mv.xyz;
      vWorldPosition = (modelMatrix * vec4(position,1.0)).xyz;
      gl_Position = projectionMatrix * mv;
    }
  `,
  // fragment — cheap sin/cos variation replaces expensive simplex noise
  `${fresnelGLSL}\n` + /* glsl */ `
    uniform float time;
    uniform vec3 color;
    uniform float glowStrength;
    uniform float noiseScale;
    uniform float noiseSpeed;
    uniform float rimPower;
    uniform float opacity;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;
    void main(){
      vec3 viewDir = normalize(vViewPosition);
      vec3 n = normalize(vNormal);
      float rim = fresnel(viewDir, n, rimPower);
      // Cheap animated variation (~3 ALU ops vs ~50 for simplex noise)
      vec3 np = vWorldPosition * noiseScale + vec3(0.0, time * noiseSpeed, 0.0);
      float variation = sin(np.x * 2.7 + np.y) * cos(np.z * 1.9 - np.x) * 0.5 + 0.5;
      float depth = 1.0 - pow(abs(dot(viewDir, n)), 2.0);
      float alpha = (rim * 0.5 + depth * 0.5) * variation * glowStrength * opacity;
      vec3 fc = color * (1.0 + rim * 0.5);
      gl_FragColor = vec4(fc, alpha);
    }
  `
);

extend({ VolumetricGlowMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    volumetricGlowMaterial: any;
  }
}

export { VolumetricGlowMaterial };
