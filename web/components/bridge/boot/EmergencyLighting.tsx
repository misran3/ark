'use client';

import { useEffect, useState } from 'react';

export function EmergencyLighting() {
  const [opacity, setOpacity] = useState(0);
  const [pulseIntensity, setPulseIntensity] = useState(0.25);
  const [ledState, setLedState] = useState<'off' | 'stuttering' | 'steady'>('off');

  // Fade in over 800-1000ms with ease-in
  useEffect(() => {
    const startTime = Date.now();
    const duration = 900;

    const fadeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-in curve (starts slow, accelerates)
      const eased = Math.pow(progress, 2);
      setOpacity(eased);

      if (progress >= 1) {
        clearInterval(fadeInterval);
      }
    }, 16);

    return () => clearInterval(fadeInterval);
  }, []);

  // Irregular pulse (2.5-3.5s variance)
  useEffect(() => {
    const pulseLoop = (): NodeJS.Timeout => {
      const duration = 2500 + Math.random() * 1000; // 2.5-3.5s
      const startIntensity = pulseIntensity;
      const targetIntensity = 0.25 + (Math.random() * 0.1 - 0.05); // 0.2-0.3
      const startTime = Date.now();

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Smooth interpolation
        const current = startIntensity + (targetIntensity - startIntensity) * progress;
        setPulseIntensity(current);

        if (progress >= 1) {
          clearInterval(interval);
          pulseLoop(); // Next cycle
        }
      }, 50);

      return interval;
    };

    const interval = pulseLoop();
    return () => clearInterval(interval);
  }, [pulseIntensity]);

  // Stuttering LED (starts at t=500ms, locks at t=1500ms)
  useEffect(() => {
    const startDelay = setTimeout(() => {
      setLedState('stuttering');

      // Non-uniform pattern: 60ms on, 200ms off, 40ms on, 80ms off, etc.
      const pattern = [
        { state: 'on', duration: 60 },
        { state: 'off', duration: 200 },
        { state: 'on', duration: 40 },
        { state: 'off', duration: 80 },
        { state: 'on', duration: 100 },
        { state: 'off', duration: 150 },
        { state: 'steady', duration: 0 },
      ];

      let currentStep = 0;
      const executePattern = () => {
        if (currentStep >= pattern.length) return;

        const step = pattern[currentStep];
        setLedState(step.state as any);

        if (step.duration > 0) {
          setTimeout(() => {
            currentStep++;
            executePattern();
          }, step.duration);
        }
      };

      executePattern();
    }, 500);

    return () => clearTimeout(startDelay);
  }, []);

  return (
    <>
      {/* Emergency lighting overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-[9998]"
        style={{
          backgroundColor: `rgba(200, 80, 40, ${opacity * pulseIntensity})`,
          transition: 'background-color 0.3s ease-out',
        }}
      />

      {/* Frame edge glow */}
      <div
        className="fixed inset-0 pointer-events-none z-[9998]"
        style={{
          opacity,
          boxShadow: `inset 0 0 20px rgba(200, 60, 30, ${pulseIntensity})`,
          transition: 'opacity 0.3s ease-out, box-shadow 0.3s ease-out',
        }}
      />

      {/* Stuttering status LED (left edge) */}
      <div
        className="fixed left-14 top-20 w-2 h-2 rounded-full z-[9999]"
        style={{
          backgroundColor: ledState !== 'off' ? 'rgba(255, 180, 100, 0.8)' : 'transparent',
          boxShadow: ledState !== 'off' ? '0 0 8px rgba(255, 180, 100, 0.6)' : 'none',
          transition: 'background-color 0s, box-shadow 0s', // Instant for stutter effect
        }}
      />
    </>
  );
}
