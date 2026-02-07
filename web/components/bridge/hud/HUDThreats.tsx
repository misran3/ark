'use client';

import { useThreatStore } from '@/lib/stores/threat-store';
import { useAlertStore, ALERT_COLORS } from '@/lib/stores/alert-store';

const THREAT_ICONS: Record<string, string> = {
  asteroid: '\u2604\uFE0F',
  ion_storm: '\u26A1',
  solar_flare: '\u2600\uFE0F',
  black_hole: '\uD83C\uDF11',
  wormhole: '\uD83C\uDF00',
  enemy_cruiser: '\uD83D\uDE80',
};

const SEVERITY_COLORS: Record<string, string> = {
  danger: 'rgba(239, 68, 68, 0.6)',
  warning: 'rgba(251, 191, 36, 0.5)',
  info: 'rgba(59, 130, 246, 0.4)',
};

function getDistance(pos: [number, number, number]): number {
  return Math.sqrt(pos[0] ** 2 + pos[1] ** 2 + pos[2] ** 2);
}

export function HUDThreats() {
  const allThreats = useThreatStore((state) => state.threats);
  const threats = allThreats.filter((t) => !t.deflected);
  const alertLevel = useAlertStore((state) => state.level);
  const colors = ALERT_COLORS[alertLevel];

  // Sort by distance (closest first)
  const sorted = [...threats].sort(
    (a, b) => getDistance(a.position) - getDistance(b.position)
  );

  return (
    <div className="w-56 relative">
      {/* Holographic ghost layer (chromatic aberration) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: 'translate(1px, -0.5px)',
          opacity: 0.15,
          filter: 'hue-rotate(30deg)',
        }}
      >
        <div className="w-full h-full border border-cyan-400/20 rounded" />
      </div>

      {/* Main container */}
      <div className="relative rounded p-2.5" style={{ background: 'rgba(0, 0, 0, 0.15)' }}>
        {/* Corner brackets */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l" style={{ borderColor: colors.border }} />
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r" style={{ borderColor: colors.border }} />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l" style={{ borderColor: colors.border }} />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r" style={{ borderColor: colors.border }} />

        {/* Header */}
        <div className="font-orbitron text-[8px] tracking-[2px] uppercase mb-2" style={{ color: colors.hud, opacity: 0.7 }}>
          Active Threats
        </div>

        {/* Threat list */}
        <div className="space-y-1.5">
          {sorted.length === 0 ? (
            <div className="font-mono text-[9px]" style={{ color: colors.hud, opacity: 0.3 }}>
              No active threats detected
            </div>
          ) : (
            sorted.map((threat) => {
              const dist = getDistance(threat.position);
              const maxDist = 35;
              const opacity = Math.max(0.4, 1 - (dist / maxDist) * 0.6);
              const pulseSpeed = Math.max(0.5, 2 - (dist / maxDist) * 1.5);
              const isClosing = threat.position[2] > -20; // rough heuristic

              return (
                <div
                  key={threat.id}
                  className="flex items-start gap-1.5 p-1.5 rounded relative"
                  style={{
                    opacity,
                    borderLeft: `2px solid ${SEVERITY_COLORS[threat.severity]}`,
                    background: 'rgba(0, 240, 255, 0.02)',
                  }}
                >
                  {/* Proximity pip */}
                  <div className="flex items-center gap-0.5 flex-shrink-0 pt-0.5">
                    <div
                      className="w-[5px] h-[5px] rounded-full"
                      style={{
                        background: SEVERITY_COLORS[threat.severity],
                        animation: `status-light-pulse ${pulseSpeed}s ease-in-out infinite`,
                      }}
                    />
                    {/* Approach/recede arrow */}
                    <span className="text-[6px]" style={{ color: SEVERITY_COLORS[threat.severity] }}>
                      {isClosing ? '\u25B6' : '\u25C0'}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="text-sm flex-shrink-0">{THREAT_ICONS[threat.type] || '\u26A0\uFE0F'}</div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-rajdhani text-[10px] font-semibold" style={{ color: colors.hud }}>
                      {threat.label}
                    </div>
                    <div className="font-mono text-[8px]" style={{ color: colors.hud, opacity: 0.5 }}>
                      {threat.detail}
                    </div>
                  </div>

                  {/* Severity badge */}
                  <div
                    className="font-orbitron text-[7px] px-1 py-0.5 rounded flex-shrink-0"
                    style={{
                      background: `${SEVERITY_COLORS[threat.severity]}20`,
                      color: SEVERITY_COLORS[threat.severity],
                    }}
                  >
                    {threat.severity.toUpperCase()}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
