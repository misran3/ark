import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
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
  uniform vec3 uColor;       // system color
  uniform vec3 uBrandColor;  // per-card accent
  uniform float uOpacity;
  uniform float uUtilization; // 0-1
  uniform float uScanlineIntensity;
  uniform float uFresnelPower;
  uniform float uFlicker;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    // Wireframe edge detection via UVs
    float edgeDist = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
    float edgeGlow = smoothstep(0.05, 0.0, edgeDist);
    float interior = smoothstep(0.0, 0.08, edgeDist) * 0.25;
    float wireframe = edgeGlow + interior;

    // Mix system color (60%) with brand color (40%)
    vec3 baseColor = mix(uColor, uBrandColor, 0.4);

    // Fresnel edge brightening
    float rim = fresnel(vViewDir, vNormal, uFresnelPower);

    // Scrolling scanlines
    float scanline = sin(vWorldPosition.y * 80.0 + uTime * 2.0) * 0.5 + 0.5;
    scanline = mix(1.0, scanline, uScanlineIntensity);

    // Micro-flicker
    float flicker = 1.0 - uFlicker * step(0.98, fract(sin(uTime * 43.7) * 2756.31));

    // Distress effects when utilization > 0.7
    float distress = smoothstep(0.7, 1.0, uUtilization);
    float redFlicker = distress * pulse(uTime, 2.0, 0.0, 0.3);
    vec3 distressColor = mix(baseColor, vec3(1.0, 0.2, 0.1), redFlicker);
    float distressScanline = mix(scanline, scanline * 0.7, distress);

    // Compose
    vec3 color = distressColor * (1.0 + rim * 1.5);
    float alpha = uOpacity * wireframe * distressScanline * flicker * (0.6 + rim * 0.4);

    gl_FragColor = vec4(color, alpha);
  }
`;

export const CardHologramMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new Color(0.86, 0.31, 1.0),
    uBrandColor: new Color(0.2, 0.4, 0.86),
    uOpacity: 0.85,
    uUtilization: 0.0,
    uScanlineIntensity: 0.15,
    uFresnelPower: 2.5,
    uFlicker: 0.3,
  },
  vertexShader,
  fragmentShader
);

extend({ CardHologramMaterial });
