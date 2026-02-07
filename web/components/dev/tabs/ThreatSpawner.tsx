'use client';

import { useState } from 'react';
import { useThreatStore } from '@/lib/stores/threat-store';
import { THREAT_PRESETS, DEMO_SCENE_THREATS } from '@/lib/dev/threat-presets';

const THREAT_TYPES = [
  'asteroid',
  'ion_storm',
  'solar_flare',
  'black_hole',
  'wormhole',
  'enemy_cruiser',
] as const;

type ThreatType = (typeof THREAT_TYPES)[number];

interface ThreatCardState {
  [key: string]: {
    expanded: boolean;
  };
}

export function ThreatSpawner() {
  const { threats, addThreat, removeThreat, deflectThreat, updateThreat } =
    useThreatStore();
  const [cardStates, setCardStates] = useState<ThreatCardState>({
    asteroid: { expanded: false },
    ion_storm: { expanded: false },
    solar_flare: { expanded: false },
    black_hole: { expanded: false },
    wormhole: { expanded: false },
    enemy_cruiser: { expanded: false },
  });

  const toggleCard = (type: ThreatType) => {
    setCardStates((prev) => ({
      ...prev,
      [type]: { expanded: !prev[type].expanded },
    }));
  };

  const getThreatOfType = (type: ThreatType) => {
    return threats.find((t) => t.type === type);
  };

  const toggleThreat = (type: ThreatType) => {
    const existing = getThreatOfType(type);
    if (existing) {
      removeThreat(existing.id);
    } else {
      const preset = THREAT_PRESETS[type];
      addThreat({
        ...preset,
        id: `dev-${type}-${Date.now()}`,
      });
    }
  };

  const spawnAll = () => {
    THREAT_TYPES.forEach((type) => {
      if (!getThreatOfType(type)) {
        const preset = THREAT_PRESETS[type];
        addThreat({
          ...preset,
          id: `dev-${type}-${Date.now()}`,
        });
      }
    });
  };

  const clearAll = () => {
    threats.forEach((threat) => {
      removeThreat(threat.id);
    });
  };

  const showDemoScene = () => {
    clearAll();
    DEMO_SCENE_THREATS.forEach((threat) => {
      addThreat(threat);
    });
  };

  const handlePositionChange = (
    threatId: string,
    axis: 'x' | 'y' | 'z',
    value: number
  ) => {
    const threat = threats.find((t) => t.id === threatId);
    if (!threat) return;

    const newPosition: [number, number, number] = [...threat.position];
    if (axis === 'x') newPosition[0] = value;
    else if (axis === 'y') newPosition[1] = value;
    else if (axis === 'z') newPosition[2] = value;

    updateThreat(threatId, { position: newPosition });
  };

  const handleSizeChange = (threatId: string, value: number) => {
    updateThreat(threatId, { size: value });
  };

  const handleDeflect = (type: ThreatType) => {
    const threat = getThreatOfType(type);
    if (threat) {
      deflectThreat(threat.id);
    }
  };

  const handleReset = (type: ThreatType) => {
    const threat = getThreatOfType(type);
    if (threat) {
      removeThreat(threat.id);
    }
    const preset = THREAT_PRESETS[type];
    addThreat({
      ...preset,
      id: `dev-${type}-${Date.now()}`,
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '12px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '11px',
        color: '#e0e0e0',
      }}
    >
      {/* Per-threat cards */}
      {THREAT_TYPES.map((type) => {
        const threat = getThreatOfType(type);
        const isActive = !!threat;
        const isExpanded = cardStates[type].expanded;

        return (
          <div
            key={type}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px',
                borderBottom: isExpanded
                  ? '1px solid rgba(255,255,255,0.1)'
                  : 'none',
                cursor: 'pointer',
                userSelect: 'none',
              }}
              onClick={() => toggleCard(type)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    color: isExpanded ? '#a78bfa' : '#e0e0e0',
                    transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    display: 'inline-block',
                  }}
                >
                  ▶
                </span>
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {type.replace(/_/g, ' ')}
                </span>
                {isActive && (
                  <span
                    style={{
                      fontSize: '9px',
                      color: '#60a5fa',
                      background: 'rgba(96, 165, 250, 0.1)',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    ACTIVE
                  </span>
                )}
              </div>

              {/* Toggle button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleThreat(type);
                }}
                style={{
                  background: isActive
                    ? 'rgba(239, 68, 68, 0.1)'
                    : 'rgba(34, 197, 94, 0.1)',
                  border: isActive
                    ? '1px solid rgba(239, 68, 68, 0.3)'
                    : '1px solid rgba(34, 197, 94, 0.3)',
                  color: isActive ? '#fca5a5' : '#86efac',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.opacity = '1';
                }}
              >
                {isActive ? 'OFF' : 'ON'}
              </button>
            </div>

            {/* Expanded content */}
            {isExpanded && threat && (
              <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)' }}>
                {/* Position controls */}
                <div style={{ marginBottom: '12px' }}>
                  <div
                    style={{
                      fontSize: '9px',
                      color: '#a78bfa',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Position
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    {/* X */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label
                        style={{
                          fontSize: '10px',
                          color: '#b4b4b4',
                        }}
                      >
                        X: {threat.position[0].toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min="-10"
                        max="10"
                        step="0.1"
                        value={threat.position[0]}
                        onChange={(e) =>
                          handlePositionChange(threat.id, 'x', parseFloat(e.target.value))
                        }
                        style={{
                          accentColor: '#a78bfa',
                        }}
                      />
                    </div>

                    {/* Y */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label
                        style={{
                          fontSize: '10px',
                          color: '#b4b4b4',
                        }}
                      >
                        Y: {threat.position[1].toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min="-10"
                        max="10"
                        step="0.1"
                        value={threat.position[1]}
                        onChange={(e) =>
                          handlePositionChange(threat.id, 'y', parseFloat(e.target.value))
                        }
                        style={{
                          accentColor: '#a78bfa',
                        }}
                      />
                    </div>

                    {/* Z */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label
                        style={{
                          fontSize: '10px',
                          color: '#b4b4b4',
                        }}
                      >
                        Z: {threat.position[2].toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min="-30"
                        max="-5"
                        step="0.1"
                        value={threat.position[2]}
                        onChange={(e) =>
                          handlePositionChange(threat.id, 'z', parseFloat(e.target.value))
                        }
                        style={{
                          accentColor: '#a78bfa',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Size control */}
                <div style={{ marginBottom: '12px' }}>
                  <div
                    style={{
                      fontSize: '9px',
                      color: '#a78bfa',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Size
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label
                      style={{
                        fontSize: '10px',
                        color: '#b4b4b4',
                      }}
                    >
                      {threat.size.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0.3"
                      max="5.0"
                      step="0.1"
                      value={threat.size}
                      onChange={(e) =>
                        handleSizeChange(threat.id, parseFloat(e.target.value))
                      }
                      style={{
                        accentColor: '#a78bfa',
                      }}
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleDeflect(type)}
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#e0e0e0',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      const target = e.target as HTMLButtonElement;
                      target.style.background = 'rgba(255,255,255,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      const target = e.target as HTMLButtonElement;
                      target.style.background = 'rgba(255,255,255,0.05)';
                    }}
                  >
                    DEFLECT
                  </button>
                  <button
                    onClick={() => handleReset(type)}
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#e0e0e0',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      const target = e.target as HTMLButtonElement;
                      target.style.background = 'rgba(255,255,255,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      const target = e.target as HTMLButtonElement;
                      target.style.background = 'rgba(255,255,255,0.05)';
                    }}
                  >
                    RESET
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Separator */}
      <div
        style={{
          height: '1px',
          background: 'rgba(255,255,255,0.1)',
          margin: '8px 0',
        }}
      />

      {/* Bulk actions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
        }}
      >
        <button
          onClick={spawnAll}
          style={{
            background: 'rgba(139, 92, 246, 0.15)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            color: '#a78bfa',
            borderRadius: '4px',
            padding: '6px 8px',
            fontSize: '10px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.background = 'rgba(139, 92, 246, 0.25)';
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.background = 'rgba(139, 92, 246, 0.15)';
          }}
        >
          SPAWN ALL
        </button>

        <button
          onClick={clearAll}
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            borderRadius: '4px',
            padding: '6px 8px',
            fontSize: '10px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.background = 'rgba(239, 68, 68, 0.25)';
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.background = 'rgba(239, 68, 68, 0.15)';
          }}
        >
          CLEAR ALL
        </button>

        <button
          onClick={showDemoScene}
          style={{
            gridColumn: '1 / -1',
            background: 'rgba(139, 92, 246, 0.15)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            color: '#a78bfa',
            borderRadius: '4px',
            padding: '6px 8px',
            fontSize: '10px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.background = 'rgba(139, 92, 246, 0.25)';
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.background = 'rgba(139, 92, 246, 0.15)';
          }}
        >
          SHOW DEMO SCENE
        </button>
      </div>
    </div>
  );
}
