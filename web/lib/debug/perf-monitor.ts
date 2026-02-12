import * as THREE from 'three';

let _renderer: THREE.WebGLRenderer | null = null;

export function registerRenderer(renderer: THREE.WebGLRenderer) {
  _renderer = renderer;
}

export function logGPUStats(label: string) {
  if (!_renderer) return;
  const info = _renderer.info;
  console.log(`[GPU ${label}]`, {
    drawCalls: info.render.calls,
    triangles: info.render.triangles,
    geometries: info.memory.geometries,
    textures: info.memory.textures,
  });
}
