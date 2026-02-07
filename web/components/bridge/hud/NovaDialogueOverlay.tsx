'use client';

import { useEffect, useState, useRef, memo } from 'react';
import { useNovaDialogueStore } from '@/lib/stores/nova-dialogue-store';
import { useAlertStore, ALERT_COLORS } from '@/lib/stores/alert-store';
import { useVoiceSynthesis } from '@/hooks/useVoiceSynthesis';
import { useNovaVariant } from '@/contexts/NovaVariantContext';
import { getVoiceProfileForVariant } from '@/lib/voice-profiles';

const TYPEWRITER_SPEED = 30; // ms per character
const AUTO_DISMISS_DELAY = 5000; // ms after typewriter completes

/** Typewriter text renderer — isolated timer component */
const TypewriterText = memo(function TypewriterText({
  text,
  onComplete,
}: {
  text: string;
  onComplete: () => void;
}) {
  const [displayed, setDisplayed] = useState('');
  const completeRef = useRef(false);

  useEffect(() => {
    completeRef.current = false;
    setDisplayed('');
    let i = 0;
    const timer = setInterval(() => {
      if (i <= text.length) {
        setDisplayed(text.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
        if (!completeRef.current) {
          completeRef.current = true;
          onComplete();
        }
      }
    }, TYPEWRITER_SPEED);
    return () => clearInterval(timer);
  }, [text, onComplete]);

  return (
    <span>
      {displayed}
      <span className="animate-pulse-slow opacity-60">_</span>
    </span>
  );
});

export function NovaDialogueOverlay() {
  const state = useNovaDialogueStore((s) => s.state);
  const currentMessage = useNovaDialogueStore((s) => s.currentMessage);
  const dismiss = useNovaDialogueStore((s) => s.dismiss);
  const alertLevel = useAlertStore((s) => s.level);
  const colors = ALERT_COLORS[alertLevel];

  const { speak, cancel: cancelSpeech } = useVoiceSynthesis();
  const { activeVariant } = useNovaVariant();

  const [typewriterDone, setTypewriterDone] = useState(false);
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Speak the message using the active variant's voice profile
  useEffect(() => {
    if (currentMessage?.text) {
      const profile = getVoiceProfileForVariant(activeVariant);
      speak(currentMessage.text, profile);
    }
    return () => cancelSpeech();
  }, [currentMessage?.id, activeVariant, speak, cancelSpeech]);

  // Auto-dismiss for greeting and nudge messages after typewriter completes
  useEffect(() => {
    if (typewriterDone && currentMessage && currentMessage.category !== 'detail') {
      autoDismissRef.current = setTimeout(() => {
        dismiss();
      }, AUTO_DISMISS_DELAY);
    }
    return () => {
      if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
    };
  }, [typewriterDone, currentMessage, dismiss]);

  // Reset typewriter state when message changes
  useEffect(() => {
    setTypewriterDone(false);
  }, [currentMessage?.id]);

  if (state === 'idle' || !currentMessage) return null;

  return (
    <div
      className="fixed z-40 font-mono"
      style={{
        right: '192px', // To the left of Nova panel (180px wide + gap)
        top: '60px',
        maxWidth: '320px',
        animation: 'slide-in-right 0.3s ease-out',
      }}
    >
      {/* Holographic bloom */}
      <div
        className="absolute -inset-2 pointer-events-none rounded-lg"
        style={{
          background: `radial-gradient(ellipse at 80% 30%, ${colors.glow}15 0%, transparent 70%)`,
        }}
      />

      {/* Main panel */}
      <div
        className="relative rounded p-3"
        style={{ background: 'rgba(0, 4, 8, 0.88)' }}
      >
        {/* Corner brackets */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l" style={{ borderColor: colors.border }} />
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r" style={{ borderColor: colors.border }} />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l" style={{ borderColor: colors.border }} />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r" style={{ borderColor: colors.border }} />

        {/* CRT scanlines */}
        <div className="absolute inset-0 crt-screen pointer-events-none rounded" />

        {/* Header */}
        <div className="flex items-center gap-2 mb-2 pb-1.5" style={{ borderBottom: `1px solid ${colors.border}` }}>
          {/* Signal indicator */}
          <div
            className="w-[5px] h-[5px] rounded-full flex-shrink-0"
            style={{
              background: '#22c55e',
              boxShadow: '0 0 4px #22c55e',
              animation: 'status-light-pulse 1.5s ease-in-out infinite',
            }}
          />
          <div className="text-[7px] tracking-[2px] uppercase" style={{ color: colors.hud, opacity: 0.6 }}>
            Comm Channel 01
          </div>
        </div>

        {/* Sender */}
        <div className="text-[7px] tracking-wider uppercase mb-1.5" style={{ color: colors.hud, opacity: 0.4 }}>
          Cpt. Nova — Advisory
        </div>

        {/* Message body */}
        <div className="text-[11px] leading-relaxed" style={{ color: colors.hud }}>
          <TypewriterText
            key={currentMessage.id}
            text={currentMessage.text}
            onComplete={() => setTypewriterDone(true)}
          />
        </div>

        {/* Acknowledge button (shown after typewriter completes) */}
        {typewriterDone && currentMessage.category !== 'detail' && (
          <button
            onClick={() => { cancelSpeech(); dismiss(); }}
            className="mt-2 w-full text-[7px] tracking-[2px] uppercase py-1 rounded border transition-colors"
            style={{
              borderColor: `${colors.hud}40`,
              color: `${colors.hud}80`,
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.borderColor = colors.hud;
              (e.target as HTMLElement).style.backgroundColor = `${colors.glow}20`;
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.borderColor = `${colors.hud}40`;
              (e.target as HTMLElement).style.backgroundColor = 'transparent';
            }}
          >
            Acknowledged
          </button>
        )}
      </div>
    </div>
  );
}
