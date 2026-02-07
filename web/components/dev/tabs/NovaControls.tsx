'use client';

import { useState } from 'react';

export function NovaControls() {
  const [text, setText] = useState('');
  const [rate, setRate] = useState(0.95);
  const [pitch, setPitch] = useState(0.90);
  const [isVisible, setIsVisible] = useState(true);

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
    background: 'rgba(34, 197, 94, 0.1)',
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

  // Speech synthesis function
  const speak = (textToSpeak: string) => {
    if (!textToSpeak.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = rate;
    utterance.pitch = pitch;
    window.speechSynthesis.speak(utterance);
  };

  // Quick message handler
  const handleQuickMessage = (message: string) => {
    setText(message);
    setTimeout(() => {
      speak(message);
    }, 0);
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
            onClick={() => speak(text)}
            style={speakButtonStyle}
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
            SPEAK
          </button>
          <button
            onClick={() => window.speechSynthesis.cancel()}
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

      {/* Voice Controls */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Voice Controls</div>

        {/* Rate Slider */}
        <div style={controlGroupStyle}>
          <label style={labelStyle}>Rate</label>
          <div style={sliderContainerStyle}>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              style={sliderStyle}
            />
            <span style={valueDisplayStyle}>{rate.toFixed(2)}</span>
          </div>
        </div>

        {/* Pitch Slider */}
        <div style={controlGroupStyle}>
          <label style={labelStyle}>Pitch</label>
          <div style={sliderContainerStyle}>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              style={sliderStyle}
            />
            <span style={valueDisplayStyle}>{pitch.toFixed(2)}</span>
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
