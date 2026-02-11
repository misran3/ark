'use client';

import { useRef, useEffect } from 'react';
import { Html } from '@react-three/drei';

interface HologramDetailPanelProps {
  position: [number, number, number];
  color: string;        // CSS color string (e.g. "rgb(0, 200, 255)")
  glowColor: string;    // CSS rgba for glow
  onClose: () => void;
  children: React.ReactNode;
}

export function HologramDetailPanel({
  position,
  color,
  glowColor,
  onClose,
  children,
}: HologramDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Click-outside-to-dismiss
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    // Delay listener to avoid immediate dismiss from the same click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  // ESC to dismiss
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <Html center position={position} style={{ pointerEvents: 'auto' }} zIndexRange={[100, 0]}>
      <div
        ref={panelRef}
        className="font-mono text-xs"
        style={{
          background: 'rgba(3, 8, 24, 0.88)',
          border: `1px solid ${color}`,
          borderRadius: '4px',
          padding: '12px 14px',
          minWidth: '220px',
          maxWidth: '280px',
          color: 'rgba(200, 210, 230, 0.9)',
          boxShadow: `0 0 20px ${glowColor}, inset 0 0 10px rgba(0,0,0,0.5)`,
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-1 right-2 opacity-40 hover:opacity-80 transition-opacity"
          style={{ color, fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          x
        </button>

        {children}
      </div>
    </Html>
  );
}

/** Reusable styled sub-components for detail panel content */

export function DetailHeader({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        color,
        fontSize: '11px',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        marginBottom: '8px',
        textShadow: `0 0 6px ${color}`,
      }}
    >
      {children}
    </div>
  );
}

export function DetailRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-baseline" style={{ marginBottom: '4px' }}>
      <span style={{ opacity: 0.6 }}>{label}</span>
      <span style={{ color: color || 'inherit', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

export function DetailDivider({ color }: { color: string }) {
  return (
    <div
      style={{
        height: '1px',
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        margin: '8px 0',
        opacity: 0.3,
      }}
    />
  );
}

export function DetailList({ items, color }: { items: string[]; color: string }) {
  return (
    <div style={{ marginTop: '4px' }}>
      {items.map((item, i) => (
        <div key={i} style={{ marginBottom: '2px', paddingLeft: '8px' }}>
          <span style={{ color, marginRight: '6px' }}>+</span>
          {item}
        </div>
      ))}
    </div>
  );
}
