'use client';

import { ReactNode, forwardRef } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  level?: 1 | 2 | 3 | 4;
  variant?: 'default' | 'warning' | 'error' | 'success';
  hover?: boolean;
  pulse?: boolean;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  function GlassPanel(
    {
      children,
      level = 2,
      variant = 'default',
      hover = false,
      pulse = false,
      className = '',
      onClick,
      style,
    },
    ref
  ) {
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
      <div ref={ref} className={combinedClassName} onClick={onClick} style={style}>
        {children}
      </div>
    );
  }
);
