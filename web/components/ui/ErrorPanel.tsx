'use client';

import { useEffect, useState } from 'react';

export interface ErrorPanelProps {
  severity: 'minor' | 'major' | 'critical';
  title?: string;
  message: string;
  technicalDetail?: string;
  onRetry?: () => void;
  lastSuccessfulSync?: Date;
  retryCount?: number;
  isRetrying?: boolean;
}

const DEFAULT_TITLES: Record<string, string> = {
  minor: 'SYSTEMS ADVISORY',
  major: 'SYSTEMS MALFUNCTION',
  critical: 'CRITICAL SYSTEMS FAILURE',
};

const SEVERITY_STYLES: Record<string, { border: string; background: string; textColor: string; icon: string }> = {
  minor: {
    border: 'rgba(234, 179, 8, 0.15)',
    background: 'rgba(234, 179, 8, 0.03)',
    textColor: '#eab308',
    icon: '⚠',
  },
  major: {
    border: 'rgba(249, 115, 22, 0.2)',
    background: 'rgba(249, 115, 22, 0.04)',
    textColor: '#f97316',
    icon: '⚠',
  },
  critical: {
    border: 'rgba(239, 68, 68, 0.25)',
    background: 'rgba(239, 68, 68, 0.05)',
    textColor: '#ef4444',
    icon: '🔴',
  },
};

export function ErrorPanel({
  severity,
  title,
  message,
  technicalDetail,
  onRetry,
  lastSuccessfulSync,
  retryCount = 0,
  isRetrying = false,
}: ErrorPanelProps) {
  const [timeElapsed, setTimeElapsed] = useState<string>('');

  const styles = SEVERITY_STYLES[severity];
  const displayTitle = title || DEFAULT_TITLES[severity];

  // Update time elapsed for lastSuccessfulSync
  useEffect(() => {
    if (!lastSuccessfulSync) return;

    const updateTime = () => {
      const now = new Date();
      const diff = now.getTime() - lastSuccessfulSync.getTime();
      const minutes = Math.floor(diff / 60000);

      if (minutes < 1) {
        setTimeElapsed('just now');
      } else if (minutes < 60) {
        setTimeElapsed(`${minutes} minute${minutes > 1 ? 's' : ''} ago`);
      } else {
        const hours = Math.floor(minutes / 60);
        setTimeElapsed(`${hours} hour${hours > 1 ? 's' : ''} ago`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [lastSuccessfulSync]);

  const animationStyle = (severity === 'major' || severity === 'critical') ? `
    @keyframes errorPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  ` : '';

  const pulseAnimation = (severity === 'major' || severity === 'critical') ? 'errorPulse' : 'none';
  const pulseAnimationDuration = severity === 'critical' ? '1.5s' : '2s';

  const retryLabel = isRetrying
    ? 'RETRYING...'
    : retryCount > 3
      ? `RETRY (attempt ${retryCount})`
      : 'RETRY';

  const showConnectionHelper = retryCount > 5;

  return (
    <>
      <style>{animationStyle}</style>
      <div
        className="flex flex-col items-center py-8 px-6 rounded-lg"
        style={{
          border: `1px solid ${styles.border}`,
          background: styles.background,
          animation: severity === 'major' || severity === 'critical'
            ? `${pulseAnimation} ${pulseAnimationDuration} ease-in-out infinite`
            : 'none',
        }}
      >
        {/* Warning Icon */}
        <div
          className="text-3xl mb-4"
          style={{ color: styles.textColor }}
        >
          {styles.icon}
        </div>

        {/* Title */}
        <h2
          className="font-orbitron text-xs tracking-widest uppercase mb-2"
          style={{ color: styles.textColor }}
        >
          {displayTitle}
        </h2>

        {/* Message */}
        <p className="font-rajdhani text-sm text-white/70 text-center mb-3 max-w-md">
          {message}
        </p>

        {/* Technical Detail */}
        {technicalDetail && (
          <p className="font-mono text-xs text-white/25 text-center mb-3 max-w-md break-words">
            {technicalDetail}
          </p>
        )}

        {/* Last Successful Sync */}
        {lastSuccessfulSync && timeElapsed && (
          <p className="font-mono text-xs text-white/20 mb-4">
            Last successful sync: {timeElapsed}
          </p>
        )}

        {/* Connection Helper Text */}
        {showConnectionHelper && (
          <p className="font-rajdhani text-xs text-white/40 mb-4">
            Check your connection
          </p>
        )}

        {/* Retry Button */}
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="relative px-4 py-2 rounded font-orbitron text-xs tracking-widest uppercase transition-all"
            style={{
              color: styles.textColor,
              borderColor: styles.textColor,
              borderWidth: '1px',
              opacity: isRetrying ? 0.5 : 1,
              pointerEvents: isRetrying ? 'none' : 'auto',
              cursor: isRetrying ? 'default' : 'pointer',
            }}
          >
            <span className="flex items-center gap-2">
              {isRetrying && (
                <span
                  className="inline-block"
                  style={{
                    display: 'inline-block',
                    animation: 'spin 1s linear infinite',
                  }}
                >
                  ⟳
                </span>
              )}
              {retryLabel}
            </span>
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </button>
        )}
      </div>
    </>
  );
}
