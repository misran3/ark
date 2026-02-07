'use client';

import { useState, useEffect, useRef } from 'react';
import { useVoiceSynthesis } from '@/hooks/useVoiceSynthesis';

const initialMessage = "Commander, welcome aboard. I'm Captain Nova, your AI financial officer. All systems are online. I've completed a scan of your financial infrastructure across 3 accounts. Recommend reviewing the threat matrix and activating defensive protocols.";

export default function CaptainNovaUI() {
  const [displayedText, setDisplayedText] = useState('');
  const [currentMessage, setCurrentMessage] = useState(initialMessage);
  const [isTyping, setIsTyping] = useState(false);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1);
  const { speak, cancel, isSpeaking } = useVoiceSynthesis();
  const typewriterTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Auto-speak initial message on mount (with delay)
    const timer = setTimeout(() => {
      speakMessage(initialMessage);
    }, 1000);

    return () => {
      clearTimeout(timer);
      cancel();
      if (typewriterTimeoutRef.current) {
        clearTimeout(typewriterTimeoutRef.current);
      }
    };
  }, []);

  const speakMessage = (text: string) => {
    setCurrentMessage(text);
    setDisplayedText('');
    setIsTyping(true);

    const words = text.split(' ');
    let charIndex = 0;

    // Start voice synthesis with word highlighting
    speak(text, (index, char) => {
      // Find which word we're currently speaking
      let currentCharCount = 0;
      for (let i = 0; i < words.length; i++) {
        currentCharCount += words[i].length + 1; // +1 for space
        if (index < currentCharCount) {
          setHighlightedWordIndex(i);
          break;
        }
      }
    });

    // Typewriter effect
    const typeNextChar = () => {
      if (charIndex < text.length) {
        setDisplayedText(text.substring(0, charIndex + 1));
        charIndex++;
        typewriterTimeoutRef.current = setTimeout(typeNextChar, 50);
      } else {
        setIsTyping(false);
        setHighlightedWordIndex(-1);
      }
    };

    typeNextChar();
  };

  const handleQuickAction = (action: string) => {
    let message = '';
    switch (action) {
      case 'status':
        message = 'Systems nominal, Commander. Net worth at $47,832. Life Support at 72% capacity. Recreation Deck showing strain at 142%. Warp Fuel reserves at 91%. 3 incoming threat objects detected.';
        break;
      case 'threats':
        message = 'Threat scan complete. Priority 1: Gym membership - 47 days dormant, $49.99 per month. Priority 2: Dining overspend - $284 over budget. Priority 3: Streaming services - $31.98 renewing in 48 hours. Combined impact: $365.97 monthly. Recommend immediate deflection.';
        break;
      case 'shields':
        message = 'Commander, I recommend activating spending shields on your dining sector. Shall I set a $25 per transaction limit via VISA Transaction Controls? This will prevent overspend incidents and improve budget compliance by 47%.';
        break;
    }
    speakMessage(message);
  };

  const words = displayedText.split(' ');

  return (
    <div className="absolute left-9 bottom-3 flex items-end gap-3 pointer-events-auto z-20">
      {/* Captain Nova hologram space (rendered by Three.js) */}
      <div className="w-[120px] h-[260px] bg-transparent" />

      {/* Speech bubble */}
      <div className="max-w-[360px] min-w-[260px] glass rounded-tr-[10px] rounded-br-[10px] rounded-bl-[10px] p-3 relative backdrop-blur-[10px] border border-aurora-primary/20 animate-float">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-aurora-primary/25 via-transparent to-transparent" />

        {/* Header */}
        <div className="flex items-center gap-2 mb-2 font-orbitron text-[7px] tracking-[2px] text-aurora-primary/30">
          <div
            className={`w-1 h-1 rounded-full transition-all ${
              isSpeaking
                ? 'bg-green-500 shadow-[0_0_8px_rgb(34,197,94)] animate-pulse'
                : 'bg-green-500/50 shadow-[0_0_4px_rgb(34,197,94)]'
            }`}
          />
          CAPTAIN NOVA — AI FINANCIAL OFFICER
        </div>

        {/* Message with word highlighting */}
        <div className="text-[12px] leading-[1.65] text-text-primary/85 min-h-[60px]">
          {words.map((word, i) => (
            <span
              key={i}
              className={`transition-all duration-100 ${
                i === highlightedWordIndex && isSpeaking
                  ? 'text-aurora-primary font-semibold'
                  : ''
              }`}
            >
              {word}{' '}
            </span>
          ))}
          {isTyping && (
            <span className="inline-block w-[1.5px] h-[11px] bg-aurora-primary animate-pulse align-middle ml-0.5" />
          )}
        </div>

        {/* Tools used */}
        <div className="flex gap-1 mt-2 flex-wrap">
          <span className="px-2 py-0.5 rounded-md text-[7px] font-mono bg-aurora-primary/5 border border-aurora-primary/10 text-aurora-primary/40">
            financial_snapshot
          </span>
          <span className="px-2 py-0.5 rounded-md text-[7px] font-mono bg-aurora-primary/5 border border-aurora-primary/10 text-aurora-primary/40">
            threat_scanner
          </span>
          {isSpeaking && (
            <span className="px-2 py-0.5 rounded-md text-[7px] font-mono bg-green-500/10 border border-green-500/20 text-green-500/60 animate-pulse-slow">
              voice_synthesis
            </span>
          )}
        </div>

        {/* Quick action buttons */}
        <div className="flex gap-1 mt-2">
          <button
            onClick={() => handleQuickAction('status')}
            disabled={isTyping}
            className="px-3 py-1 rounded-[3px] border border-aurora-primary/15 bg-aurora-primary/5 text-aurora-primary/50 font-orbitron text-[7px] tracking-[2px] hover:bg-aurora-primary/10 hover:text-aurora-primary hover:border-aurora-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            STATUS
          </button>
          <button
            onClick={() => handleQuickAction('threats')}
            disabled={isTyping}
            className="px-3 py-1 rounded-[3px] border border-aurora-primary/15 bg-aurora-primary/5 text-aurora-primary/50 font-orbitron text-[7px] tracking-[2px] hover:bg-aurora-primary/10 hover:text-aurora-primary hover:border-aurora-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            THREATS
          </button>
          <button
            onClick={() => handleQuickAction('shields')}
            disabled={isTyping}
            className="px-3 py-1 rounded-[3px] border border-red-500/15 bg-red-500/5 text-red-500/50 font-orbitron text-[7px] tracking-[2px] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            SHIELDS
          </button>
        </div>
      </div>
    </div>
  );
}
