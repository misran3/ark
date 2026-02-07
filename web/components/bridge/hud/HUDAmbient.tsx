// web/components/bridge/hud/HUDAmbient.tsx
'use client';

import { useShieldStore } from '@/lib/stores/shield-store';
import { useAlertStore, ALERT_COLORS } from '@/lib/stores/alert-store';
import { VIEWPORT_BOUNDS } from '@/lib/constants/cockpit-layout';

export function HUDAmbient() {
  const overallPercent = useShieldStore((state) => state.overallPercent);
  const alertLevel = useAlertStore((state) => state.level);
  const colors = ALERT_COLORS[alertLevel];

  return (
    <div className="absolute inset-0 pointer-events-none z-25" aria-hidden="true">
      {/* Horizon reference line */}
      <div
        className="absolute left-[60px] right-[190px] top-1/2 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${colors.hud}, transparent)`, opacity: 0.025 }}
      >
        {/* Tick marks */}
        <div className="absolute left-[25%] top-0 w-px h-1 -translate-y-1/2" style={{ background: colors.hud, opacity: 0.04 }} />
        <div className="absolute left-[50%] top-0 w-px h-1.5 -translate-y-1/2" style={{ background: colors.hud, opacity: 0.05 }} />
        <div className="absolute left-[75%] top-0 w-px h-1 -translate-y-1/2" style={{ background: colors.hud, opacity: 0.04 }} />
      </div>

      {/* Compass bearing arc (top of viewscreen) */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2">
        <svg width="200" height="20" viewBox="0 0 200 20" className="overflow-visible" style={{ opacity: 0.06 }}>
          <path d="M 20 18 Q 100 2, 180 18" fill="none" stroke={colors.hud} strokeWidth="0.5" />
          {/* Tick marks */}
          {[30, 60, 100, 140, 170].map((x, i) => (
            <line key={i} x1={x} y1={14} x2={x} y2={17} stroke={colors.hud} strokeWidth="0.5" />
          ))}
          {/* Heading number */}
          <text x="100" y="14" textAnchor="middle" fill={colors.hud} fontSize="6" fontFamily="Share Tech Mono">
            000
          </text>
        </svg>
      </div>

      {/* System integrity micro-bar (bottom-left of viewscreen) */}
      <div className="absolute bottom-[230px] left-[55px] flex flex-col items-center gap-0.5">
        <div className="hull-stencil" style={{ fontSize: '5px', color: colors.hud, opacity: 0.15 }}>
          SYS
        </div>
        <div className="w-[4px] h-12 bg-black/20 rounded-sm overflow-hidden relative">
          <div
            className="absolute bottom-0 left-0 right-0 rounded-sm transition-all duration-1000"
            style={{
              height: `${Math.round(overallPercent)}%`,
              background: `linear-gradient(0deg, ${colors.hud}, transparent)`,
              opacity: 0.4,
            }}
          />
        </div>
      </div>

      {/* Sensor sweep line (slow rotation around viewscreen edges) */}
      <div
        className="absolute"
        style={{
          ...VIEWPORT_BOUNDS,
          overflow: 'hidden',
        }}
      >
        <div
          className="absolute top-1/2 left-1/2 w-[150%] h-px origin-left"
          style={{
            background: `linear-gradient(90deg, ${colors.hud}, transparent 40%)`,
            opacity: 0.04,
            animation: 'sensor-sweep 25s linear infinite',
            transformOrigin: '0% 50%',
          }}
        />
      </div>
    </div>
  );
}
