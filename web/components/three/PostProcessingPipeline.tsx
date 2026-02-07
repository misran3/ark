'use client';

import { useMemo } from 'react';
import { EffectComposer, Bloom, Vignette, ChromaticAberration, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { usePostprocessingStore } from '@/lib/stores/postprocessing-store';

const ZERO_OFFSET: [number, number] = [0, 0];

export default function PostProcessingPipeline() {
  const bloomEnabled = usePostprocessingStore((s) => s.bloomEnabled);
  const bloomIntensity = usePostprocessingStore((s) => s.bloomIntensity);
  const bloomThreshold = usePostprocessingStore((s) => s.bloomThreshold);
  const vignetteEnabled = usePostprocessingStore((s) => s.vignetteEnabled);
  const vignetteOffset = usePostprocessingStore((s) => s.vignetteOffset);
  const vignetteDarkness = usePostprocessingStore((s) => s.vignetteDarkness);
  const chromaticEnabled = usePostprocessingStore((s) => s.chromaticEnabled);
  const chromaticOffset = usePostprocessingStore((s) => s.chromaticOffset);
  const noiseEnabled = usePostprocessingStore((s) => s.noiseEnabled);
  const noiseOpacity = usePostprocessingStore((s) => s.noiseOpacity);

  const offset = useMemo(
    () => (chromaticEnabled ? chromaticOffset : ZERO_OFFSET),
    [chromaticEnabled, chromaticOffset],
  );

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={bloomThreshold}
        luminanceSmoothing={0.9}
        intensity={bloomEnabled ? bloomIntensity : 0}
        mipmapBlur
      />
      <Vignette
        offset={vignetteOffset}
        darkness={vignetteEnabled ? vignetteDarkness : 0}
        blendFunction={BlendFunction.NORMAL}
      />
      <ChromaticAberration
        offset={offset}
        radialModulation={false}
        blendFunction={BlendFunction.NORMAL}
      />
      <Noise
        opacity={noiseEnabled ? noiseOpacity : 0}
        blendFunction={BlendFunction.OVERLAY}
      />
    </EffectComposer>
  );
}
