'use client';

import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';
import { fresnelGLSL } from '@/lib/shaders';

const EnergyFlowMaterial = shaderMaterial(
  {
    time: 0,
    color1: new THREE.Color(0.4, 0.6, 1.0),
    color2: new THREE.Color(1.0, 1.0, 1.0),
    flowSpeed: 1.0,
    flowDirection: new THREE.Vector2(0, 1),
    pulseFrequency: 2.0,
    stripeCount: 5.0,
    opacity: 1.0,
  },
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main(){
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position,1.0);
      vViewPosition = -mv.xyz;
      gl_Position = projectionMatrix * mv;
    }
  `,
  `${fresnelGLSL}\n` + /* glsl */ `
    uniform float time;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform float flowSpeed;
    uniform vec2 flowDirection;
    uniform float pulseFrequency;
    uniform float stripeCount;
    uniform float opacity;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main(){
      vec2 flowUv = vUv + flowDirection * time * flowSpeed;
      float stripes = sin(flowUv.y * stripeCount * 6.28318) * 0.5 + 0.5;
      float pulse = sin(time * pulseFrequency) * 0.3 + 0.7;
      vec3 fc = mix(color1, color2, stripes * pulse);
      vec3 viewDir = normalize(vViewPosition);
      float rim = fresnel(viewDir, normalize(vNormal), 2.0);
      float alpha = (stripes * 0.7 + rim * 0.3) * pulse * opacity;
      gl_FragColor = vec4(fc, alpha);
    }
  `
);

extend({ EnergyFlowMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    energyFlowMaterial: any;
  }
}

export { EnergyFlowMaterial };
