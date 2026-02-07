'use client';

/**
 * Drop this inside <Canvas> after all scene objects.
 *
 *   <Canvas>
 *     <Scene />
 *     <SceneEffects />
 *   </Canvas>
 */

import { useMemo } from 'react';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Vector2 } from 'three';

interface SceneEffectsProps {
  /** Bloom glow intensity (0 = off) */
  bloomIntensity?: number;
  /** Bloom radius spread */
  bloomRadius?: number;
  /** Chromatic aberration pixel offset */
  chromaticOffset?: number;
  /** Edge vignette darkness */
  vignetteDarkness?: number;
}

export default function SceneEffects({
  bloomIntensity = 1.5,
  bloomRadius = 0.85,
  chromaticOffset = 0.0004,
  vignetteDarkness = 0.45,
}: SceneEffectsProps) {
  const caOffset = useMemo(() => new Vector2(chromaticOffset, chromaticOffset), [chromaticOffset]);

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.9}
        radius={bloomRadius}
        mipmapBlur
        levels={5}
        blendFunction={BlendFunction.ADD}
      />
      <ChromaticAberration
        offset={caOffset}
        blendFunction={BlendFunction.NORMAL}
      />
      <Vignette
        offset={0.5}
        darkness={vignetteDarkness}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}
