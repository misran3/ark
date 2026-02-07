/**
 * Captain Nova v3 Hologram Shader Materials
 *
 * Unified holographic shader with 7 visual effects:
 * 1. Fresnel Edge Glow - Per-face normals with flatShading
 * 2. Animated Scanlines - Horizontal lines scrolling upward
 * 3. Aurora Gradient Flow - Shifting colors synced with global theme
 * 4. Glitch Effect - Random horizontal displacement
 * 5. Chromatic Aberration - Fake RGB split via color-offset fresnel
 * 6. Particle Noise - Flickering internal pixels
 * 7. Gradient Fade - Smooth opacity falloff from chest to waist
 */

import * as THREE from 'three';

// ============================================================================
// VERTEX SHADER
// ============================================================================

const hologramVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;

  void main() {
    // Transform normal to world space for fresnel
    vNormal = normalize(normalMatrix * normal);

    // World position for scanlines and fade
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;

    // View position for fresnel
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

// ============================================================================
// FRAGMENT SHADER
// ============================================================================

const hologramFragmentShader = `
  uniform float uTime;
  uniform vec3 uAuroraColor1;
  uniform vec3 uAuroraColor2;
  uniform float uGlitchIntensity;
  uniform float uFadeStart;
  uniform float uFadeEnd;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;

  // Hash-based noise (cheap, no texture lookups)
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    // Base color
    vec3 baseColor = vec3(0.8, 0.9, 1.0);

    // 1. Fresnel Edge Glow (per-face with flatShading)
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = 1.0 - abs(dot(viewDir, vNormal));
    fresnel = pow(fresnel, 2.5);

    // 5. Fake chromatic aberration (color-offset fresnel)
    float fresnelSide = dot(viewDir, vNormal) > 0.0 ? 1.0 : 0.0;
    vec3 edgeColor = mix(vec3(1.0, 0.3, 0.3), vec3(0.3, 0.5, 1.0), fresnelSide);
    vec3 fresnelGlow = edgeColor * fresnel * 1.5;

    // 2. Scanlines (horizontal, scrolling upward)
    float scanlineFrequency = 80.0;
    float scanlineSpeed = 0.5;
    float scanline = sin(vWorldPosition.y * scanlineFrequency + uTime * scanlineSpeed);
    scanline = smoothstep(0.3, 0.7, scanline);
    float scanlineAlpha = mix(0.85, 1.0, scanline);

    // 3. Aurora Gradient Flow
    float flowNoise = noise(vWorldPosition.xy * 3.0 + uTime * 0.2);
    vec3 auroraGradient = mix(uAuroraColor1, uAuroraColor2, flowNoise);
    baseColor = mix(baseColor, auroraGradient, 0.12);

    // 4. Glitch Effect (horizontal displacement)
    if (uGlitchIntensity > 0.01) {
      float glitchRow = floor(vWorldPosition.y * 20.0);
      float glitchNoise = hash(vec2(glitchRow, floor(uTime * 10.0)));
      // Color distortion during glitch
      baseColor += vec3(glitchNoise * 0.2) * uGlitchIntensity;
    }

    // 6. Particle Noise (internal flickering)
    float particleNoise = noise(vWorldPosition.xz * 100.0 + uTime * 2.0);
    particleNoise = step(0.98, particleNoise);
    baseColor += vec3(particleNoise * 0.5);

    // Combine fresnel glow with aurora tint
    vec3 glowColor = mix(fresnelGlow, auroraGradient * fresnel, 0.5);
    vec3 finalColor = baseColor + glowColor * 0.3;

    // 7. Gradient Fade (waist to transparent)
    float fadeAlpha = smoothstep(uFadeEnd, uFadeStart, vWorldPosition.y);

    // Base transparency + scanline modulation + fade
    float alpha = 0.8 * scanlineAlpha * fadeAlpha;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================

export interface HologramUniforms {
  uTime: { value: number };
  uAuroraColor1: { value: THREE.Color };
  uAuroraColor2: { value: THREE.Color };
  uGlitchIntensity: { value: number };
  uFadeStart: { value: number };
  uFadeEnd: { value: number };
}

// ============================================================================
// MATERIAL CREATION
// ============================================================================

export function createHologramMaterial(
  auroraColor1: string | THREE.Color = '#00ffff',
  auroraColor2: string | THREE.Color = '#ff00ff'
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAuroraColor1: { value: new THREE.Color(auroraColor1) },
      uAuroraColor2: { value: new THREE.Color(auroraColor2) },
      uGlitchIntensity: { value: 0.0 },
      uFadeStart: { value: -0.3 }, // Start fade at waist
      uFadeEnd: { value: -0.6 }, // Fully transparent below
    },
    vertexShader: hologramVertexShader,
    fragmentShader: hologramFragmentShader,
    transparent: true,
    side: THREE.FrontSide,
    depthWrite: false,
    flatShading: true, // Per-face normals for geometric aesthetic
  });
}

// ============================================================================
// UNIFORM UPDATES
// ============================================================================

export function updateHologramUniforms(
  material: THREE.ShaderMaterial,
  updates: {
    time?: number;
    auroraColor1?: string;
    auroraColor2?: string;
    glitchIntensity?: number;
  }
): void {
  if (updates.time !== undefined) {
    material.uniforms.uTime.value = updates.time;
  }
  if (updates.auroraColor1) {
    material.uniforms.uAuroraColor1.value.set(updates.auroraColor1);
  }
  if (updates.auroraColor2) {
    material.uniforms.uAuroraColor2.value.set(updates.auroraColor2);
  }
  if (updates.glitchIntensity !== undefined) {
    material.uniforms.uGlitchIntensity.value = updates.glitchIntensity;
  }
}
