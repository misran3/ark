'use client';

import { useThreatStore } from '@/lib/stores/threat-store';
import { useAlertStore, ALERT_COLORS } from '@/lib/stores/alert-store';
import { useMemo } from 'react';

const THREAT_ICONS: Record<string, string> = {
  asteroid: '\u2604\uFE0F',
  ion_storm: '\u26A1',
  solar_flare: '\u2600\uFE0F',
  black_hole: '\uD83C\uDF11',
  wormhole: '\uD83C\uDF00',
  enemy_cruiser: '\uD83D\uDE80',
};

const THREAT_CLASS: Record<string, string> = {
  asteroid: 'KIN',
  ion_storm: 'EM',
  solar_flare: 'RAD',
  black_hole: 'GRAV',
  wormhole: 'ANOM',
  enemy_cruiser: 'HOST',
};

const SEVERITY_COLORS: Record<string, string> = {
  danger: 'rgba(239, 68, 68, 0.6)',
  warning: 'rgba(251, 191, 36, 0.5)',
  info: 'rgba(59, 130, 246, 0.4)',
};

function getDistance(pos: [number, number, number]): number {
  return Math.sqrt(pos[0] ** 2 + pos[1] ** 2 + pos[2] ** 2);
}

function formatBearing(pos: [number, number, number]): string {
  const angle = Math.atan2(pos[0], -pos[2]) * (180 / Math.PI);
  const bearing = ((angle % 360) + 360) % 360;
  return bearing.toFixed(0).padStart(3, '0');
}

export function HUDThreats() {
  const allThreats = useThreatStore((state) => state.threats);
  const threats = allThreats.filter((t) => !t.deflected);
  const alertLevel = useAlertStore((state) => state.level);
  const colors = ALERT_COLORS[alertLevel];

  // Sort by distance (closest first)
  const sorted = useMemo(
    () => [...threats].sort((a, b) => getDistance(a.position) - getDistance(b.position)),
    [threats]
  );

  const totalCount = sorted.length;
  const dangerCount = sorted.filter((t) => t.severity === 'danger').length;

  return (
    <div className="w-64 relative font-mono">
      {/* Holographic ghost layer (chromatic aberration) — no hue-rotate filter (compositing cost) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: 'translate(1px, -0.5px)',
          opacity: 0.15,
        }}
      >
        <div className="w-full h-full border border-cyan-400/20 rounded" />
      </div>

      {/* Holographic bloom backdrop — no blur filter (compositing cost too high over Canvas) */}
      <div
        className="absolute -inset-2 pointer-events-none rounded-lg"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${colors.glow}12 0%, transparent 70%)`,
        }}
      />

      {/* Main container */}
      <div className="relative rounded p-2.5" style={{ background: 'rgba(0, 4, 8, 0.4)' }}>
        {/* Corner brackets */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l" style={{ borderColor: colors.border }} />
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r" style={{ borderColor: colors.border }} />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l" style={{ borderColor: colors.border }} />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r" style={{ borderColor: colors.border }} />

        {/* Header bar */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="font-orbitron text-[8px] tracking-[2px] uppercase" style={{ color: colors.hud, opacity: 0.7 }}>
            Tactical Overview
          </div>
          <div className="text-[7px] tracking-wider" style={{ color: colors.hud, opacity: 0.4 }}>
            TRK: {totalCount}
          </div>
        </div>

        {/* Subheader — scan status line */}
        <div className="flex items-center gap-2 mb-2 pb-1.5" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <div
            className="w-[4px] h-[4px] rounded-full"
            style={{
              background: dangerCount > 0 ? '#ef4444' : '#22c55e',
              boxShadow: `0 0 4px ${dangerCount > 0 ? '#ef4444' : '#22c55e'}`,
              animation: 'status-light-pulse 2s ease-in-out infinite',
            }}
          />
          <div className="text-[7px] tracking-wider uppercase" style={{ color: colors.hud, opacity: 0.5 }}>
            {dangerCount > 0 ? `${dangerCount} HOSTILE — SHIELDS ADVISED` : 'SECTOR NOMINAL'}
          </div>
        </div>

        {/* Threat list */}
        <div className="space-y-1">
          {sorted.length === 0 ? (
            <div className="text-[9px] py-2 text-center" style={{ color: colors.hud, opacity: 0.3 }}>
              No contacts detected
            </div>
          ) : (
            sorted.map((threat) => {
              const dist = getDistance(threat.position);
              const maxDist = 35;
              const opacity = Math.max(0.4, 1 - (dist / maxDist) * 0.6);
              const pulseSpeed = Math.max(0.5, 2 - (dist / maxDist) * 1.5);
              const isClosing = threat.position[2] > -20;
              const bearing = formatBearing(threat.position);

              return (
                <div
                  key={threat.id}
                  className="rounded relative"
                  style={{
                    opacity,
                    borderLeft: `2px solid ${SEVERITY_COLORS[threat.severity]}`,
                    background: 'rgba(0, 240, 255, 0.02)',
                  }}
                >
                  {/* Top row: icon, label, severity */}
                  <div className="flex items-center gap-1.5 px-1.5 pt-1">
                    {/* Proximity pip */}
                    <div
                      className="w-[5px] h-[5px] rounded-full flex-shrink-0"
                      style={{
                        background: SEVERITY_COLORS[threat.severity],
                        animation: `status-light-pulse ${pulseSpeed}s ease-in-out infinite`,
                      }}
                    />
                    {/* Icon */}
                    <div className="text-[10px] flex-shrink-0">{THREAT_ICONS[threat.type] || '\u26A0\uFE0F'}</div>
                    {/* Label */}
                    <div className="flex-1 min-w-0 font-rajdhani text-[10px] font-semibold truncate" style={{ color: colors.hud }}>
                      {threat.label}
                    </div>
                    {/* Severity badge */}
                    <div
                      className="font-orbitron text-[6px] px-1 py-0.5 rounded flex-shrink-0"
                      style={{
                        background: `${SEVERITY_COLORS[threat.severity]}20`,
                        color: SEVERITY_COLORS[threat.severity],
                      }}
                    >
                      {threat.severity.toUpperCase()}
                    </div>
                  </div>

                  {/* Bottom row: tactical data */}
                  <div className="flex items-center gap-2 px-1.5 pb-1 mt-0.5">
                    <span className="text-[7px]" style={{ color: colors.hud, opacity: 0.4 }}>
                      {THREAT_CLASS[threat.type] || 'UNK'}
                    </span>
                    <span className="text-[7px]" style={{ color: colors.hud, opacity: 0.35 }}>
                      BRG {bearing}
                    </span>
                    <span className="text-[7px]" style={{ color: colors.hud, opacity: 0.35 }}>
                      DST {dist.toFixed(1)}
                    </span>
                    <span className="text-[7px]" style={{ color: SEVERITY_COLORS[threat.severity], opacity: 0.6 }}>
                      {isClosing ? '\u25B6 CLOSING' : '\u25C0 RECEDING'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer — coordinate grid reference */}
        <div className="flex items-center justify-between mt-2 pt-1.5" style={{ borderTop: `1px solid ${colors.border}` }}>
          <div className="text-[6px] tracking-wider" style={{ color: colors.hud, opacity: 0.3 }}>
            SCAN RAD: 35.0 AU
          </div>
          <div className="text-[6px] tracking-wider" style={{ color: colors.hud, opacity: 0.3 }}>
            REF: HELIO-J2000
          </div>
        </div>
      </div>
    </div>
  );
}
