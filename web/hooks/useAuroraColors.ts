'use client';

import { useEffect, useRef } from 'react';

const auroraKeyframes = [
  { time: 0,    colors: ['#8b5cf6', '#6366f1', '#3b82f6'] }, // Purple → Indigo → Blue
  { time: 0.25, colors: ['#3b82f6', '#06b6d4', '#10b981'] }, // Blue → Cyan → Green
  { time: 0.5,  colors: ['#10b981', '#34d399', '#6ee7b7'] }, // Green → Emerald → Mint
  { time: 0.75, colors: ['#6ee7b7', '#22d3ee', '#06b6d4'] }, // Mint → Cyan → Sky
  { time: 1.0,  colors: ['#06b6d4', '#6366f1', '#8b5cf6'] }, // Sky → Indigo → Purple
];

function interpolateColor(color1: string, color2: string, factor: number): string {
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);

  const r1 = (c1 >> 16) & 0xff;
  const g1 = (c1 >> 8) & 0xff;
  const b1 = c1 & 0xff;

  const r2 = (c2 >> 16) & 0xff;
  const g2 = (c2 >> 8) & 0xff;
  const b2 = c2 & 0xff;

  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);

  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function getAuroraColorsAtProgress(progress: number): string[] {
  // Find surrounding keyframes
  let idx = 0;
  for (let i = 0; i < auroraKeyframes.length - 1; i++) {
    if (progress >= auroraKeyframes[i].time && progress <= auroraKeyframes[i + 1].time) {
      idx = i;
      break;
    }
  }

  const kf1 = auroraKeyframes[idx];
  const kf2 = auroraKeyframes[idx + 1];

  const localProgress = (progress - kf1.time) / (kf2.time - kf1.time);

  return [
    interpolateColor(kf1.colors[0], kf2.colors[0], localProgress),
    interpolateColor(kf1.colors[1], kf2.colors[1], localProgress),
    interpolateColor(kf1.colors[2], kf2.colors[2], localProgress),
  ];
}

/** Initial colors — returned as a stable reference. Live values are on CSS variables. */
const INITIAL_COLORS = auroraKeyframes[0].colors;

export function useAuroraColors() {
  const colorsRef = useRef(INITIAL_COLORS);

  useEffect(() => {
    const startTime = Date.now();

    const updateColors = () => {
      const elapsed = (Date.now() - startTime) / 60000; // 60-second cycle
      const progress = elapsed % 1;
      const newColors = getAuroraColorsAtProgress(progress);
      colorsRef.current = newColors;

      // Update CSS variables (the only consumer of live values)
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--aurora-primary', newColors[0]);
        document.documentElement.style.setProperty('--aurora-secondary', newColors[1]);
        document.documentElement.style.setProperty('--aurora-tertiary', newColors[2]);
      }
    };

    // Update every 1000ms — the 60s color cycle doesn't need 10fps granularity
    const interval = setInterval(updateColors, 1000);

    // Initial update
    updateColors();

    return () => clearInterval(interval);
  }, []);

  return colorsRef.current;
}
