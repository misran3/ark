'use client';

import React, { useState, useCallback } from 'react';
import { AsteroidCard } from '@/src/components/data-display';
import { useAsteroids } from '@/src/hooks/security/useSecurity';
import type { Asteroid } from '@/src/types/api';

/**
 * Render a container showing incoming asteroid threats and allow resolving them.
 *
 * Displays an error banner when the API is offline, loading skeletons while data
 * is being fetched, a "Sector Clear" empty state when there are no threats,
 * or a severity-sorted list of asteroids. Each asteroid can be expanded and
 * acted on (deflect, absorb, redirect); performing an action triggers the
 * resolve operation and a short removal animation for that item.
 *
 * @returns The component's rendered UI: an error view, loading placeholders, an empty state, or a sorted list of AsteroidCard items with expand and action callbacks.
 */
export function AsteroidsContainer() {
  const { asteroids, loading, error, resolveAsteroid } = useAsteroids();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleAction = useCallback(
    async (id: string, action: 'deflect' | 'absorb' | 'redirect') => {
      // Mark as removing (for animation)
      setRemovingIds((prev) => new Set(prev).add(id));

      // Call the API
      await resolveAsteroid(id, action);

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
    [resolveAsteroid]
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

  if (loading) {
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

  if (asteroids.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-emerald-500 font-mono text-sm mb-2">
          ✓ SECTOR CLEAR
        </div>
        <div className="text-gray-500 text-xs font-mono">
          No incoming threats detected
        </div>
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
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-4 text-center">
        <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-amber-500/80">
          Incoming Threats
        </h3>
        <div className="text-[10px] text-gray-600 font-mono mt-1">
          {asteroids.length} OBJECT{asteroids.length !== 1 ? 'S' : ''} DETECTED
        </div>
      </div>

      {/* Asteroid List */}
      <div className="space-y-4">
        {sortedAsteroids.map((asteroid) => (
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
        ))}
      </div>
    </div>
  );
}