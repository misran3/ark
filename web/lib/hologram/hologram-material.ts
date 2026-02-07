import { shaderMaterial } from '@react-three/drei';
import { Color } from 'three';
import { fresnelGLSL, pulseGLSL } from '@/lib/shaders/common.glsl';

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
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
  uniform float uOpacity;
  uniform float uScanlineIntensity;
  uniform float uFresnelPower;
  uniform float uFlicker;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    // Fresnel edge brightening
    float rim = fresnel(vViewDir, vNormal, uFresnelPower);

    // Scrolling scanlines
    float scanline = sin(vWorldPosition.y * 80.0 + uTime * 2.0) * 0.5 + 0.5;
    scanline = mix(1.0, scanline, uScanlineIntensity);

    // Micro-flicker (hologram instability)
    float flicker = 1.0 - uFlicker * step(0.98, fract(sin(uTime * 43.7) * 2756.31));

    // Compose
    vec3 color = uColor * (1.0 + rim * 1.5);
    float alpha = uOpacity * scanline * flicker * (0.6 + rim * 0.4);

    gl_FragColor = vec4(color, alpha);
  }
`;

export const HologramMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new Color(0, 0.78, 1.0),
    uOpacity: 0.7,
    uScanlineIntensity: 0.15,
    uFresnelPower: 2.5,
    uFlicker: 0.3,
  },
  vertexShader,
  fragmentShader
);

// Extend for JSX usage
import { extend } from '@react-three/fiber';
extend({ HologramMaterial });

// Type declaration for JSX
declare global {
  namespace JSX {
    interface IntrinsicElements {
      hologramMaterial: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        uTime?: number;
        uColor?: Color;
        uOpacity?: number;
        uScanlineIntensity?: number;
        uFresnelPower?: number;
        uFlicker?: number;
        transparent?: boolean;
        depthWrite?: boolean;
        blending?: number;
        side?: number;
      };
    }
  }
}
