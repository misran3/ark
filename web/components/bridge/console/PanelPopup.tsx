'use client';

import { useConsoleStore, type PanelType } from '@/lib/stores/console-store';
import { useEffect } from 'react';

interface PanelPopupProps {
  type: PanelType;
  title: string;
  children: React.ReactNode;
}

export function PanelPopup({ type, title, children }: PanelPopupProps) {
  const { openPanel, closePanel } = useConsoleStore();
  const isOpen = openPanel === type;

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closePanel();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, closePanel]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        onClick={closePanel}
      />

      {/* Floating panel */}
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[800px] max-h-[600px] animate-[liftUp_0.3s_ease-out]"
        style={{
          boxShadow: '0 20px 60px rgba(0, 255, 255, 0.4)',
        }}
      >
        <div className="glass-panel glass-panel-level-3 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-aurora-primary/20">
            <div className="font-orbitron text-sm font-semibold aurora-text">
              {title}
            </div>
            <button
              onClick={closePanel}
              className="w-8 h-8 rounded flex items-center justify-center hover:bg-red-500/20 border border-red-500/30 text-red-400 transition-colors"
            >
              {'\u2715'}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
