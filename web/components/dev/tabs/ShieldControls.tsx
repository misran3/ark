'use client';

import { useState } from 'react';
import { useShieldStore } from '@/lib/stores/shield-store';
import { SHIELD_SCENARIOS } from '@/lib/dev/shield-scenarios';

export function ShieldControls() {
  const { shields, updateShield, applyDamage, applyDeflection } = useShieldStore();
  const [selectedShield, setSelectedShield] = useState<'life-support' | 'recreation-deck' | 'warp-fuel'>('life-support');

  // Shared inline styles
  const containerStyle: React.CSSProperties = {
    fontFamily: 'system-ui, -apple-system, monospace',
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.8)',
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    marginBottom: '8px',
    letterSpacing: '0.5px',
  };

  const shieldControlStyle: React.CSSProperties = {
    marginBottom: '12px',
    padding: '8px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '4px',
  };

  const shieldHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '6px',
    fontSize: '11px',
  };

  const shieldNameStyle: React.CSSProperties = {
    fontWeight: 500,
    color: 'rgba(255, 255, 255, 0.9)',
    minWidth: '100px',
  };

  const shieldStatusStyle: React.CSSProperties = {
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '3px',
    background: 'rgba(139, 92, 246, 0.1)',
    color: '#a78bfa',
    fontWeight: 500,
  };

  const sliderStyle: React.CSSProperties = {
    width: '100%',
    height: '20px',
    borderRadius: '3px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    marginBottom: '6px',
  };

  const quickButtonGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    marginBottom: '0',
  };

  const quickButtonStyle: React.CSSProperties = {
    flex: 1,
    padding: '4px 6px',
    fontSize: '10px',
    fontWeight: 500,
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '3px',
    color: 'rgba(255, 255, 255, 0.7)',
    cursor: 'pointer',
    transition: 'all 150ms ease',
  };

  const eventTriggerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const dropdownStyle: React.CSSProperties = {
    padding: '4px 6px',
    fontSize: '11px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '3px',
    color: 'rgba(255, 255, 255, 0.8)',
    cursor: 'pointer',
    fontFamily: 'system-ui, -apple-system, monospace',
  };

  const eventButtonStyle: React.CSSProperties = {
    padding: '6px 8px',
    fontSize: '11px',
    fontWeight: 500,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '3px',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    color: 'rgba(255, 255, 255, 0.8)',
  };

  const damageButtonStyle: React.CSSProperties = {
    ...eventButtonStyle,
    background: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  };

  const deflectionButtonStyle: React.CSSProperties = {
    ...eventButtonStyle,
    background: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  };

  const catastrophicButtonStyle: React.CSSProperties = {
    ...eventButtonStyle,
    background: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
    color: '#fca5a5',
    fontWeight: 600,
  };

  const resetAllButtonStyle: React.CSSProperties = {
    ...eventButtonStyle,
    background: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  };

  const scenarioButtonGroupStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
  };

  const scenarioButtonStyle: React.CSSProperties = {
    padding: '6px 8px',
    fontSize: '10px',
    fontWeight: 500,
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '3px',
    color: '#c4b5fd',
    cursor: 'pointer',
    transition: 'all 150ms ease',
  };

  // Get the shield objects
  const shieldIds = ['life-support', 'recreation-deck', 'warp-fuel'] as const;
  const shieldList = shieldIds.map((id) => shields[id]);

  // Event handlers
  const handleApplyDamage = () => {
    applyDamage(selectedShield, 15);
  };

  const handleApplyDeflection = () => {
    applyDeflection(selectedShield, 10);
  };

  const handleCatastrophic = () => {
    shieldIds.forEach((id) => {
      applyDamage(id, 25);
    });
  };

  const handleResetAll = () => {
    updateShield('life-support', 82);
    updateShield('recreation-deck', 42);
    updateShield('warp-fuel', 91);
  };

  const handleScenario = (scenarioName: string) => {
    const scenario = SHIELD_SCENARIOS[scenarioName];
    if (scenario) {
      Object.entries(scenario).forEach(([shieldId, percent]) => {
        updateShield(shieldId, percent);
      });
    }
  };

  return (
    <div style={containerStyle}>
      {/* Per-Shield Controls */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Per-Shield Controls</div>
        {shieldList.map((shield) => (
          <div key={shield.id} style={shieldControlStyle}>
            {/* Header with name, icon, and status */}
            <div style={shieldHeaderStyle}>
              <span>{shield.icon}</span>
              <span style={shieldNameStyle}>{shield.name}</span>
              <span style={shieldStatusStyle}>{shield.status.toUpperCase()}</span>
            </div>

            {/* Percentage display and slider */}
            <div style={{ marginBottom: '6px', fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)' }}>
              {shield.currentPercent}%
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={shield.currentPercent}
              onChange={(e) => updateShield(shield.id, parseInt(e.target.value, 10))}
              style={sliderStyle}
            />

            {/* Quick-set buttons */}
            <div style={quickButtonGroupStyle}>
              {[0, 50, 100].map((percent) => (
                <button
                  key={percent}
                  onClick={() => updateShield(shield.id, percent)}
                  style={quickButtonStyle}
                  onMouseEnter={(e) => {
                    if (e.currentTarget instanceof HTMLElement) {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (e.currentTarget instanceof HTMLElement) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                >
                  {percent}%
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Event Triggers */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Event Triggers</div>
        <div style={eventTriggerStyle}>
          {/* Target dropdown */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>Target:</span>
            <select
              value={selectedShield}
              onChange={(e) => setSelectedShield(e.target.value as any)}
              style={dropdownStyle}
            >
              <option value="life-support">Life Support</option>
              <option value="recreation-deck">Recreation Deck</option>
              <option value="warp-fuel">Warp Fuel</option>
            </select>
          </div>

          {/* Damage and Deflection buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handleApplyDamage}
              style={damageButtonStyle}
              onMouseEnter={(e) => {
                if (e.currentTarget instanceof HTMLElement) {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (e.currentTarget instanceof HTMLElement) {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                }
              }}
            >
              DAMAGE -15%
            </button>
            <button
              onClick={handleApplyDeflection}
              style={deflectionButtonStyle}
              onMouseEnter={(e) => {
                if (e.currentTarget instanceof HTMLElement) {
                  e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (e.currentTarget instanceof HTMLElement) {
                  e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)';
                }
              }}
            >
              GAIN +10%
            </button>
          </div>

          {/* Catastrophic button */}
          <button
            onClick={handleCatastrophic}
            style={catastrophicButtonStyle}
            onMouseEnter={(e) => {
              if (e.currentTarget instanceof HTMLElement) {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (e.currentTarget instanceof HTMLElement) {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              }
            }}
          >
            CATASTROPHIC: -25% ALL SHIELDS
          </button>

          {/* Reset All button */}
          <button
            onClick={handleResetAll}
            style={resetAllButtonStyle}
            onMouseEnter={(e) => {
              if (e.currentTarget instanceof HTMLElement) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (e.currentTarget instanceof HTMLElement) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }
            }}
          >
            RESET ALL
          </button>
        </div>
      </div>

      {/* Scenario Presets */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Scenario Presets</div>
        <div style={scenarioButtonGroupStyle}>
          {Object.keys(SHIELD_SCENARIOS).map((scenarioName) => (
            <button
              key={scenarioName}
              onClick={() => handleScenario(scenarioName)}
              style={scenarioButtonStyle}
              onMouseEnter={(e) => {
                if (e.currentTarget instanceof HTMLElement) {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (e.currentTarget instanceof HTMLElement) {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                }
              }}
            >
              {scenarioName}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
