'use client';

import { useState } from 'react';
import { BootOverlay } from '@/components/bridge/boot/BootOverlay';
import type { BootPhase } from '@/lib/stores/boot-store';

export default function TestPage() {
  const [phase, setPhase] = useState<BootPhase>('darkness');

  return (
    <div className="h-screen bg-gray-900 text-white p-8">
      <div className="space-x-2 mb-4">
        <button onClick={() => setPhase('darkness')} className="px-3 py-1 bg-blue-600 rounded">
          Darkness
        </button>
        <button onClick={() => setPhase('console-glow')} className="px-3 py-1 bg-blue-600 rounded">
          Console Glow
        </button>
        <button onClick={() => setPhase('power-surge')} className="px-3 py-1 bg-blue-600 rounded">
          Power Surge
        </button>
      </div>

      <p>Current phase: {phase}</p>

      <BootOverlay phase={phase} onSkip={() => alert('Skip clicked')} />
    </div>
  );
}
