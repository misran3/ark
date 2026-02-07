'use client';

import { useEffect, useRef, useState } from 'react';
import { HUDTopBar as OriginalHUDTopBar } from '@/components/bridge/hud/HUDTopBar';
import { HUDTopBar as OptimizedHUDTopBar } from '@/components/bridge/hud/HUDTopBar.optimized';

/**
 * Test page to compare re-render performance between original and optimized HUDTopBar
 *
 * This demonstrates the systematic debugging approach:
 * - Phase 1: Root cause identified (clock updates trigger full component re-renders)
 * - Phase 2: Pattern analyzed (useMemo, React.memo, component isolation)
 * - Phase 3: Hypothesis tested (this page)
 * - Phase 4: Implementation verified
 */
export default function TestHUDOptimizationPage() {
  const [originalRenders, setOriginalRenders] = useState(0);
  const [optimizedRenders, setOptimizedRenders] = useState(0);
  const originalRef = useRef(0);
  const optimizedRef = useRef(0);

  // Track original renders
  useEffect(() => {
    originalRef.current++;
    setOriginalRenders(originalRef.current);
  });

  // Track optimized renders (in a separate component tree)
  const OptimizedTracker = () => {
    useEffect(() => {
      optimizedRef.current++;
      setOptimizedRenders(optimizedRef.current);
    });
    return <OptimizedHUDTopBar />;
  };

  return (
    <div className="min-h-screen bg-[#020510] text-white p-8">
      <h1 className="text-2xl font-bold mb-8">HUDTopBar Re-render Test</h1>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Original Component</h2>
          <div className="bg-black/50 p-4 rounded border border-red-500/30">
            <OriginalHUDTopBar />
          </div>
          <div className="text-sm">
            <strong>Render count:</strong> <span className="text-red-400 font-mono text-lg">{originalRenders}</span>
          </div>
          <div className="text-xs text-gray-400">
            Expected: ~60 renders/minute (every second)
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-green-400">Optimized Component</h2>
          <div className="bg-black/50 p-4 rounded border border-green-500/30">
            <OptimizedTracker />
          </div>
          <div className="text-sm">
            <strong>Render count:</strong> <span className="text-green-400 font-mono text-lg">{optimizedRenders}</span>
          </div>
          <div className="text-xs text-gray-400">
            Expected: ~3-5 renders (initial + alert changes only)
          </div>
        </div>
      </div>

      <div className="bg-blue-900/20 p-6 rounded border border-blue-500/30">
        <h3 className="text-lg font-semibold mb-4">Optimization Strategy</h3>
        <ul className="space-y-2 text-sm">
          <li>✅ <strong>Component Isolation:</strong> StardateClock isolated with React.memo - only it re-renders</li>
          <li>✅ <strong>Static Memoization:</strong> ShipName and StatusText wrapped in React.memo - never re-render after typewriter</li>
          <li>✅ <strong>Style Memoization:</strong> textStyle and containerStyle use useMemo - prevent object recreation</li>
          <li>✅ <strong>Eliminated Cascading Effects:</strong> Removed redundant displayedStardate effect</li>
        </ul>
      </div>

      <div className="mt-8 bg-yellow-900/20 p-6 rounded border border-yellow-500/30">
        <h3 className="text-lg font-semibold mb-4">Expected Results</h3>
        <div className="space-y-2 text-sm">
          <p><strong>Original:</strong> Full component re-renders every 1000ms</p>
          <p className="text-red-400">• "USS PROSPERITY" re-renders 60 times/minute unnecessarily</p>
          <p className="text-red-400">• "SYSTEMS NOMINAL" re-renders 60 times/minute unnecessarily</p>
          <p className="text-red-400">• Style objects recreated 60 times/minute</p>
          <br />
          <p><strong>Optimized:</strong> Only stardate text updates every 1000ms</p>
          <p className="text-green-400">• "USS PROSPERITY" renders once (after typewriter)</p>
          <p className="text-green-400">• "SYSTEMS NOMINAL" renders once (after typewriter)</p>
          <p className="text-green-400">• Style objects memoized, only recreate on alert level change</p>
        </div>
      </div>
    </div>
  );
}
