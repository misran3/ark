'use client';

import { useEffect, useState } from 'react';

export function HUDTopBar() {
  const [stardate, setStardate] = useState('');

  useEffect(() => {
    const updateStardate = () => {
      const d = new Date();
      const sd = `SD ${d.getFullYear()}.${String(
        Math.floor(((d.getMonth() * 30 + d.getDate()) / 365.25) * 1000)
      ).padStart(3, '0')}`;
      const time = d.toLocaleTimeString('en-US', { hour12: false });
      setStardate(`${sd} | ${time} UTC`);
    };

    updateStardate();
    const interval = setInterval(updateStardate, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-16 px-6 flex items-center justify-between bg-black/5 backdrop-blur-sm">
      {/* Stardate */}
      <div className="font-mono text-sm text-aurora-primary/40">
        {stardate}
      </div>

      {/* Ship Name */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-slow" />
        <div className="font-orbitron text-sm font-semibold aurora-text opacity-60">
          USS PROSPERITY
        </div>
      </div>

      {/* Status indicator */}
      <div className="font-orbitron text-xs text-aurora-primary/40 tracking-wider">
        SYSTEMS NOMINAL
      </div>
    </div>
  );
}
