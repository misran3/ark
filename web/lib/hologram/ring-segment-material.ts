import { shaderMaterial } from '@react-three/drei';
import { Color } from 'three';
import { fresnelGLSL, pulseGLSL } from '@/lib/shaders/common.glsl';

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = /* glsl */ `
  ${fresnelGLSL}
  ${pulseGLSL}

  uniform float uTime;
  uniform vec3 uColor;
  uniform float uFillLevel;     // 0-1 how full this segment is
  uniform float uOpacity;
  uniform float uHighlight;     // 0-1 for hover/select brightening
  uniform float uDistress;      // 0 = healthy, 1 = critical (pulses red)

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    float rim = fresnel(vViewDir, vNormal, 2.0);

    // Fill: UV.y 0 = bottom of segment, 1 = top. Show filled portion.
    float fillEdge = smoothstep(uFillLevel - 0.02, uFillLevel + 0.02, vUv.y);
    float inFill = 1.0 - fillEdge;

    // Filled region is bright, unfilled is dim wireframe
    float brightness = mix(0.15, 1.0, inFill);

    // Distress pulse
    float distressPulse = uDistress * pulse(uTime, 0.8, 0.3, 1.0);

    // Scanline
    float scanline = sin(vWorldPos.y * 60.0 + uTime * 1.5) * 0.5 + 0.5;
    scanline = mix(1.0, scanline, 0.1);

    // Highlight
    brightness += uHighlight * 0.4;

    vec3 color = uColor * brightness * scanline;
    // Mix toward red on distress
    color = mix(color, vec3(1.0, 0.2, 0.1) * brightness, distressPulse * 0.6);

    float alpha = uOpacity * (0.5 + rim * 0.5) * mix(0.3, 1.0, inFill);
    alpha *= scanline;

    gl_FragColor = vec4(color, alpha);
  }
`;

export const RingSegmentMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new Color(0, 0.78, 1.0),
    uFillLevel: 1.0,
    uOpacity: 0.8,
    uHighlight: 0.0,
    uDistress: 0.0,
  },
  vertexShader,
  fragmentShader
);

import { extend } from '@react-three/fiber';
extend({ RingSegmentMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ringSegmentMaterial: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        uTime?: number;
        uColor?: Color;
        uFillLevel?: number;
        uOpacity?: number;
        uHighlight?: number;
        uDistress?: number;
        transparent?: boolean;
        depthWrite?: boolean;
        side?: number;
      };
    }
  }
}
