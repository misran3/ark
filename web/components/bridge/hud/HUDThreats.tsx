'use client';

import { useThreatStore } from '@/lib/stores/threat-store';

const THREAT_ICONS: Record<string, string> = {
  asteroid: '\u2604\uFE0F',
  ion_storm: '\u26A1',
  solar_flare: '\u2600\uFE0F',
  black_hole: '\uD83C\uDF11',
  wormhole: '\uD83C\uDF00',
  enemy_cruiser: '\uD83D\uDE80',
};

export function HUDThreats() {
  const threats = useThreatStore((state) => state.threats.filter((t) => !t.deflected));

  return (
    <div className="w-60 bg-black/15 border border-cyan-500/60 rounded p-3 relative">
      {/* Corner brackets */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500/80" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500/80" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500/80" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500/80" />

      {/* Header */}
      <div className="font-orbitron text-[10px] tracking-[2px] text-cyan-400 uppercase mb-3">
        Active Threats
      </div>

      {/* Threat list */}
      <div className="space-y-2">
        {threats.length === 0 ? (
          <div className="font-mono text-xs text-cyan-400/40">
            No active threats detected
          </div>
        ) : (
          threats.map((threat) => (
            <div
              key={threat.id}
              className="flex items-start gap-2 p-2 bg-cyan-500/5 border border-cyan-500/20 rounded"
            >
              <div className="text-lg flex-shrink-0">{THREAT_ICONS[threat.type] || '\u26A0\uFE0F'}</div>
              <div className="flex-1 min-w-0">
                <div className="font-rajdhani text-xs font-semibold text-cyan-300">
                  {threat.label}
                </div>
                <div className="font-mono text-[10px] text-cyan-400/60">
                  {threat.detail}
                </div>
              </div>
              <div
                className={`font-orbitron text-[8px] px-1.5 py-0.5 rounded ${
                  threat.severity === 'danger'
                    ? 'bg-red-500/20 text-red-400'
                    : threat.severity === 'warning'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                {threat.severity.toUpperCase()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
