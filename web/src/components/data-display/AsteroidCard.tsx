'use client';

import React from 'react';
import type { Asteroid } from '@/src/types/api';

interface AsteroidCardProps {
  asteroid: Asteroid;
  onAction: (id: string, action: 'deflect' | 'absorb' | 'redirect') => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const severityStyles: Record<
  Asteroid['severity'],
  { border: string; glow: string; badge: string }
> = {
  danger: {
    border: 'border-red-500/60',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
    badge: 'bg-red-500/20 text-red-400 border-red-500/40',
  },
  warning: {
    border: 'border-amber-500/60',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  },
  info: {
    border: 'border-cyan-500/60',
    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]',
    badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
  },
};

const threatTypeLabels: Record<Asteroid['threat_type'], string> = {
  subscription_renewal: 'SUBSCRIPTION',
  budget_overrun: 'BUDGET BREACH',
  unused_service: 'UNUSED SERVICE',
  spending_spike: 'SPENDING SPIKE',
  bill_due: 'BILL DUE',
};

const actionLabels: Record<Asteroid['recommended_action'], { label: string; description: string }> = {
  deflect: { label: 'DEFLECT', description: 'Cancel or avoid this expense' },
  absorb: { label: 'ABSORB', description: 'Accept and budget for it' },
  redirect: { label: 'REDIRECT', description: 'Find an alternative' },
};

/**
 * Render an interactive card for an asteroid item with expandable details and action controls.
 *
 * @param asteroid - The asteroid data to display (title, amounts, timing, severity, details, reasoning, recommended action, and id).
 * @param onAction - Callback invoked when an action button is clicked; receives the asteroid `id` and chosen action (`'deflect' | 'absorb' | 'redirect'`).
 * @param isExpanded - Whether the card's detailed view is currently expanded. Defaults to `false`.
 * @param onToggleExpand - Optional handler invoked when the card header is clicked to toggle expansion.
 * @returns The rendered card element for the provided asteroid.
 */
export function AsteroidCard({
  asteroid,
  onAction,
  isExpanded = false,
  onToggleExpand,
}: AsteroidCardProps) {
  const styles = severityStyles[asteroid.severity];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div
      className={`
        bg-black/60 backdrop-blur-md rounded-lg border-2 overflow-hidden
        transition-all duration-300 ease-out
        ${styles.border} ${styles.glow}
        ${isExpanded ? 'scale-[1.02]' : 'hover:scale-[1.01]'}
      `}
    >
      {/* Header - Always Visible */}
      <div
        className="p-4 cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex justify-between items-start gap-4">
          {/* Left: Title & Type */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded border font-bold tracking-wider ${styles.badge}`}
              >
                {threatTypeLabels[asteroid.threat_type]}
              </span>
              {asteroid.days_until <= 3 && asteroid.days_until > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/30 text-red-300 font-bold animate-pulse">
                  {asteroid.days_until}D
                </span>
              )}
              {asteroid.days_until === 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/50 text-red-200 font-bold animate-pulse">
                  NOW
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-white truncate">
              {asteroid.title}
            </h3>
          </div>

          {/* Right: Amount */}
          <div className="text-right">
            <div className="text-xl font-mono font-bold text-white">
              {formatCurrency(asteroid.amount)}
            </div>
            {asteroid.days_until > 3 && (
              <div className="text-[10px] text-gray-500 font-mono">
                in {asteroid.days_until} days
              </div>
            )}
          </div>
        </div>

        {/* Expand Indicator */}
        <div className="mt-2 text-center">
          <span className="text-[10px] text-gray-600 font-mono">
            {isExpanded ? '▲ COLLAPSE' : '▼ EXPAND FOR DETAILS'}
          </span>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div
          className="px-4 pb-4 border-t border-white/10"
          style={{ animation: 'fade-in-up 0.2s ease-out' }}
        >
          {/* Detail */}
          <p className="text-sm text-gray-300 mt-3 leading-relaxed">
            {asteroid.detail}
          </p>

          {/* AI Reasoning */}
          <div className="mt-3 p-3 bg-white/5 rounded border border-white/10">
            <div className="text-[9px] font-bold tracking-wider text-cyan-500/80 mb-1">
              CAPTAIN NOVA ANALYSIS
            </div>
            <p className="text-xs text-gray-400 italic">
              "{asteroid.reasoning}"
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex gap-2">
            {(['deflect', 'absorb', 'redirect'] as const).map((action) => {
              const isRecommended = asteroid.recommended_action === action;
              return (
                <button
                  key={action}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction(asteroid.id, action);
                  }}
                  className={`
                    flex-1 py-2 px-3 rounded border text-xs font-bold tracking-wider uppercase
                    transition-all duration-200
                    ${
                      isRecommended
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 hover:bg-cyan-500/30'
                        : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10 hover:text-white'
                    }
                  `}
                  title={actionLabels[action].description}
                >
                  {isRecommended && <span className="mr-1">★</span>}
                  {actionLabels[action].label}
                </button>
              );
            })}
          </div>

          {/* Recommended Action Hint */}
          <div className="mt-2 text-center">
            <span className="text-[9px] text-gray-600 font-mono">
              ★ = CAPTAIN NOVA RECOMMENDED ACTION
            </span>
          </div>
        </div>
      )}
    </div>
  );
}