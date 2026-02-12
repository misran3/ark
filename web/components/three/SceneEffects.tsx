'use client';

/**
 * Drop this inside <Canvas> after all scene objects.
 *
 *   <Canvas>
 *     <Scene />
 *     <SceneEffects />
 *   </Canvas>
 */

import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

export default function SceneEffects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={1.5}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.9}
        radius={0.6}
        mipmapBlur
        levels={2}
        blendFunction={BlendFunction.ADD}
      />
    </EffectComposer>
  );
}
