/**
 * Captain Nova Hologram Shader Materials
 *
 * Advanced holographic shader system with 7 visual effects:
 * 1. Fresnel Edge Glow - Bright rim lighting on silhouette
 * 2. Animated Scanlines - Horizontal lines scrolling upward
 * 3. Aurora Gradient Flow - Shifting colors synced with global theme
 * 4. Glitch Effect - Random horizontal displacement
 * 5. Chromatic Aberration - RGB split on edges
 * 6. Particle Noise - Flickering internal pixels
 * 7. Dynamic Transparency - Modulated by scanlines and fresnel
 */

import * as THREE from 'three';

// ============================================================================
// VERTEX SHADER
// ============================================================================

export const hologramVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewDirection;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vViewDirection = normalize(cameraPosition - worldPosition.xyz);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// ============================================================================
// NOISE FUNCTION (Embedded in Fragment Shader)
// ============================================================================

const noiseFunction = `
  // Simple noise function for procedural effects
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
`;

// ============================================================================
// FRAGMENT SHADER
// ============================================================================

export const hologramFragmentShader = `
  uniform float uTime;
  uniform vec3 uAuroraColor1;
  uniform vec3 uAuroraColor2;
  uniform float uGlitchIntensity;
  uniform float uOpacity;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewDirection;

  ${noiseFunction}

  void main() {
    // 1. FRESNEL EFFECT (Edge glow)
    float fresnel = 1.0 - dot(normalize(vNormal), normalize(vViewDirection));
    fresnel = pow(fresnel, 2.5); // Sharpen edge falloff

    // 2. SCANLINE EFFECT (Horizontal lines scrolling upward)
    float scanlineSpeed = 0.5;
    float scanlineFrequency = 80.0;
    float scanline = sin(vUv.y * scanlineFrequency + uTime * scanlineSpeed);
    scanline = smoothstep(0.3, 0.7, scanline); // Sharpen lines

    // 3. AURORA GRADIENT FLOW (Shifting colors)
    float flowNoise = noise(vUv * 3.0 + uTime * 0.2);
    vec3 auroraGradient = mix(uAuroraColor1, uAuroraColor2, flowNoise);

    // 4. GLITCH EFFECT (Horizontal displacement)
    float glitchOffset = noise(floor(vUv.y * 20.0) + uTime * 10.0) * uGlitchIntensity;
    vec2 glitchedUV = vUv + vec2(glitchOffset * 0.05, 0.0);
    float useGlitch = step(0.98, random(vec2(uTime, 0.0)));
    vec2 finalUV = mix(vUv, glitchedUV, useGlitch);

    // 5. CHROMATIC ABERRATION (RGB split on edges)
    vec3 chromatic = auroraGradient;
    if (fresnel > 0.3) {
      vec3 rColor = auroraGradient * vec3(1.2, 0.9, 0.9);
      vec3 bColor = auroraGradient * vec3(0.9, 0.9, 1.2);
      chromatic = mix(auroraGradient, rColor, fresnel * 0.3);
      chromatic = mix(chromatic, bColor, fresnel * 0.2);
    }

    // 6. PARTICLE NOISE (Internal flickering pixels)
    float particleNoise = noise(finalUV * 100.0 + uTime * 2.0);
    particleNoise = step(0.98, particleNoise); // Only brightest 2%

    // 7. COMBINE ALL EFFECTS
    vec3 finalColor = chromatic * scanline;

    // Add fresnel glow
    finalColor += auroraGradient * fresnel * 0.3;

    // Add particle noise
    finalColor += vec3(particleNoise * 0.5);

    // Blend with aurora gradient (subtle, 12% strength)
    finalColor = mix(finalColor, auroraGradient, 0.12);

    // 8. CALCULATE FINAL ALPHA
    float baseAlpha = uOpacity * 0.8; // 80% base transparency
    float scanlineAlpha = mix(0.85, 1.0, scanline);
    float fresnelAlpha = 0.6 + fresnel * 0.4;
    float alpha = baseAlpha * scanlineAlpha * fresnelAlpha;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================

export type HologramUniforms = {
  uTime: { value: number };
  uAuroraColor1: { value: THREE.Color };
  uAuroraColor2: { value: THREE.Color };
  uGlitchIntensity: { value: number };
  uOpacity: { value: number };
}

// ============================================================================
// MATERIAL CREATION
// ============================================================================

/**
 * Creates a holographic shader material for Captain Nova
 *
 * @param auroraColor1 - First aurora color (hex string or THREE.Color)
 * @param auroraColor2 - Second aurora color (hex string or THREE.Color)
 * @returns Configured THREE.ShaderMaterial with hologram shader
 */
export function createHologramMaterial(
  auroraColor1: string | THREE.Color = '#00ffff',
  auroraColor2: string | THREE.Color = '#ff00ff'
): THREE.ShaderMaterial {
  const uniforms = {
    uTime: { value: 0 },
    uAuroraColor1: { value: new THREE.Color(auroraColor1) },
    uAuroraColor2: { value: new THREE.Color(auroraColor2) },
    uGlitchIntensity: { value: 0 },
    uOpacity: { value: 1 },
  };

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: hologramVertexShader,
    fragmentShader: hologramFragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    toneMapped: false,
  });
}

// ============================================================================
// UNIFORM UPDATES
// ============================================================================

/**
 * Updates hologram shader uniforms (call every frame in useFrame)
 *
 * @param material - The hologram shader material to update
 * @param time - Elapsed time from clock.getElapsedTime()
 * @param auroraColors - Current aurora colors [color1, color2]
 * @param glitchIntensity - Glitch effect strength (0.0-1.0)
 */
export function updateHologramUniforms(
  material: THREE.ShaderMaterial,
  time: number,
  auroraColors: [string, string],
  glitchIntensity: number = 0
): void {
  const uniforms = material.uniforms as any;

  uniforms.uTime.value = time;
  uniforms.uAuroraColor1.value.set(auroraColors[0]);
  uniforms.uAuroraColor2.value.set(auroraColors[1]);
  uniforms.uGlitchIntensity.value = glitchIntensity;
}
