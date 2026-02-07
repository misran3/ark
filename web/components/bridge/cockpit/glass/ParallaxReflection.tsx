'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAlertStore, type AlertLevel } from '@/lib/stores/alert-store';
import { VIEWPORT_BOUNDS } from '@/lib/constants/cockpit-layout';

/**
 * Layer C — Parallax Reflection (z-6)
 *
 * Semi-transparent layer shifting opposite to mouse movement.
 * - Content: blurred gradient approximation of cockpit interior
 * - Mouse tracking: 5-10px shift opposite to mouse, lerp smoothed
 * - Fade with distance: strongest at bottom, fades by upper third
 * - Breath oscillation: 0.1-0.2% scale over 8-10s
 * - Double reflection: second layer at 30-40% opacity, offset 2-3px
 * - Static fallback: centered when mouse outside viewport
 */
// Alert tint colors per level (subtle overlay on glass)
const ALERT_GLASS_TINT: Record<AlertLevel, string> = {
  normal: 'transparent',
  caution: 'rgba(251, 191, 36, 0.015)',
  alert: 'rgba(249, 115, 22, 0.02)',
  'red-alert': 'rgba(239, 68, 68, 0.025)',
};

export function ParallaxReflection() {
  const primaryRef = useRef<HTMLDivElement>(null);
  const secondaryRef = useRef<HTMLDivElement>(null);

  // Glass responds at cascade stage 'glass' (stage 3)
  const alertLevel = useAlertStore((state) => state.level);
  const cascadeStage = useAlertStore((state) => state.cascadeStage);
  const glassReached = cascadeStage === 'idle' || ['glass', 'backlight', 'instruments'].includes(cascadeStage);
  const glassTint = ALERT_GLASS_TINT[glassReached ? alertLevel : 'normal'];
  const targetX = useRef(0);
  const targetY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const rafId = useRef(0);
  const isHovering = useRef(false);

  const animate = useCallback(() => {
    const lerpFactor = 0.04;
    currentX.current += (targetX.current - currentX.current) * lerpFactor;
    currentY.current += (targetY.current - currentY.current) * lerpFactor;

    const x = currentX.current;
    const y = currentY.current;

    if (primaryRef.current) {
      primaryRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
    if (secondaryRef.current) {
      secondaryRef.current.style.transform = `translate3d(${x * 1.3 + 2}px, ${y * 1.3 + 2}px, 0)`;
    }

    // Stop loop when settled (epsilon check)
    const dx = Math.abs(targetX.current - currentX.current);
    const dy = Math.abs(targetY.current - currentY.current);
    if (dx < 0.01 && dy < 0.01 && !isHovering.current) {
      rafId.current = 0;
      return;
    }

    rafId.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      isHovering.current = true;
      const px = e.clientX / window.innerWidth;
      const py = e.clientY / window.innerHeight;
      targetX.current = -(px - 0.5) * 16;
      targetY.current = -(py - 0.5) * 12;

      // Restart rAF if it stopped due to epsilon convergence
      if (!rafId.current) {
        rafId.current = requestAnimationFrame(animate);
      }
    };

    const onMouseLeave = () => {
      isHovering.current = false;
      targetX.current = 0;
      targetY.current = 0;
      if (!rafId.current) {
        rafId.current = requestAnimationFrame(animate);
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(rafId.current);
    };
  }, [animate]);

  // Shared gradient content: blurred approximation of cockpit interior
  const reflectionGradient =
    'linear-gradient(0deg, ' +
    'rgba(180, 140, 60, 0.06) 0%, ' +        // warm amber from console at bottom
    'rgba(160, 120, 50, 0.04) 15%, ' +        // console glow fading
    'rgba(100, 80, 40, 0.02) 30%, ' +         // ghost shapes
    'rgba(60, 50, 30, 0.008) 50%, ' +         // barely-there mid
    'transparent 70%)';                        // nothing by upper third

  return (
    <div
      className="fixed pointer-events-none overflow-hidden"
      style={{
        ...VIEWPORT_BOUNDS,
        zIndex: 6,
      }}
      aria-hidden="true"
    >
      {/* Primary reflection */}
      <div
        ref={primaryRef}
        className="absolute glass-reflection-breathe"
        style={{
          inset: '-15px', // Larger than viewport to allow shift without edges showing
          background: reflectionGradient,
          filter: 'blur(6px)',
          willChange: 'transform',
        }}
      >
        {/* Ghost shapes suggesting console panel layout — no nested blur (parent already blurred) */}
        <div
          className="absolute"
          style={{
            bottom: '5%',
            left: '15%',
            width: '70%',
            height: '20%',
            background:
              'linear-gradient(90deg, ' +
              'transparent 5%, ' +
              'rgba(180, 150, 80, 0.015) 20%, ' +
              'rgba(140, 120, 60, 0.01) 30%, ' +
              'transparent 32%, ' +
              'rgba(180, 150, 80, 0.012) 45%, ' +
              'rgba(140, 120, 60, 0.008) 55%, ' +
              'transparent 57%, ' +
              'rgba(160, 130, 70, 0.015) 70%, ' +
              'rgba(140, 120, 60, 0.01) 80%, ' +
              'transparent 95%)',
          }}
        />
      </div>

      {/* Double reflection — front surface vs back surface of thick glass */}
      <div
        ref={secondaryRef}
        className="absolute glass-reflection-breathe"
        style={{
          inset: '-15px',
          background: reflectionGradient,
          filter: 'blur(8px)',
          opacity: 0.35,
          willChange: 'transform',
        }}
      />

      {/* Alert tint overlay — glass gains faint color during alerts (cascade stage 3) */}
      <div
        className="absolute inset-0"
        style={{
          background: glassTint,
          transition: 'background 0.4s ease-out',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
