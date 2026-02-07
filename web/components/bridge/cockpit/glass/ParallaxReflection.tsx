'use client';

import { useEffect, useRef, useCallback } from 'react';

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
export function ParallaxReflection() {
  const primaryRef = useRef<HTMLDivElement>(null);
  const secondaryRef = useRef<HTMLDivElement>(null);
  const targetX = useRef(0);
  const targetY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const rafId = useRef(0);
  const isHovering = useRef(false);

  const bounds = {
    top: '24px',
    left: '50px',
    right: '180px',
    bottom: '220px',
  };

  const animate = useCallback(() => {
    // Lerp towards target
    const lerpFactor = 0.04;
    currentX.current += (targetX.current - currentX.current) * lerpFactor;
    currentY.current += (targetY.current - currentY.current) * lerpFactor;

    const x = currentX.current;
    const y = currentY.current;

    if (primaryRef.current) {
      primaryRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
    if (secondaryRef.current) {
      // Double reflection: offset by 2-3px more, 35% opacity handled by CSS
      secondaryRef.current.style.transform = `translate3d(${x * 1.3 + 2}px, ${y * 1.3 + 2}px, 0)`;
    }

    rafId.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      isHovering.current = true;
      // Percentage-based tracking (0-100% of viewport)
      const px = e.clientX / window.innerWidth;
      const py = e.clientY / window.innerHeight;

      // 5-10px shift OPPOSITE to mouse position
      // Center is 0.5, so we invert
      targetX.current = -(px - 0.5) * 16; // ±8px max
      targetY.current = -(py - 0.5) * 12; // ±6px max
    };

    const onMouseLeave = () => {
      isHovering.current = false;
      // Drift back to center
      targetX.current = 0;
      targetY.current = 0;
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
        ...bounds,
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
          filter: 'blur(12px)',
          willChange: 'transform',
        }}
      >
        {/* Ghost shapes suggesting console panel layout */}
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
            filter: 'blur(6px)',
          }}
        />

        {/* Faint status light glows */}
        <div
          className="absolute"
          style={{
            bottom: '25%',
            left: '8%',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'rgba(100, 200, 100, 0.02)',
            filter: 'blur(4px)',
          }}
        />
        <div
          className="absolute"
          style={{
            bottom: '30%',
            right: '5%',
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'rgba(80, 180, 200, 0.015)',
            filter: 'blur(4px)',
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
          filter: 'blur(16px)',
          opacity: 0.35,
          willChange: 'transform',
        }}
      />
    </div>
  );
}
