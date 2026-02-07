'use client';

import { ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  level?: 1 | 2 | 3 | 4;
  variant?: 'default' | 'warning' | 'error' | 'success';
  hover?: boolean;
  pulse?: boolean;
  className?: string;
  onClick?: () => void;
}

export function GlassPanel({
  children,
  level = 2,
  variant = 'default',
  hover = false,
  pulse = false,
  className = '',
  onClick,
}: GlassPanelProps) {
  const baseClasses = 'glass-panel';
  const levelClasses = `glass-panel-level-${level}`;
  const variantClasses = `glass-panel-${variant}`;
  const stateClasses = [
    hover && 'glass-panel-hoverable',
    pulse && 'glass-panel-pulse',
  ]
    .filter(Boolean)
    .join(' ');

  const combinedClassName = [
    baseClasses,
    levelClasses,
    variantClasses,
    stateClasses,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={combinedClassName} onClick={onClick}>
      {children}
    </div>
  );
}
