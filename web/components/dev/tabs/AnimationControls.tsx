'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { useDevStore } from '@/lib/stores/dev-store';
import { useBootStore } from '@/lib/stores/boot-store';
import { storage } from '@/lib/utils/storage';

export function AnimationControls() {
  const {
    animationSpeed,
    isPaused,
    animationToggles,
    setAnimationSpeed,
    togglePause,
    setAnimationToggle,
  } = useDevStore();

  // Update GSAP global timeline when speed changes
  useEffect(() => {
    gsap.globalTimeline.timeScale(animationSpeed);
  }, [animationSpeed]);

  const speedPresets = [0.25, 0.5, 1, 2];

  const toggleLabels: Record<string, string> = {
    pageTransitions: 'Page transitions',
    threatAnimations: 'Threat animations',
    shieldAnimations: 'Shield animations',
    auroraColorCycle: 'Aurora color cycle',
    captainNovaBreathing: 'Captain Nova breathing',
    starfieldTwinkling: 'Starfield twinkling',
    particleSystems: 'Particle systems',
    cameraController: 'Camera controller',
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const buttonRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  };

  const presetButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '4px 8px',
    fontSize: '10px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '3px',
    background: isActive
      ? 'rgba(167, 139, 250, 0.3)'
      : 'rgba(255, 255, 255, 0.05)',
    color: isActive ? '#a78bfa' : 'rgba(255, 255, 255, 0.6)',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    fontFamily: 'monospace',
    whiteSpace: 'nowrap',
    flex: '1 1 auto',
    minWidth: '40px',
  });

  const pauseResumeButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '6px 10px',
    fontSize: '10px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '3px',
    background: isActive
      ? 'rgba(167, 139, 250, 0.3)'
      : 'rgba(255, 255, 255, 0.05)',
    color: isActive ? '#a78bfa' : 'rgba(255, 255, 255, 0.6)',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    fontFamily: 'monospace',
    fontWeight: 500,
    flex: 1,
  });

  const sliderContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  };

  const sliderStyle: React.CSSProperties = {
    flex: 1,
    height: '20px',
    borderRadius: '3px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    accentColor: '#a78bfa',
  };

  const speedDisplayStyle: React.CSSProperties = {
    minWidth: '35px',
    textAlign: 'right',
    fontSize: '11px',
    color: '#a78bfa',
    fontFamily: 'monospace',
    fontWeight: 600,
  };

  const checkboxContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  };

  const checkboxRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.7)',
  };

  const checkboxStyle: React.CSSProperties = {
    accentColor: '#a78bfa',
    cursor: 'pointer',
    width: '16px',
    height: '16px',
  };

  const checkboxLabelStyle: React.CSSProperties = {
    cursor: 'pointer',
    userSelect: 'none',
  };

  return (
    <div style={containerStyle}>
      {/* Speed Presets */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Speed Presets</div>
        <div style={buttonRowStyle}>
          {speedPresets.map((preset) => (
            <button
              key={preset}
              onClick={() => setAnimationSpeed(preset)}
              style={presetButtonStyle(animationSpeed === preset)}
              onMouseEnter={(e) => {
                if (animationSpeed !== preset && e.currentTarget instanceof HTMLElement) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (animationSpeed !== preset && e.currentTarget instanceof HTMLElement) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }
              }}
            >
              {preset}x
            </button>
          ))}
        </div>
      </div>

      {/* Custom Speed Slider */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Custom Speed</div>
        <div style={sliderContainerStyle}>
          <input
            type="range"
            min="0.1"
            max="5.0"
            step="0.1"
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
            style={sliderStyle}
          />
          <div style={speedDisplayStyle}>{animationSpeed.toFixed(2)}x</div>
        </div>
      </div>

      {/* Pause / Resume */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Playback</div>
        <div style={buttonRowStyle}>
          {isPaused ? (
            <button
              onClick={() => togglePause()}
              style={pauseResumeButtonStyle(true)}
              onMouseEnter={(e) => {
                if (e.currentTarget instanceof HTMLElement) {
                  e.currentTarget.style.background = 'rgba(167, 139, 250, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (e.currentTarget instanceof HTMLElement) {
                  e.currentTarget.style.background = 'rgba(167, 139, 250, 0.3)';
                }
              }}
            >
              RESUME
            </button>
          ) : (
            <button
              onClick={() => togglePause()}
              style={pauseResumeButtonStyle(false)}
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
              PAUSE ALL
            </button>
          )}
        </div>
        <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)' }}>
          Status: {isPaused ? 'PAUSED' : 'RUNNING'}
        </div>
      </div>

      {/* Boot Sequence */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Boot Sequence</div>
        <button
          onClick={() => {
            storage.removeItem('synesthesiapay:hasSeenBoot');
            // Set phase and flags without zeroing consoleIntensity —
            // StartScreen's opaque bg covers everything, and the boot
            // sequence will animate intensity naturally when it replays.
            useBootStore.setState({
              phase: 'start-screen',
              hasSeenBoot: false,
              isBooting: true,
            });
          }}
          style={{
            padding: '6px 10px',
            fontSize: '10px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '3px',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#fca5a5',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            fontFamily: 'monospace',
            fontWeight: 500,
          }}
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
          RESET BOOT (replay first-time sequence)
        </button>
      </div>

      {/* Per-System Toggles */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Animation Systems</div>
        <div style={checkboxContainerStyle}>
          {Object.entries(animationToggles).map(([key, enabled]) => (
            <label key={key} style={checkboxRowStyle}>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setAnimationToggle(key, e.target.checked)}
                style={checkboxStyle}
              />
              <span style={checkboxLabelStyle}>{toggleLabels[key]}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
