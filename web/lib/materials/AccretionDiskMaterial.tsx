'use client';

import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * GPU-driven Keplerian accretion disk.
 * Each particle has: initial angle, radius, inward spiral speed.
 * Orbital velocity ∝ 1/√r (Kepler's third law).
 * All physics computed in vertex shader — zero CPU cost per frame.
 */
const AccretionDiskMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color(0.6, 0.4, 1.0),
    uColorInner: new THREE.Color(1.0, 0.8, 0.4),
    uEventHorizonRadius: 0.5,
    uOuterRadius: 2.0,
    uSpeedMult: 1.0,
    uSpiralRate: 0.15,
    uOpacity: 1.0,
    uPixelRatio: 1.0,
  },
  // vertex
  /* glsl */ `
    attribute float aInitAngle;
    attribute float aInitRadius;
    attribute float aSize;
    attribute float aPhase;
    uniform float uTime;
    uniform float uEventHorizonRadius;
    uniform float uOuterRadius;
    uniform float uSpeedMult;
    uniform float uSpiralRate;
    uniform float uPixelRatio;
    varying float vRadiusNorm;
    varying float vOpacity;

    void main() {
      // Spiral inward over time
      float radius = aInitRadius - uSpiralRate * uTime * uSpeedMult;

      // Wrap: when radius falls below event horizon, reset to outer edge
      float range = uOuterRadius - uEventHorizonRadius;
      radius = uEventHorizonRadius + mod(radius - uEventHorizonRadius, range);

      // Keplerian angular velocity: omega = 1.5 / sqrt(r)
      float omega = 1.5 / sqrt(max(radius, 0.1));
      float angle = aInitAngle + omega * uTime * uSpeedMult + aPhase;

      // Flat disk with slight vertical jitter baked into position.y
      vec3 pos = vec3(
        cos(angle) * radius,
        position.y,  // Pre-baked Y jitter from attribute
        sin(angle) * radius
      );

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = aSize * uPixelRatio * (200.0 / -mvPosition.z);

      // Pass normalized radius for color gradient
      vRadiusNorm = (radius - uEventHorizonRadius) / range;
      vOpacity = smoothstep(0.0, 0.1, vRadiusNorm); // Fade near horizon
    }
  `,
  // fragment
  /* glsl */ `
    uniform vec3 uColor;
    uniform vec3 uColorInner;
    uniform float uOpacity;
    varying float vRadiusNorm;
    varying float vOpacity;

    void main() {
      float d = length(gl_PointCoord - vec2(0.5));
      if (d > 0.5) discard;
      float softEdge = smoothstep(0.5, 0.15, d);

      // Inner particles glow hotter (gold), outer are cooler (purple)
      vec3 col = mix(uColorInner, uColor, vRadiusNorm);

      gl_FragColor = vec4(col, softEdge * vOpacity * uOpacity);
    }
  `
);

extend({ AccretionDiskMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    accretionDiskMaterial: any;
  }
}

export { AccretionDiskMaterial };
