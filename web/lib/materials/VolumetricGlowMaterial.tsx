'use client';

import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';
import { noiseGLSL, fresnelGLSL } from '@/lib/shaders';

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
  // fragment
  `${noiseGLSL}\n${fresnelGLSL}\n` + /* glsl */ `
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
      vec3 np = vWorldPosition * noiseScale + vec3(0.0, time*noiseSpeed, 0.0);
      float noise = snoise(np)*0.5+0.5;
      float depth = 1.0 - pow(abs(dot(viewDir,n)), 2.0);
      float alpha = (rim*0.5 + depth*0.5) * noise * glowStrength * opacity;
      vec3 fc = color * (1.0 + rim*0.5);
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
