'use client';

import { useState, useEffect, useRef } from 'react';
import { useBootStore } from '@/lib/stores/boot-store';

const BOOT_MESSAGES = [
  'SYNESTHESIAPAY BRIDGE v4.2.0',
  'QUANTUM PROCESSOR ............ ONLINE',
  'THREAT DETECTION ARRAY ....... CALIBRATING',
  'SHIELD GENERATOR ............. STANDBY',
  'NAVIGATION MATRIX ............ SYNCHRONIZED',
  'FINANCIAL SENSORS ............ ACTIVE',
  'HULL INTEGRITY ............... 100%',
  'ALL SYSTEMS OPERATIONAL',
];

const LINE_INTERVAL = 400; // ms between each new line
const CHAR_SPEED = 20; // ms per character

export function BootReadout() {
  const phase = useBootStore((s) => s.phase);
  const [lines, setLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState('');
  const [lineIndex, setLineIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const isActive = ['console-glow', 'power-surge', 'full-power'].includes(phase);
  const isFading = phase === 'full-power';

  // Type out lines one at a time
  useEffect(() => {
    if (!isActive || lineIndex >= BOOT_MESSAGES.length) return;

    const message = BOOT_MESSAGES[lineIndex];
    let charIdx = 0;

    const typeTimer = setInterval(() => {
      charIdx++;
      if (charIdx <= message.length) {
        setCurrentLine(message.slice(0, charIdx));
      } else {
        clearInterval(typeTimer);
        setLines((prev) => [...prev, message]);
        setCurrentLine('');
        setTimeout(() => setLineIndex((i) => i + 1), LINE_INTERVAL);
      }
    }, CHAR_SPEED);

    return () => clearInterval(typeTimer);
  }, [isActive, lineIndex]);

  // Reset on boot restart
  useEffect(() => {
    if (phase === 'start-screen') {
      setLines([]);
      setCurrentLine('');
      setLineIndex(0);
    }
  }, [phase]);

  if (!isActive) return null;

  return (
    <div
      className="fixed z-[37] pointer-events-none font-mono"
      style={{
        top: '15%',
        left: '80px',
        maxWidth: '400px',
        opacity: isFading ? 0 : 0.7,
        transition: 'opacity 0.8s ease-out',
      }}
      ref={containerRef}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          className="text-[10px] leading-relaxed"
          style={{
            color: i === 0 ? 'rgba(0, 240, 255, 0.6)' : 'rgba(0, 240, 255, 0.35)',
          }}
        >
          {line}
        </div>
      ))}
      {currentLine && (
        <div
          className="text-[10px] leading-relaxed"
          style={{ color: 'rgba(0, 240, 255, 0.5)' }}
        >
          {currentLine}
          <span className="animate-pulse">_</span>
        </div>
      )}
    </div>
  );
}
