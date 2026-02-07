'use client';

import { GlassBevel } from './glass/GlassBevel';
import { GlassSurface } from './glass/GlassSurface';
import { ParallaxReflection } from './glass/ParallaxReflection';
import { NearFieldParticles } from './glass/NearFieldParticles';
import { LensDirt } from './glass/LensDirt';

/**
 * Four-layer glass stack between CockpitFrame (z-10) and Viewport3D (z-0).
 * Creates the illusion of thick cockpit glass set into the hull frame.
 * All layers are pointer-events-none so they don't interfere with R3F.
 */
export function ViewportGlass() {
  return (
    <>
      <GlassBevel />
      <GlassSurface />
      <ParallaxReflection />
      <NearFieldParticles />
      <LensDirt />
    </>
  );
}
