'use client';

import { useState } from 'react';
import { useVoiceSynthesis } from '@/hooks/useVoiceSynthesis';
import { useNovaVariant } from '@/contexts/NovaVariantContext';
import { getVoiceProfileForVariant, type VoiceProfile } from '@/lib/voice-profiles';

export function NovaControls() {
  const [text, setText] = useState('');
  const [rateOverride, setRateOverride] = useState<number | null>(null);
  const [pitchOverride, setPitchOverride] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  const { speak, cancel: cancelSpeech, isSpeaking } = useVoiceSynthesis();
  const { activeVariant } = useNovaVariant();
  const baseProfile = getVoiceProfileForVariant(activeVariant);

  // Build effective profile: base from variant, with optional slider overrides
  const effectiveProfile: VoiceProfile = {
    ...baseProfile,
    ...(rateOverride !== null && { rate: rateOverride }),
    ...(pitchOverride !== null && { pitch: pitchOverride }),
  };

  const handleSpeak = (textToSpeak: string) => {
    if (!textToSpeak.trim()) return;
    speak(textToSpeak, effectiveProfile);
  };

  const handleQuickMessage = (message: string) => {
    setText(message);
    setTimeout(() => handleSpeak(message), 0);
  };

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

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    fontSize: '11px',
    fontFamily: 'monospace',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '3px',
    color: 'white',
    resize: 'none',
    marginBottom: '8px',
    boxSizing: 'border-box',
  };

  const buttonGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    marginBottom: '12px',
  };

  const buttonStyle: React.CSSProperties = {
    flex: 1,
    padding: '6px 8px',
    fontSize: '10px',
    fontWeight: 500,
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '3px',
    color: 'rgba(255, 255, 255, 0.7)',
    cursor: 'pointer',
    transition: 'all 150ms ease',
  };

  const speakButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    flex: 2,
    background: isSpeaking ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
    color: '#86efac',
  };

  const cancelButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
  };

  const quickMessageButtonStyle: React.CSSProperties = {
    padding: '6px 8px',
    fontSize: '10px',
    fontWeight: 500,
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '3px',
    color: '#c4b5fd',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    width: '100%',
    marginBottom: '4px',
  };

  const controlGroupStyle: React.CSSProperties = {
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    color: 'rgba(255, 255, 255, 0.6)',
    minWidth: '60px',
  };

  const sliderContainerStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const sliderStyle: React.CSSProperties = {
    flex: 1,
    height: '20px',
    borderRadius: '3px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
  };

  const valueDisplayStyle: React.CSSProperties = {
    fontSize: '10px',
    color: 'rgba(255, 255, 255, 0.6)',
    minWidth: '30px',
    textAlign: 'right',
  };

  const resetButtonStyle: React.CSSProperties = {
    padding: '2px 6px',
    fontSize: '9px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '3px',
    color: 'rgba(255, 255, 255, 0.4)',
    cursor: 'pointer',
    transition: 'all 150ms ease',
  };

  const toggleStyle: React.CSSProperties = {
    padding: '4px 8px',
    fontSize: '10px',
    fontWeight: 500,
    background: isVisible ? 'rgba(34, 197, 94, 0.1)' : 'rgba(107, 114, 128, 0.1)',
    border: isVisible ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(107, 114, 128, 0.3)',
    borderRadius: '3px',
    color: isVisible ? '#86efac' : 'rgba(255, 255, 255, 0.5)',
    cursor: 'pointer',
    transition: 'all 150ms ease',
  };

  const variantBadgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: '10px',
    fontWeight: 600,
    background: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    borderRadius: '3px',
    color: '#7dd3fc',
    letterSpacing: '0.5px',
  };

  // Quick messages
  const quickMessages = [
    {
      label: 'Status Report',
      text: 'All systems nominal, Commander. Your financial position is stable. No immediate threats detected in your sector.',
    },
    {
      label: 'Threat Alert',
      text: 'Warning, Commander! New financial threat detected. Recommend immediate analysis and potential deflection.',
    },
    {
      label: 'Damage Report',
      text: 'Damage report, Commander. Shield integrity compromised. Reviewing impact on financial defenses.',
    },
    {
      label: 'Victory',
      text: 'Excellent work, Commander! Threat successfully deflected. Your financial shields remain strong.',
    },
  ];

  return (
    <div style={containerStyle}>
      {/* Active Variant */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Active Voice</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={variantBadgeStyle}>{activeVariant.label}</span>
          <span style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.35)' }}>
            pitch {effectiveProfile.pitch.toFixed(2)} / rate {effectiveProfile.rate.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Speech Input */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Speech Input</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type custom message..."
          rows={3}
          style={textareaStyle}
        />
        <div style={buttonGroupStyle}>
          <button
            onClick={() => handleSpeak(text)}
            style={speakButtonStyle}
            onMouseEnter={(e) => {
              if (e.currentTarget instanceof HTMLElement) {
                e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (e.currentTarget instanceof HTMLElement) {
                e.currentTarget.style.background = isSpeaking ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.1)';
              }
            }}
          >
            {isSpeaking ? 'SPEAKING...' : 'SPEAK'}
          </button>
          <button
            onClick={cancelSpeech}
            style={cancelButtonStyle}
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
            CANCEL
          </button>
        </div>
      </div>

      {/* Quick Messages */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Quick Messages</div>
        {quickMessages.map((msg) => (
          <button
            key={msg.label}
            onClick={() => handleQuickMessage(msg.text)}
            style={quickMessageButtonStyle}
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
            {msg.label}
          </button>
        ))}
      </div>

      {/* Voice Controls (overrides) */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={sectionTitleStyle}>Voice Overrides</div>
          <button
            onClick={() => { setRateOverride(null); setPitchOverride(null); }}
            style={resetButtonStyle}
          >
            RESET TO PROFILE
          </button>
        </div>

        {/* Rate Slider */}
        <div style={controlGroupStyle}>
          <label style={{
            ...labelStyle,
            color: rateOverride !== null ? '#fbbf24' : labelStyle.color,
          }}>
            Rate{rateOverride !== null ? '*' : ''}
          </label>
          <div style={sliderContainerStyle}>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={rateOverride ?? baseProfile.rate}
              onChange={(e) => setRateOverride(parseFloat(e.target.value))}
              style={sliderStyle}
            />
            <span style={valueDisplayStyle}>{(rateOverride ?? baseProfile.rate).toFixed(2)}</span>
          </div>
        </div>

        {/* Pitch Slider */}
        <div style={controlGroupStyle}>
          <label style={{
            ...labelStyle,
            color: pitchOverride !== null ? '#fbbf24' : labelStyle.color,
          }}>
            Pitch{pitchOverride !== null ? '*' : ''}
          </label>
          <div style={sliderContainerStyle}>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={pitchOverride ?? baseProfile.pitch}
              onChange={(e) => setPitchOverride(parseFloat(e.target.value))}
              style={sliderStyle}
            />
            <span style={valueDisplayStyle}>{(pitchOverride ?? baseProfile.pitch).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Visibility Toggle */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Display</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px' }}>Captain Nova Visible</span>
          <button
            onClick={() => setIsVisible(!isVisible)}
            style={toggleStyle}
            onMouseEnter={(e) => {
              if (e.currentTarget instanceof HTMLElement) {
                const bgColor = isVisible ? 'rgba(34, 197, 94, 0.2)' : 'rgba(107, 114, 128, 0.2)';
                e.currentTarget.style.background = bgColor;
              }
            }}
            onMouseLeave={(e) => {
              if (e.currentTarget instanceof HTMLElement) {
                const bgColor = isVisible ? 'rgba(34, 197, 94, 0.1)' : 'rgba(107, 114, 128, 0.1)';
                e.currentTarget.style.background = bgColor;
              }
            }}
          >
            {isVisible ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  );
}
