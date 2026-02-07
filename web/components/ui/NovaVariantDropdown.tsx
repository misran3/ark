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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-orbitron text-sm tracking-wider hover:bg-cyan-500/20 transition-colors flex items-center justify-between"
      >
        <span className="truncate">{value.label}</span>
        <svg
          className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 rounded border border-cyan-500/30 bg-gray-900/95 backdrop-blur-sm shadow-[0_0_20px_rgba(0,255,255,0.15)] max-h-64 overflow-y-auto">
          {variants.map((variant, idx) => {
            const isSelected = value.label === variant.label;
            return (
              <button
                key={`${variant.type}-${idx}`}
                onClick={() => {
                  onChange(variant);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left font-rajdhani text-sm transition-colors ${
                  isSelected
                    ? 'bg-cyan-500/30 text-cyan-300'
                    : 'text-cyan-400/80 hover:bg-cyan-500/10 hover:text-cyan-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isSelected && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span className={isSelected ? 'font-semibold' : ''}>
                    {variant.label}
                  </span>
                </div>
                {variant.type === 'community' && (
                  <div className="text-xs text-cyan-400/50 mt-0.5 ml-5">
                    {variant.path?.split('/').pop() ?? 'Unknown'}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
