'use client';

import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Holographic shield shader — hexagonal scanline grid with flicker.
 * Used on Enemy Cruiser for hover-only shield effect.
 */
const HolographicMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color(0.863, 0.149, 0.149), // #dc2626
    scanlineCount: 50.0,
    flickerSpeed: 8.0,
    opacity: 0.08,
  },
  /* glsl */ `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vViewDir;
    void main() {
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vViewDir = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv;
    }
  `,
  /* glsl */ `
    uniform float time;
    uniform vec3 color;
    uniform float scanlineCount;
    uniform float flickerSpeed;
    uniform float opacity;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vViewDir;

    // Hex grid distance function
    float hexGrid(vec2 p, float scale) {
      p *= scale;
      vec2 h = vec2(1.0, 1.732);
      vec2 a = mod(p, h) - h * 0.5;
      vec2 b = mod(p - h * 0.5, h) - h * 0.5;
      float da = length(a);
      float db = length(b);
      float d = min(da, db);
      return smoothstep(0.4, 0.42, d);
    }

    void main() {
      // Fresnel rim
      float rim = pow(1.0 - abs(dot(vViewDir, vNormal)), 2.0);

      // Scanlines
      float scanline = sin(vPosition.y * scanlineCount + time * 2.0) * 0.5 + 0.5;
      scanline = smoothstep(0.3, 0.7, scanline);

      // Hex grid pattern on surface
      vec2 hexUV = vPosition.xz * 3.0 + vec2(vPosition.y * 0.5);
      float hex = hexGrid(hexUV, 4.0);

      // Flicker
      float flicker = sin(time * flickerSpeed) * 0.3 + 0.7;
      flicker *= sin(time * flickerSpeed * 2.7 + 1.3) * 0.2 + 0.8;

      // Combine
      float alpha = (rim * 0.5 + scanline * 0.3 + hex * 0.2) * opacity * flicker;

      gl_FragColor = vec4(color * (1.0 + rim * 0.5), alpha);
    }
  `,
);

extend({ HolographicMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    holographicMaterial: any;
  }
}

export { HolographicMaterial };
