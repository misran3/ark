'use client';

import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';

const GravitationalLensingMaterial = shaderMaterial(
  {
    time: 0,
    blackHoleRadius: 1.0,
    distortionStrength: 0.3,
    ringColor: new THREE.Color(0.3, 0.1, 0.6),
    hawkingColor: new THREE.Color(0.2, 0.4, 1.0),
  },
  /* glsl */ `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main(){
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position,1.0);
      vViewPosition = -mv.xyz;
      gl_Position = projectionMatrix * mv;
    }
  `,
  /* glsl */ `
    uniform float time;
    uniform float blackHoleRadius;
    uniform float distortionStrength;
    uniform vec3 ringColor;
    uniform vec3 hawkingColor;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main(){
      float dist = length(vPosition);
      vec3 viewDir = normalize(vViewPosition);
      vec3 n = normalize(vNormal);

      // Gravitational falloff — inverse-square
      float lensStrength = 1.0 / (dist*dist + 0.5);
      float warp = lensStrength * distortionStrength;

      // Ring highlight at photon sphere (~1.5x radius)
      float ringDist = abs(dist - blackHoleRadius * 1.5);
      float ring = smoothstep(0.3, 0.0, ringDist) * 0.8;

      // Hawking radiation glow at event horizon edge
      float edgeDist = abs(dist - blackHoleRadius * 1.05);
      float hawking = smoothstep(0.2, 0.0, edgeDist) * 0.4;
      hawking *= (sin(time * 3.0 + dist * 8.0) * 0.3 + 0.7); // flicker

      // Fresnel rim
      float rim = pow(1.0 - abs(dot(viewDir, n)), 4.0);

      vec3 fc = ringColor * ring + hawkingColor * (hawking + rim * 0.2);
      float alpha = (ring + hawking + rim * 0.15) * warp * 2.0;
      alpha = clamp(alpha, 0.0, 0.8);

      gl_FragColor = vec4(fc, alpha);
    }
  `
);

extend({ GravitationalLensingMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    gravitationalLensingMaterial: any;
  }
}

export { GravitationalLensingMaterial };
