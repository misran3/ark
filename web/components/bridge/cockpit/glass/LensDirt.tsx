'use client';

import { useRef, useEffect } from 'react';

/**
 * LensDirt — faint smudge overlay on cockpit glass.
 * Screen blend mode so it only reveals through bright bloom areas.
 * Generates a noise-based smudge texture on a canvas element.
 */
export function LensDirt() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 512;
    const h = 512;
    canvas.width = w;
    canvas.height = h;

    // Generate noise-based smudge pattern
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;

        // Multi-scale noise approximation
        const nx = x / w;
        const ny = y / h;
        const n1 = Math.sin(nx * 12.9898 + ny * 78.233) * 43758.5453;
        const n2 = Math.sin(nx * 47.123 + ny * 93.456) * 23421.631;
        const noise1 = (n1 - Math.floor(n1));
        const noise2 = (n2 - Math.floor(n2));

        // Create sparse smudge-like blobs
        const combined = noise1 * 0.6 + noise2 * 0.4;
        const smudge = Math.pow(Math.max(combined - 0.85, 0) * 4, 2);

        // Warm white tint
        const brightness = smudge * 255;
        data[i] = brightness * 0.9;      // R
        data[i + 1] = brightness * 0.92;  // G
        data[i + 2] = brightness;          // B
        data[i + 3] = brightness * 0.4;   // A — very low opacity
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        zIndex: 5,
        mixBlendMode: 'screen',
        opacity: 0.015,
      }}
    />
  );
}
