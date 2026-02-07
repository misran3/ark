/**
 * Reusable GLSL shader snippets.
 * Import the ones you need and concatenate into your shader source.
 */

/** Fresnel rim-lighting — brighter at glancing angles */
export const fresnelGLSL = /* glsl */ `
  float fresnel(vec3 viewDir, vec3 normal, float power){
    return pow(1.0 - abs(dot(viewDir, normal)), power);
  }
`;

/** 3-stop color gradient */
export const gradientGLSL = /* glsl */ `
  vec3 gradient3(vec3 c1, vec3 c2, vec3 c3, float t){
    return t < 0.5 ? mix(c1, c2, t*2.0) : mix(c2, c3, (t-0.5)*2.0);
  }
`;

/** Heat distortion UV warp (requires snoise) */
export const heatDistortionGLSL = /* glsl */ `
  vec2 heatDistort(vec2 uv, float time, float strength){
    float n1 = snoise(vec3(uv*3.0, time*0.5));
    float n2 = snoise(vec3(uv*5.0, time*0.3));
    return uv + vec2(n1, n2) * strength;
  }
`;

/** Pulsing glow factor — pass elapsed time and desired frequency */
export const pulseGLSL = /* glsl */ `
  float pulse(float time, float freq, float minVal, float maxVal){
    float t = sin(time * freq * 6.28318) * 0.5 + 0.5;
    return mix(minVal, maxVal, t);
  }
`;

/** Rotate a 2D vector by angle (radians) */
export const rotate2dGLSL = /* glsl */ `
  vec2 rotate2d(vec2 v, float angle){
    float c = cos(angle);
    float s = sin(angle);
    return vec2(v.x*c - v.y*s, v.x*s + v.y*c);
  }
`;
