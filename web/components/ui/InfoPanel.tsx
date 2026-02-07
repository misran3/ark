'use client';

import { ReactNode } from 'react';
import { GlassPanel } from './GlassPanel';

interface InfoPanelProps {
  icon: string;
  title: string;
  details: string[];
  severity?: 'info' | 'warning' | 'danger';
  action?: ReactNode;
  className?: string;
}

export function InfoPanel({
  icon,
  title,
  details,
  severity = 'info',
  action,
  className = '',
}: InfoPanelProps) {
  const variantMap = {
    info: 'default',
    warning: 'warning',
    danger: 'error',
  } as const;

  return (
    <GlassPanel
      level={3}
      variant={variantMap[severity]}
      className={`min-w-[300px] ${className}`}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="text-2xl flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold font-orbitron text-white mb-2">
            {title}
          </h4>
          <div className="space-y-1">
            {details.map((detail, i) => (
              <p key={i} className="text-sm text-white/70">
                {detail}
              </p>
            ))}
          </div>
        </div>
      </div>
      {action && (
        <div className="border-t border-white/10 p-4">
          {action}
        </div>
      )}
    </GlassPanel>
  );
}
