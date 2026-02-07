'use client';

import React, { useState, useCallback } from 'react';
import { AsteroidCard } from '@/src/components/data-display';
import { useAsteroids } from '@/src/hooks/security/useSecurity';
import type { Asteroid } from '@/src/types/api';

/**
 * Smart container that manages asteroid threat display and actions.
 * Fetches data from the real API via useAsteroids hook.
 */
export function AsteroidsContainer() {
  const { asteroids, loading, error, resolveAsteroid } = useAsteroids();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [lastAction, setLastAction] = useState<any>(null);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleAction = useCallback(
    async (id: string, action: 'deflect' | 'absorb' | 'redirect') => {
      const asteroid = asteroids.find(a => a.id === id);
      console.log(`[ASTEROID TEST] Taking action: ${action} on ${id}`, asteroid);
      
      setLastAction({ id, action, status: 'PENDING' });

      // Mark as removing (for animation)
      setRemovingIds((prev) => new Set(prev).add(id));

      try {
        // Call the API
        const result = await resolveAsteroid(id, action);
        console.log(`[ASTEROID TEST] Action Result for ${id}:`, result);
        setLastAction({ id, action, status: 'SUCCESS', result });
      } catch (err: any) {
        console.error(`[ASTEROID TEST] Action Error for ${id}:`, err);
        setLastAction({ id, action, status: 'ERROR', error: err.message });
      }

      // Clean up animation state after delay
      setTimeout(() => {
        setRemovingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setExpandedId(null);
      }, 300);
    },
    [resolveAsteroid, asteroids]
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-red-500 font-mono text-sm mb-2">
          ⚠ THREAT SCANNER OFFLINE
        </div>
        <div className="text-gray-500 text-xs font-mono">{error.message}</div>
      </div>
    );
  }

  if (loading && asteroids.length === 0) {
    return (
      <div className="w-full max-w-lg mx-auto space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 bg-black/40 border border-white/10 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Sort by severity (danger first, then warning, then info)
  const severityOrder: Record<Asteroid['severity'], number> = {
    danger: 0,
    warning: 1,
    info: 2,
  };
  const sortedAsteroids = [...asteroids].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-amber-500/80">
          Incoming Threats
        </h3>
        <div className="text-[10px] text-gray-600 font-mono mt-1">
          {asteroids.length} OBJECT{asteroids.length !== 1 ? 'S' : ''} DETECTED
        </div>
      </div>

      {/* Last Action Display */}
      {lastAction && (
        <div className={`p-2 rounded border text-[9px] font-mono text-center ${
          lastAction.status === 'SUCCESS' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
          lastAction.status === 'ERROR' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
          'bg-amber-500/10 border-amber-500/30 text-amber-400'
        }`}>
          LAST ACTION: {lastAction.action.toUpperCase()} ON {lastAction.id} // STATUS: {lastAction.status}
        </div>
      )}

      {/* Asteroid List */}
      <div className="space-y-4">
        {asteroids.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-white/10 rounded">
            <div className="text-emerald-500 font-mono text-sm mb-2">
              ✓ SECTOR CLEAR
            </div>
            <div className="text-gray-500 text-xs font-mono">
              No incoming threats detected
            </div>
          </div>
        ) : (
          sortedAsteroids.map((asteroid) => (
            <div
              key={asteroid.id}
              className={`transition-all duration-300 ${
                removingIds.has(asteroid.id)
                  ? 'opacity-0 scale-95 translate-x-4'
                  : 'opacity-100 scale-100 translate-x-0'
              }`}
            >
              <AsteroidCard
                asteroid={asteroid}
                isExpanded={expandedId === asteroid.id}
                onToggleExpand={() => handleToggleExpand(asteroid.id)}
                onAction={handleAction}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
