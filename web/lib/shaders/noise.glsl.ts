/**
 * GLSL noise functions exported as a string.
 *
 * Usage inside a shaderMaterial fragment/vertex shader:
 *   import { noiseGLSL } from '@/lib/shaders/noise.glsl';
 *   const fragmentShader = `${noiseGLSL}\n void main() { ... }`;
 *
 * Provides:
 *   float snoise(vec3 v)       - Simplex 3D noise (-1..1)
 *   float fbm(vec3 p, int oct) - Fractional Brownian Motion
 *   vec2  voronoi(vec2 x)      - Voronoi cell noise (distance, cell id)
 *   vec3  curlNoise(vec3 p)    - Curl noise for particle flow fields
 */
export const noiseGLSL = /* glsl */ `
  // ---- Simplex 3D Noise ----
  vec4 _permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 _taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314*r; }

  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod(i, 289.0);
    vec4 p = _permute(_permute(_permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x2_ = x_ * ns.x + ns.yyyy;
    vec4 y2_ = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x2_) - abs(y2_);
    vec4 b0 = vec4(x2_.xy, y2_.xy);
    vec4 b1 = vec4(x2_.zw, y2_.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = _taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  // ---- Fractional Brownian Motion ----
  float fbm(vec3 p, int octaves){
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for(int i = 0; i < 8; i++){
      if(i >= octaves) break;
      value += amplitude * snoise(p * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  // ---- Voronoi Cell Noise ----
  vec2 voronoi(vec2 x){
    vec2 n = floor(x);
    vec2 f = fract(x);
    vec2 mg, mr;
    float md = 8.0;
    for(int j=-1;j<=1;j++){
      for(int i=-1;i<=1;i++){
        vec2 g = vec2(float(i),float(j));
        vec2 o = vec2(
          fract(sin(dot(n+g,vec2(12.9898,78.233)))*43758.5453),
          fract(sin(dot(n+g,vec2(39.3461,11.135)))*43758.5453)
        );
        vec2 r = g + o - f;
        float d = dot(r,r);
        if(d < md){ md = d; mr = r; mg = g; }
      }
    }
    return vec2(md, fract(sin(dot(n+mg,vec2(12.9898,78.233)))*43758.5453));
  }

  // ---- Curl Noise ----
  vec3 curlNoise(vec3 p){
    const float e = 0.1;
    float n1=snoise(vec3(p.x,p.y+e,p.z));
    float n2=snoise(vec3(p.x,p.y-e,p.z));
    float n3=snoise(vec3(p.x,p.y,p.z+e));
    float n4=snoise(vec3(p.x,p.y,p.z-e));
    float n5=snoise(vec3(p.x+e,p.y,p.z));
    float n6=snoise(vec3(p.x-e,p.y,p.z));
    return normalize(vec3(n1-n2, n3-n4, n5-n6)/(2.0*e));
  }
`;
