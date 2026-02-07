'use client';

import { GlassPanel } from './GlassPanel';

interface MetricCardProps {
  title: string;
  value: string;
  trend?: number;
  color?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  trend,
  color = 'text-cyan-500',
  className = '',
}: MetricCardProps) {
  const trendColor = trend ? (trend > 0 ? 'text-green-500' : 'text-red-500') : '';
  const trendArrow = trend ? (trend > 0 ? '▲' : '▼') : '';

  return (
    <GlassPanel level={2} hover className={`p-6 ${className}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="label mb-2">{title}</p>
          <h2 className={`text-3xl font-bold font-orbitron ${color}`}>
            {value}
          </h2>
        </div>
        {trend !== undefined && (
          <div
            className={`text-sm font-orbitron font-bold ${trendColor}`}
          >
            {trendArrow} {Math.abs(trend)}%
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
