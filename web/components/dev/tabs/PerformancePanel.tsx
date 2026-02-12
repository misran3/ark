'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useDevStore, recordFps, readFpsHistory, getFpsWriteIndex } from '@/lib/stores/dev-store';

export function PerformancePanel() {
  const showFullOverlay = useDevStore((s) => s.showFullOverlay);
  const toggleFullOverlay = useDevStore((s) => s.toggleFullOverlay);

  const [currentFps, setCurrentFps] = useState(60);
  const [memoryStats, setMemoryStats] = useState<{
    used: number;
    total: number;
  } | null>(null);

  // FPS measurement loop -- records to ring buffer (no store updates)
  // Only updates React state for the current FPS display at ~4Hz
  const lastFrameTimeRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const displayUpdateRef = useRef<number>(0);
  const canvasRedrawRef = useRef<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw the FPS graph imperatively (no React re-render needed)
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const maxFps = 60;
    const buffer = readFpsHistory();
    const writeIdx = getFpsWriteIndex();

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(0, 0, width, height);

    // Guide lines
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    const y60 = height - (60 / maxFps) * height;
    ctx.beginPath(); ctx.moveTo(0, y60); ctx.lineTo(width, y60); ctx.stroke();
    const y30 = height - (30 / maxFps) * height;
    ctx.beginPath(); ctx.moveTo(0, y30); ctx.lineTo(width, y30); ctx.stroke();

    // Draw FPS line from ring buffer (oldest to newest)
    const pointCount = 200;
    const startIdx = (writeIdx - pointCount + buffer.length) % buffer.length;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let lastColor = '';
    for (let i = 0; i < pointCount; i++) {
      const fps = buffer[(startIdx + i) % buffer.length];
      const x = (i / (pointCount - 1)) * width;
      const y = height - (fps / maxFps) * height;
      const color = fps >= 55 ? '#10b981' : fps >= 30 ? '#eab308' : '#ef4444';

      if (i === 0) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y);
        lastColor = color;
      } else if (color !== lastColor) {
        ctx.stroke();
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y);
        lastColor = color;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }, []);

  useEffect(() => {
    let isComponentMounted = true;

    const measureFps = (timestamp: number) => {
      if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = timestamp;
        animationFrameIdRef.current = requestAnimationFrame(measureFps);
        return;
      }

      const delta = timestamp - lastFrameTimeRef.current;
      const fps = Math.round(1000 / delta);

      // Write to ring buffer (zero cost -- no store update, no React re-render)
      recordFps(fps);

      if (isComponentMounted) {
        // Update display at ~4Hz (every 250ms) instead of 60fps
        displayUpdateRef.current += delta;
        if (displayUpdateRef.current > 250) {
          displayUpdateRef.current = 0;
          setCurrentFps(fps);
        }

        // Redraw canvas at ~10Hz (every 100ms)
        canvasRedrawRef.current += delta;
        if (canvasRedrawRef.current > 100) {
          canvasRedrawRef.current = 0;
          drawGraph();
        }
      }

      lastFrameTimeRef.current = timestamp;
      animationFrameIdRef.current = requestAnimationFrame(measureFps);
    };

    animationFrameIdRef.current = requestAnimationFrame(measureFps);

    return () => {
      isComponentMounted = false;
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [drawGraph]);

  // Update memory stats periodically
  useEffect(() => {
    const updateMemory = () => {
      if (
        typeof window !== 'undefined' &&
        'performance' in window &&
        'memory' in (window.performance as any)
      ) {
        const mem = (window.performance as any).memory;
        setMemoryStats({
          used: mem.usedJSHeapSize,
          total: mem.totalJSHeapSize,
        });
      }
    };

    updateMemory();
    const interval = setInterval(updateMemory, 1000);

    return () => clearInterval(interval);
  }, []);

  // Helper function to format bytes
  const formatBytes = (bytes: number): string => {
    return (bytes / 1024 / 1024).toFixed(2);
  };

  // Helper function to get FPS color
  const getFpsColor = (fps: number): string => {
    if (fps >= 55) return '#10b981'; // Green
    if (fps >= 30) return '#eab308'; // Yellow
    return '#ef4444'; // Red
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '12px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '10px',
        color: 'rgba(255,255,255,0.5)',
      }}
    >
      {/* FPS Counter */}
      <div
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '6px',
          padding: '12px',
        }}
      >
        <div
          style={{
            fontSize: '9px',
            color: '#a78bfa',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          FPS
        </div>
        <div
          style={{
            fontSize: '28px',
            fontWeight: 600,
            color: getFpsColor(currentFps),
            fontFamily: 'monospace',
            letterSpacing: '2px',
          }}
        >
          {currentFps}
        </div>
      </div>

      {/* FPS Graph */}
      <div
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '6px',
          padding: '8px',
        }}
      >
        <div
          style={{
            fontSize: '9px',
            color: '#a78bfa',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          FPS Graph (10s)
        </div>
        <canvas
          ref={canvasRef}
          width={340 - 32}
          height={60}
          style={{
            width: '100%',
            height: '60px',
            display: 'block',
            borderRadius: '4px',
          }}
        />
      </div>

      {/* Memory Stats */}
      <div
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '6px',
          padding: '12px',
        }}
      >
        <div
          style={{
            fontSize: '9px',
            color: '#a78bfa',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Memory
        </div>
        {memoryStats ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              JS Heap: {formatBytes(memoryStats.used)} MB /{' '}
              {formatBytes(memoryStats.total)} MB
            </div>
            {/* Progress bar */}
            <div
              style={{
                height: '6px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(memoryStats.used / memoryStats.total) * 100}%`,
                  background: 'rgba(96, 165, 250, 0.6)',
                  transition: 'width 0.2s',
                }}
              />
            </div>
          </div>
        ) : (
          <div
            style={{
              fontSize: '10px',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            Memory: N/A (Chrome only)
          </div>
        )}
      </div>

      {/* Overlay Toggle */}
      <button
        onClick={toggleFullOverlay}
        style={{
          background: showFullOverlay
            ? 'rgba(139, 92, 246, 0.15)'
            : 'rgba(255,255,255,0.05)',
          border: showFullOverlay
            ? '1px solid rgba(139, 92, 246, 0.3)'
            : '1px solid rgba(255,255,255,0.1)',
          color: showFullOverlay ? '#a78bfa' : '#e0e0e0',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: '10px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
        onMouseEnter={(e) => {
          const target = e.target as HTMLButtonElement;
          target.style.background = showFullOverlay
            ? 'rgba(139, 92, 246, 0.25)'
            : 'rgba(255,255,255,0.1)';
        }}
        onMouseLeave={(e) => {
          const target = e.target as HTMLButtonElement;
          target.style.background = showFullOverlay
            ? 'rgba(139, 92, 246, 0.15)'
            : 'rgba(255,255,255,0.05)';
        }}
      >
        Full Overlay: {showFullOverlay ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}

