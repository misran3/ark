'use client';

import { useDevStore } from '@/lib/stores/dev-store';

export function DevIndicator() {
  const { isOpen, toggle } = useDevStore();

  // Don't show indicator when panel is open
  if (isOpen) return null;

  return (
    <button
      onClick={toggle}
      title="Dev Dashboard (Ctrl+Shift+D)"
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        width: '28px',
        height: '28px',
        zIndex: 99998,
        background: 'rgba(0, 0, 0, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '6px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        opacity: 0.2,
        transition: 'opacity 150ms ease',
        padding: 0,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.opacity = '0.5';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.opacity = '0.2';
      }}
    >
      🛠
    </button>
  );
}
