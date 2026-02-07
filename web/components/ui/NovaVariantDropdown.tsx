'use client';

import { useState, useRef, useEffect } from 'react';

export type NovaVariant =
  | { type: 'skeletal'; label: string }
  | { type: 'community'; label: string; path: string };

export interface NovaVariantDropdownProps {
  /** Currently selected variant */
  value: NovaVariant;
  /** Callback when selection changes */
  onChange: (variant: NovaVariant) => void;
  /** Available variants to choose from */
  variants: NovaVariant[];
  /** Optional custom className */
  className?: string;
}

export function NovaVariantDropdown({
  value,
  onChange,
  variants,
  className = '',
}: NovaVariantDropdownProps) {
  return (
    <div className={className}>
      {/* Placeholder - implement in next task */}
      <div className="text-cyan-400 font-orbitron text-sm">
        Current: {value.label}
      </div>
    </div>
  );
}
