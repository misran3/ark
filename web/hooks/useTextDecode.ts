'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
const FRAME_INTERVAL = 30; // ms between scramble frames

/**
 * Character-scramble text reveal effect.
 * Returns the current display string which cycles through random characters
 * before resolving to the target value over ~200ms per character.
 */
export function useTextDecode(
  target: string,
  active: boolean,
  options?: { duration?: number; delay?: number }
) {
  const duration = options?.duration ?? 200;
  const delay = options?.delay ?? 0;
  const [display, setDisplay] = useState(active ? '' : target);
  const [done, setDone] = useState(!active);
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scramble = useCallback(() => {
    const chars = target.split('');
    const totalFrames = Math.ceil(duration / FRAME_INTERVAL);
    let frame = 0;

    const tick = () => {
      frame++;
      const progress = Math.min(frame / totalFrames, 1);
      const revealedCount = Math.floor(progress * chars.length);

      const result = chars
        .map((ch, i) => {
          if (i < revealedCount) return ch;
          if (ch === ' ') return ' ';
          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        })
        .join('');

      setDisplay(result);

      if (progress >= 1) {
        setDisplay(target);
        setDone(true);
      } else {
        rafRef.current = setTimeout(tick, FRAME_INTERVAL);
      }
    };

    rafRef.current = setTimeout(tick, FRAME_INTERVAL);
  }, [target, duration]);

  useEffect(() => {
    if (!active) {
      setDisplay(target);
      setDone(true);
      return;
    }

    setDone(false);
    setDisplay(
      target
        .split('')
        .map((ch) => (ch === ' ' ? ' ' : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]))
        .join('')
    );

    const delayTimer = setTimeout(scramble, delay);

    return () => {
      clearTimeout(delayTimer);
      if (rafRef.current) clearTimeout(rafRef.current);
    };
  }, [active, target, delay, scramble]);

  return { display, done };
}
