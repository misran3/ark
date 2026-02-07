'use client';

import { useEffect, useState } from 'react';

export function TrueBlack() {
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    // Red flash at t=1s for 50ms
    const flashTimer = setTimeout(() => {
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 50);
    }, 1000);

    return () => clearTimeout(flashTimer);
  }, []);

  return (
    <>
      {/* Pure black background */}
      <div className="fixed inset-0 bg-black z-[9999]" />

      {/* Red flash - flat wash, no illumination */}
      {showFlash && (
        <div
          className="fixed inset-0 z-[10000] pointer-events-none"
          style={{
            backgroundColor: 'rgba(180, 40, 30, 0.15)',
          }}
        />
      )}
    </>
  );
}
