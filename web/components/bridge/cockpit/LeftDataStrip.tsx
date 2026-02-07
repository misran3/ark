// web/components/bridge/cockpit/LeftDataStrip.tsx
'use client';

import { useEffect, useState } from 'react';
import { useShieldStore } from '@/lib/stores/shield-store';
import { useAlertStore, ALERT_COLORS } from '@/lib/stores/alert-store';

export function LeftDataStrip() {
  const overallPercent = useShieldStore((state) => state.overallPercent);
  const alertLevel = useAlertStore((state) => state.level);
  const colors = ALERT_COLORS[alertLevel];
  const [missionTime, setMissionTime] = useState('00:00:00');

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
      const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
      const s = String(elapsed % 60).padStart(2, '0');
      setMissionTime(`${h}:${m}:${s}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute top-6 left-0 w-[50px] bottom-[220px] z-15 pointer-events-none flex flex-col items-center pt-16 gap-6">
      {/* Mission clock */}
      <div className="flex flex-col items-center gap-1">
        <div className="hull-stencil" style={{ fontSize: '6px', color: 'rgba(255,255,255,0.12)' }}>
          MISSION
        </div>
        <div
          className="font-mono text-[7px] tracking-wider"
          style={{ color: colors.hud, writingMode: 'vertical-lr', textOrientation: 'mixed' }}
        >
          {missionTime}
        </div>
      </div>

      {/* Power readout bar */}
      <div className="flex flex-col items-center gap-1">
        <div className="hull-stencil" style={{ fontSize: '6px', color: 'rgba(255,255,255,0.12)' }}>
          PWR
        </div>
        <div className="w-[6px] h-20 bg-black/40 rounded-sm overflow-hidden relative">
          <div
            className="absolute bottom-0 left-0 right-0 rounded-sm transition-all duration-1000"
            style={{
              height: `${Math.round(overallPercent)}%`,
              background: `linear-gradient(0deg, ${colors.hud}, transparent)`,
              opacity: 0.6,
            }}
          />
        </div>
      </div>

      {/* Hull integrity indicator */}
      <div className="flex flex-col items-center gap-1">
        <div className="hull-stencil" style={{ fontSize: '6px', color: 'rgba(255,255,255,0.12)' }}>
          HULL
        </div>
        <div className="font-mono text-[7px]" style={{ color: colors.hud, opacity: 0.5 }}>
          98%
        </div>
      </div>
    </div>
  );
}
