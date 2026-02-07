'use client';

/**
 * Environmental Cohesion Layer
 *
 * Three global rules that make everything feel like one room:
 * 1. Global ambient occlusion — soft shadows at perpendicular surface junctions
 * 2. Unified dust/atmosphere layer — light scattering in enclosed air
 * 3. Consistent specular behavior — top-left light source
 *
 * Rendered as a fixed overlay, pointer-events-none, at z-11 (above frame, below HUD).
 */
export function EnvironmentalCohesion() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 11 }} aria-hidden="true">
      {/* ========== AMBIENT OCCLUSION: Surface junction shadows ========== */}

      {/* AO: Dashboard top edge meets viewport frame — TWO-PART shadow */}
      {/* Part 1: Broader soft shadow on dashboard surface (viewport light hitting angled console) */}
      <div
        className="absolute left-[50px] right-[180px]"
        style={{
          bottom: '220px',
          height: '12px',
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.35) 0%, transparent 100%)',
          transform: 'translateY(0)',
        }}
      />
      {/* Part 2: Tighter shadow at the junction line itself */}
      <div
        className="absolute left-[50px] right-[180px]"
        style={{
          bottom: '220px',
          height: '3px',
          background: 'rgba(0, 0, 0, 0.4)',
          filter: 'blur(1px)',
        }}
      />

      {/* AO: Left frame meets viewport — vertical junction */}
      <div
        className="absolute"
        style={{
          top: '24px',
          left: '50px',
          width: '6px',
          bottom: '220px',
          background: 'linear-gradient(90deg, rgba(0, 0, 0, 0.3) 0%, transparent 100%)',
        }}
      />

      {/* AO: Right frame meets viewport — vertical junction */}
      <div
        className="absolute"
        style={{
          top: '24px',
          right: '180px',
          width: '6px',
          bottom: '220px',
          background: 'linear-gradient(270deg, rgba(0, 0, 0, 0.3) 0%, transparent 100%)',
        }}
      />

      {/* AO: Top frame meets viewport — horizontal junction */}
      <div
        className="absolute left-[50px] right-[180px]"
        style={{
          top: '24px',
          height: '5px',
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0%, transparent 100%)',
        }}
      />

      {/* AO: Left frame inner edge (frame meets itself) */}
      <div
        className="absolute"
        style={{
          top: '24px',
          left: '47px',
          width: '4px',
          bottom: '220px',
          background: 'linear-gradient(270deg, rgba(0, 0, 0, 0.2) 0%, transparent 100%)',
        }}
      />

      {/* AO: Right frame inner edge */}
      <div
        className="absolute"
        style={{
          top: '24px',
          right: '177px',
          width: '4px',
          bottom: '220px',
          background: 'linear-gradient(90deg, rgba(0, 0, 0, 0.2) 0%, transparent 100%)',
        }}
      />

      {/* ========== UNIFIED DUST/ATMOSPHERE LAYER ========== */}
      {/* Covers cockpit interior (frame + dashboard), NOT the space viewport */}

      {/* Top frame atmosphere */}
      <div
        className="absolute top-0 left-0 right-0 h-6"
        style={{
          background: 'rgba(180, 150, 100, 0.005)',
        }}
      />

      {/* Left frame atmosphere */}
      <div
        className="absolute top-6 left-0 w-[50px]"
        style={{
          bottom: '220px',
          background: 'rgba(180, 150, 100, 0.005)',
        }}
      />

      {/* Right frame atmosphere */}
      <div
        className="absolute top-6 right-0 w-[180px]"
        style={{
          bottom: '220px',
          background: 'rgba(180, 150, 100, 0.005)',
        }}
      />

      {/* Bottom dashboard atmosphere */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[220px]"
        style={{
          background: 'rgba(180, 150, 100, 0.005)',
        }}
      />

      {/* ========== CONSISTENT SPECULAR: Top-left light source ========== */}

      {/* Top frame specular — angled surface: light falloff front-to-back */}
      <div
        className="absolute top-0 left-0 right-0 h-6"
        style={{
          background: 'linear-gradient(180deg, rgba(200, 220, 255, 0.02) 0%, transparent 70%)',
        }}
      />

      {/* Left frame specular — angled wall: lighter near screen edge, darker receding */}
      <div
        className="absolute top-6 left-0 w-[50px]"
        style={{
          bottom: '220px',
          background: 'linear-gradient(90deg, rgba(200, 220, 255, 0.025) 0%, transparent 60%)',
        }}
      />

      {/* Right frame specular — angled wall: lighter near screen edge */}
      <div
        className="absolute top-6 right-0 w-[180px]"
        style={{
          bottom: '220px',
          background: 'linear-gradient(270deg, rgba(200, 220, 255, 0.015) 0%, transparent 50%)',
        }}
      />

      {/* Dashboard specular — flat horizontal: broader, softer highlight */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[220px]"
        style={{
          background: 'linear-gradient(135deg, rgba(200, 220, 255, 0.012) 0%, transparent 35%)',
        }}
      />
    </div>
  );
}
