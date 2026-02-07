'use client';

import { useEffect, useState } from 'react';

type ProjectionPhase = 'nameplate' | 'stardate' | 'threats' | 'calibration' | 'complete';

export function HUDProjection() {
  const [phase, setPhase] = useState<ProjectionPhase>('nameplate');
  const [nameplateChars, setNameplateChars] = useState<string[]>([]);
  const [stardateJitter, setStardateJitter] = useState(0);
  const [threatsBoxProgress, setThreatsBoxProgress] = useState(0);
  const [finalCalibration, setFinalCalibration] = useState(false);

  const targetNameplate = 'USS PROSPERITY';
  const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';

  useEffect(() => {
    // Phase 1: Ship nameplate (0-300ms) - scrambled then resolving
    const nameplateInterval = setInterval(() => {
      const chars = targetNameplate.split('').map((targetChar, i) => {
        const progress = Math.min((Date.now() % 300) / 300, 1);
        const lockThreshold = (i + 1) / targetNameplate.length;

        if (progress >= lockThreshold) {
          return targetChar; // Locked
        } else {
          // Random glyph cycling
          return charSet[Math.floor(Math.random() * charSet.length)];
        }
      });
      setNameplateChars(chars);
    }, 40);

    setTimeout(() => {
      clearInterval(nameplateInterval);
      setNameplateChars(targetNameplate.split(''));
      setPhase('stardate');

      // Phase 2: Stardate (300-500ms) - horizontal jitter
      const stardateStart = Date.now();
      const stardateInterval = setInterval(() => {
        const elapsed = Date.now() - stardateStart;
        if (elapsed < 150) {
          setStardateJitter(Math.random() * 6 - 3); // -3 to +3px
        } else {
          setStardateJitter(0); // Lock
          clearInterval(stardateInterval);
          setPhase('threats');

          // Phase 3: Threat indicators (600-900ms) - box outline draws
          const threatsStart = Date.now();
          const threatsInterval = setInterval(() => {
            const elapsed = Date.now() - threatsStart;
            const progress = Math.min(elapsed / 200, 1);
            setThreatsBoxProgress(progress);

            if (progress >= 1) {
              clearInterval(threatsInterval);
              setPhase('calibration');

              // Final collective calibration (900-1000ms)
              setTimeout(() => {
                setFinalCalibration(true);
                setTimeout(() => {
                  setFinalCalibration(false);
                  setPhase('complete');
                }, 50);
              }, 100);
            }
          }, 16);
        }
      }, 16);
    }, 300);

    return () => {
      clearInterval(nameplateInterval);
    };
  }, [charSet, targetNameplate]);

  return (
    <>
      {/* Ship Nameplate */}
      {(phase === 'nameplate' || phase !== 'complete') && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 font-orbitron text-lg font-bold z-[100]"
          style={{
            color: 'rgba(0, 240, 255, 0.9)',
            textShadow: phase === 'nameplate'
              ? '-1px 0 rgba(255,0,0,0.5), 1px 0 rgba(0,0,255,0.5)' // Chromatic aberration
              : '0 0 10px rgba(0, 240, 255, 0.6)',
            transform: finalCalibration ? 'translateX(-50%) translateX(0.5px)' : 'translateX(-50%)',
            transition: 'transform 0.05s',
          }}
        >
          {nameplateChars.join('')}
        </div>
      )}

      {/* Stardate */}
      {phase !== 'nameplate' && phase !== 'complete' && (
        <div
          className="fixed top-4 right-8 font-mono text-xs z-[100]"
          style={{
            color: 'rgba(0, 240, 255, 0.8)',
            transform: `translateX(${stardateJitter}px)`,
            textShadow: stardateJitter !== 0
              ? '-1px 0 rgba(255,0,0,0.5), 1px 0 rgba(0,0,255,0.5)'
              : '0 0 8px rgba(0, 240, 255, 0.5)',
            transition: stardateJitter === 0 ? 'transform 0s, text-shadow 0.1s' : 'none',
          }}
        >
          STARDATE 2026.038
        </div>
      )}

      {/* Threat Indicators Box */}
      {(phase === 'threats' || phase === 'calibration' || phase === 'complete') && (
        <svg
          className="fixed top-12 left-14 z-[100]"
          width="200"
          height="100"
          style={{ opacity: threatsBoxProgress }}
        >
          <rect
            x="0"
            y="0"
            width="200"
            height="100"
            fill="none"
            stroke="rgba(0, 240, 255, 0.6)"
            strokeWidth="1"
            strokeDasharray="600"
            strokeDashoffset={600 - threatsBoxProgress * 600} // Draws from 0 to 600
          />
        </svg>
      )}
    </>
  );
}
