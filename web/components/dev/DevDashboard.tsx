'use client';

import { useEffect, useRef, useState } from 'react';
import { useDevStore } from '@/lib/stores/dev-store';
import { ThreatSpawner } from './tabs/ThreatSpawner';
import { ShieldControls } from './tabs/ShieldControls';
import { AnimationControls } from './tabs/AnimationControls';
import { PerformancePanel } from './tabs/PerformancePanel';
import { NovaControls } from './tabs/NovaControls';

export function DevDashboard() {
  const isOpen = useDevStore((s) => s.isOpen);
  const activeTab = useDevStore((s) => s.activeTab);
  const panelPosition = useDevStore((s) => s.panelPosition);
  const panelWidth = useDevStore((s) => s.panelWidth);
  const setActiveTab = useDevStore((s) => s.setActiveTab);
  const setPanelPosition = useDevStore((s) => s.setPanelPosition);
  const toggle = useDevStore((s) => s.toggle);
  const toggleFullOverlay = useDevStore((s) => s.toggleFullOverlay);

  const panelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  // Panel animation state
  useEffect(() => {
    if (isOpen) {
      setIsAnimatingIn(true);
      // Remove animation class after transition completes
      const timer = setTimeout(() => {
        setIsAnimatingIn(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + Shift + D: toggle dev dashboard
      if (modKey && e.shiftKey && e.code === 'KeyD') {
        e.preventDefault();
        toggle();
      }

      // Ctrl/Cmd + Shift + P: toggle perf overlay
      if (modKey && e.shiftKey && e.code === 'KeyP') {
        e.preventDefault();
        toggleFullOverlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle, toggleFullOverlay]);

  // Drag handling
  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (headerRef.current && panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;

      // Calculate new position
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Clamp to viewport
      const clampedX = Math.max(0, Math.min(newX, window.innerWidth - panelWidth));
      const clampedY = Math.max(0, Math.min(newY, window.innerHeight - 100));

      setPanelPosition({ x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, panelWidth, setPanelPosition]);

  const tabs = [
    { id: 'threats', label: 'THREATS' },
    { id: 'shields', label: 'SHIELDS' },
    { id: 'data', label: 'DATA' },
    { id: 'animation', label: 'ANIM' },
    { id: 'performance', label: 'PERF' },
    { id: 'nova', label: 'NOVA' },
  ] as const;

  const tabContentMap: Record<typeof activeTab, React.ReactNode> = {
    threats: <ThreatSpawner />,
    shields: <ShieldControls />,
    data: 'Mock Data Switcher coming soon',
    animation: <AnimationControls />,
    performance: <PerformancePanel />,
    nova: <NovaControls />,
  };

  // Position styles
  const positionStyle: React.CSSProperties = {};
  if (panelPosition.x === -1) {
    // Default right-aligned
    positionStyle.right = '16px';
  } else {
    // Custom position from drag
    positionStyle.left = `${panelPosition.x}px`;
  }
  positionStyle.top = `${panelPosition.y}px`;

  // Animation styles
  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    width: `${panelWidth}px`,
    maxHeight: '80vh',
    zIndex: 99999,
    background: 'rgba(0, 0, 0, 0.92)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
    fontFamily: 'system-ui, -apple-system, monospace',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transform: isOpen
      ? 'translateX(0)'
      : 'translateX(calc(100% + 32px))',
    transition: isOpen
      ? 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)'
      : 'transform 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    pointerEvents: isOpen ? 'auto' : 'none',
    ...positionStyle,
  };

  const headerStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '8px 12px',
    fontWeight: 600,
    fontSize: '12px',
    cursor: 'grab',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    userSelect: 'none',
    color: 'rgba(255, 255, 255, 0.9)',
  };

  const tabBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    padding: '8px 12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    background: 'rgba(0, 0, 0, 0.3)',
    overflowX: 'auto',
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    border: isActive
      ? '1px solid rgba(139, 92, 246, 0.3)'
      : '1px solid transparent',
    background: isActive
      ? 'rgba(139, 92, 246, 0.15)'
      : 'transparent',
    color: isActive
      ? '#a78bfa'
      : 'rgba(255, 255, 255, 0.4)',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    whiteSpace: 'nowrap',
    flex: 'shrink 0',
  });

  const contentAreaStyle: React.CSSProperties = {
    overflowY: 'auto',
    flex: 1,
    padding: '12px',
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'system-ui, -apple-system, monospace',
  };

  const footerStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.03)',
    padding: '6px 12px',
    fontSize: '10px',
    color: 'rgba(255, 255, 255, 0.3)',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    fontFamily: 'monospace',
    textAlign: 'right',
  };

  return (
    <div ref={panelRef} style={panelStyle}>
      {/* Header */}
      <div
        ref={headerRef}
        style={headerStyle}
        onMouseDown={handleHeaderMouseDown}
      >
        <span>DEV DASHBOARD</span>
        <button
          onClick={() => toggle()}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.6)',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '0 4px',
            transition: 'color 150ms ease',
          }}
          onMouseEnter={(e) => {
            if (e.currentTarget instanceof HTMLElement) {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 1)';
            }
          }}
          onMouseLeave={(e) => {
            if (e.currentTarget instanceof HTMLElement) {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
            }
          }}
        >
          ✕
        </button>
      </div>

      {/* Tab Bar */}
      <div style={tabBarStyle}>
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={tabStyle(activeTab === id)}
            onMouseEnter={(e) => {
              if (activeTab !== id && e.currentTarget instanceof HTMLElement) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== id && e.currentTarget instanceof HTMLElement) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={contentAreaStyle}>
        {tabContentMap[activeTab]}
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        FPS: -- | Draw: -- | Mem: --
      </div>
    </div>
  );
}
