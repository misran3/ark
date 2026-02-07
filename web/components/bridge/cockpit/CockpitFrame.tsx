// web/components/bridge/cockpit/CockpitFrame.tsx
'use client';

import { useAlertStore, ALERT_COLORS, type CascadeStage } from '@/lib/stores/alert-store';
import { VIEWPORT_BOUNDS } from '@/lib/constants/cockpit-layout';

export function CockpitFrame() {
  const alertLevel = useAlertStore((state) => state.level);
  const cascadeStage = useAlertStore((state) => state.cascadeStage);

  // Frame responds at cascade stage 'frame' (stage 1) — first to react
  // During cascade, show previous colors until our stage is reached
  const CASCADE_ORDER: CascadeStage[] = ['frame', 'hud', 'glass', 'backlight', 'instruments'];
  const frameReached = cascadeStage === 'idle' || CASCADE_ORDER.indexOf(cascadeStage) >= CASCADE_ORDER.indexOf('frame');
  const colors = ALERT_COLORS[frameReached ? alertLevel : 'normal'];

  return (
    <div className="fixed inset-0 z-10 pointer-events-none" aria-hidden="true">
      {/* ========== TOP FRAME (thin, ~24px) — perspective angled ========== */}
      <div style={{ perspective: '600px', contain: 'layout style paint' }} className="absolute top-0 left-0 right-0 h-6">
        <div
          className="absolute inset-0 hull-metal-h"
          style={{
            transform: 'rotateX(-2deg)',
            transformOrigin: 'center top',
          }}
        >
          {/* Top bevel / gasket line */}
          <div className="absolute bottom-0 left-12 right-12 h-px" style={{ background: colors.border }} />
          {/* Frost effect at top corners */}
          <div className="absolute bottom-0 left-0 w-24 h-3 bg-gradient-to-r from-white/[0.02] to-transparent rounded-br" />
          <div className="absolute bottom-0 right-0 w-24 h-3 bg-gradient-to-l from-white/[0.02] to-transparent rounded-bl" />

          {/* 4A: Overhead light strip — warm white along bottom edge */}
          <div
            className="absolute bottom-0 left-[50px] right-[180px] h-2"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(255, 245, 230, 0.06) 60%, rgba(255, 245, 230, 0.12) 85%, rgba(255, 245, 230, 0.04) 100%)',
            }}
          />

          {/* Light falloff gradient — lighter at back, darker at front overhang */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, rgba(200,220,255,0.02) 0%, transparent 70%)',
            }}
          />
        </div>
      </div>

      {/* ========== LEFT FRAME (~50px) — perspective angled ========== */}
      <div style={{ perspective: '600px', contain: 'layout style paint' }} className="absolute top-6 left-0 w-[50px] bottom-[220px]">
      <div
        className="absolute inset-0 hull-metal-v"
        style={{
          transform: 'rotateY(3deg)',
          transformOrigin: 'left center',
        }}
      >
        {/* Panel segment seams */}
        <div className="absolute top-[30%] left-0 right-0 h-px hull-seam" />
        <div className="absolute top-[65%] left-0 right-0 h-px hull-seam" />

        {/* Stencil markings */}
        <div className="hull-stencil absolute top-[15%] left-2 whitespace-nowrap" style={{ transform: 'rotate(-90deg) translateX(-100%)', transformOrigin: 'top left' }}>
          FRAME-L1
        </div>
        <div className="hull-stencil absolute top-[50%] left-2 whitespace-nowrap" style={{ transform: 'rotate(-90deg) translateX(-100%)', transformOrigin: 'top left' }}>
          HP-03
        </div>

        {/* Status lights */}
        <div className="absolute top-[20%] right-2 flex flex-col gap-6">
          <div className="w-[5px] h-[5px] rounded-full bg-green-500" style={{ animation: 'status-light-pulse 3s ease-in-out infinite' }} />
          <div className="w-[5px] h-[5px] rounded-full bg-green-500" style={{ animation: 'status-light-pulse 3s ease-in-out infinite 0.5s' }} />
          <div className="w-[5px] h-[5px] rounded-full" style={{ animation: 'damage-flicker 8s ease-in-out infinite' }} />
          <div className="w-[5px] h-[5px] rounded-full bg-amber-500" style={{ animation: 'status-light-pulse 3s ease-in-out infinite 1.5s' }} />
        </div>

        {/* Under-panel bleed light */}
        <div className="absolute top-[30%] left-0 right-0 h-[2px]" style={{ background: 'rgba(0, 240, 255, 0.15)', animation: 'seam-bleed 6s ease-in-out infinite' }} />

        {/* Rivet line */}
        <div className="absolute top-4 right-1 bottom-4 w-[3px] hull-rivets" />

        {/* Edge glow */}
        <div className="absolute top-0 right-0 bottom-0 w-px" style={{ background: colors.glow, animation: 'cockpit-edge-breathe 4s ease-in-out infinite' }} />

        {/* Reflective glint */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" style={{ animation: 'cockpit-glint 18s linear infinite' }} />
        </div>

        {/* Emergency shutter mark */}
        <div className="absolute top-[10%] right-0 bottom-[10%] w-px bg-white/[0.03]" />

        {/* Light falloff — lighter on left edge (near overhead light), darker on right */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, rgba(200,220,255,0.025) 0%, transparent 60%)',
          }}
        />
      </div>
      </div>

      {/* ========== RIGHT FRAME (~180px, houses Captain Nova station) — perspective angled ========== */}
      <div style={{ perspective: '600px', contain: 'layout style paint' }} className="absolute top-6 right-0 w-[180px] bottom-[220px]">
      <div
        className="absolute inset-0 hull-metal-v"
        style={{
          transform: 'rotateY(-2deg)',
          transformOrigin: 'right center',
        }}
      >
        {/* Panel seams */}
        <div className="absolute top-[25%] left-0 right-0 h-px hull-seam" />
        <div className="absolute top-[70%] left-0 right-0 h-px hull-seam" />

        {/* Stencil markings */}
        <div className="hull-stencil absolute top-[10%] right-2 whitespace-nowrap" style={{ transform: 'rotate(90deg) translateX(0%)', transformOrigin: 'top right' }}>
          FRAME-R1
        </div>

        {/* Status lights */}
        <div className="absolute top-[20%] left-2 flex flex-col gap-6">
          <div className="w-[5px] h-[5px] rounded-full bg-green-500" style={{ animation: 'status-light-pulse 3s ease-in-out infinite 0.3s' }} />
          <div className="w-[5px] h-[5px] rounded-full bg-green-500" style={{ animation: 'status-light-pulse 3s ease-in-out infinite 0.8s' }} />
          <div className="w-[5px] h-[5px] rounded-full bg-amber-500" style={{ animation: 'status-light-pulse 3s ease-in-out infinite 1.2s' }} />
        </div>

        {/* Under-panel bleed light */}
        <div className="absolute top-[25%] left-0 right-0 h-[2px]" style={{ background: 'rgba(139, 92, 246, 0.12)', animation: 'seam-bleed 6s ease-in-out infinite 2s' }} />

        {/* Rivet line */}
        <div className="absolute top-4 left-1 bottom-4 w-[3px] hull-rivets" />

        {/* Edge glow (inner edge) */}
        <div className="absolute top-0 left-0 bottom-0 w-px" style={{ background: colors.glow, animation: 'cockpit-edge-breathe 4s ease-in-out infinite 1s' }} />

        {/* Reflective glint */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" style={{ animation: 'cockpit-glint 22s linear infinite 5s' }} />
        </div>

        {/* Thermal discoloration near bottom (engine heat) */}
        <div className="absolute bottom-0 left-0 right-0 h-[30%] hull-thermal" />

        {/* Light falloff — lighter on right edge, darker on left */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(270deg, rgba(200,220,255,0.015) 0%, transparent 50%)',
          }}
        />

        {/* Nova station area is rendered separately (CaptainNovaStation) */}
      </div>
      </div>

      {/* ========== CORNER STRUCTURAL RIBS ========== */}
      {/* Top-left corner chamfer — where top frame meets left wall */}
      <div
        className="absolute"
        style={{
          top: '24px',
          left: '0px',
          width: '50px',
          height: '12px',
          clipPath: 'polygon(0 0, 100% 100%, 0 100%)',
          background: 'rgba(12, 16, 28, 0.9)',
          boxShadow: 'inset 0 -1px 0 rgba(200, 220, 255, 0.04)',
        }}
      />
      {/* Top-right corner chamfer */}
      <div
        className="absolute"
        style={{
          top: '24px',
          right: '0px',
          width: '180px',
          height: '12px',
          clipPath: 'polygon(100% 0, 0 100%, 100% 100%)',
          background: 'rgba(12, 16, 28, 0.9)',
          boxShadow: 'inset 0 -1px 0 rgba(200, 220, 255, 0.04)',
        }}
      />
      {/* Bottom-left junction rib */}
      <div
        className="absolute"
        style={{
          bottom: '220px',
          left: '0px',
          width: '50px',
          height: '3px',
          background: 'linear-gradient(90deg, rgba(200,220,255,0.06) 0%, rgba(200,220,255,0.02) 100%)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
        }}
      />
      {/* Bottom-right junction rib */}
      <div
        className="absolute"
        style={{
          bottom: '220px',
          right: '0px',
          width: '180px',
          height: '3px',
          background: 'linear-gradient(270deg, rgba(200,220,255,0.06) 0%, rgba(200,220,255,0.02) 100%)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
        }}
      />

      {/* ========== CORNER BRACKETS (viewscreen frame) ========== */}
      {/* Top-left */}
      <div className="absolute top-5 left-[48px]">
        <div className="w-8 h-8 border-t-2 border-l-2" style={{ borderColor: colors.border }} />
        <div className="absolute top-1 left-1 w-[6px] h-[6px] rounded-full border" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      </div>
      {/* Top-right */}
      <div className="absolute top-5 right-[178px]">
        <div className="w-8 h-8 border-t-2 border-r-2" style={{ borderColor: colors.border }} />
        <div className="absolute top-1 right-1 w-[6px] h-[6px] rounded-full border" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      </div>
      {/* Bottom-left */}
      <div className="absolute bottom-[219px] left-[48px]">
        <div className="w-8 h-8 border-b-2 border-l-2" style={{ borderColor: colors.border }} />
        <div className="absolute bottom-1 left-1 w-[6px] h-[6px] rounded-full border" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      </div>
      {/* Bottom-right */}
      <div className="absolute bottom-[219px] right-[178px]">
        <div className="w-8 h-8 border-b-2 border-r-2" style={{ borderColor: colors.border }} />
        <div className="absolute bottom-1 right-1 w-[6px] h-[6px] rounded-full border" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      </div>

      {/* ========== VIEWSCREEN BEVEL / GASKET ========== */}
      {/* Inner glow ring around the viewscreen opening */}
      <div
        className="absolute pointer-events-none"
        style={{
          ...VIEWPORT_BOUNDS,
          boxShadow: `inset 0 0 12px ${colors.glow}, inset 0 0 2px rgba(0,0,0,0.8)`,
          border: '2px solid rgba(30, 30, 40, 0.9)',
          borderRadius: '2px',
        }}
      />

      {/* ========== BOTTOM DASHBOARD FRAME ========== */}
      <div className="absolute bottom-0 left-0 right-0 h-[220px] hull-metal-h">
        {/* Angled top edge (clip-path for slight dashboard tilt feel) */}
        <div
          className="absolute top-0 left-0 right-0 h-3"
          style={{
            background: 'linear-gradient(180deg, rgba(20, 28, 50, 1) 0%, rgba(10, 14, 26, 1) 100%)',
            clipPath: 'polygon(0 40%, 100% 0%, 100% 100%, 0 100%)',
          }}
        />

        {/* Top accent line */}
        <div className="absolute top-0 left-[5%] right-[5%] h-px" style={{ background: `linear-gradient(90deg, transparent, ${colors.border}, transparent)` }} />

        {/* Panel seam across dashboard */}
        <div className="absolute top-[45%] left-0 right-0 h-px hull-seam" />

        {/* Stencil markings */}
        <div className="hull-stencil absolute top-1 left-4">DASH-C1</div>
        <div className="hull-stencil absolute top-1 right-4">PWR-BUS 01</div>

        {/* Ventilation grille strip (between dashboard and side frames) */}
        <div className="absolute top-3 left-0 w-12 h-[40px] vent-grille" />
        <div className="absolute top-3 right-0 w-12 h-[40px] vent-grille" />

        {/* Power conduit channels (thin grooves) */}
        <div className="absolute bottom-8 left-[10%] right-[10%] h-[2px]" style={{ background: 'rgba(0, 240, 255, 0.06)', animation: 'conduit-pulse 4s ease-in-out infinite' }} />

        {/* Grip edge / lip at the very bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-black/60 to-transparent" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }} />

        {/* Emergency override strip */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
          <div className="hull-stencil tracking-[3px]" style={{ color: 'rgba(255,255,255,0.05)' }}>
            MANUAL OVERRIDE
          </div>
        </div>

        {/* Scuff marks near console area */}
        <div className="absolute top-8 left-[15%] right-[15%] bottom-12 hull-scuffs" />
      </div>
    </div>
  );
}
