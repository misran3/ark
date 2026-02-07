'use client';

import { VIEWPORT_BOUNDS } from '@/lib/constants/cockpit-layout';

/**
 * Layer B — Glass Surface (z-7)
 *
 * Full viewport overlay simulating the glass itself:
 * - Tint: subtle blue-green (opacity 0.02-0.03)
 * - Edge vignette: radial gradient darkening corners
 * - Specular highlight: elongated soft trapezoid, upper-left, slow drift (20-30s)
 * - Micro-scratch texture: faint diagonal lines (opacity 0.005-0.01)
 * - Thermal gradient zone: warm spot near bottom center (opacity 0.01)
 */
export function GlassSurface() {

  return (
    <div
      className="fixed pointer-events-none"
      style={{
        ...VIEWPORT_BOUNDS,
        zIndex: 7,
      }}
      aria-hidden="true"
    >
      {/* Blue-green glass tint */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(100, 180, 200, 0.025)',
        }}
      />

      {/* Edge vignette — thick glass bending light at periphery */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 75% 70% at 50% 50%, transparent 50%, rgba(0, 5, 15, 0.15) 100%)',
        }}
      />

      {/* Specular highlight — overhead bridge strip lighting reflection */}
      <div
        className="absolute inset-0 overflow-hidden"
      >
        <div
          className="viewport-glass-specular"
          style={{
            position: 'absolute',
            top: '8%',
            left: '12%',
            width: '35%',
            height: '18%',
            background:
              'linear-gradient(165deg, ' +
              'transparent 15%, ' +
              'rgba(200, 220, 255, 0.03) 30%, ' +
              'rgba(220, 235, 255, 0.045) 45%, ' +
              'rgba(200, 220, 255, 0.03) 60%, ' +
              'transparent 80%)',
            clipPath: 'polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)',
            animation: 'glass-specular-drift 25s ease-in-out infinite',
            willChange: 'transform',
          }}
        />
      </div>

      {/* Micro-scratch texture — micrometeorite encounters */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(
            38deg,
            transparent,
            transparent 40px,
            rgba(255, 255, 255, 0.007) 40px,
            rgba(255, 255, 255, 0.007) 41px
          ), repeating-linear-gradient(
            -52deg,
            transparent,
            transparent 65px,
            rgba(255, 255, 255, 0.005) 65px,
            rgba(255, 255, 255, 0.005) 66px
          ), repeating-linear-gradient(
            22deg,
            transparent,
            transparent 90px,
            rgba(255, 255, 255, 0.004) 90px,
            rgba(255, 255, 255, 0.004) 91px
          )`,
        }}
      />

      {/* Thermal gradient zone — heat from console instruments */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 40% 25% at 50% 95%, rgba(200, 150, 80, 0.01) 0%, transparent 100%)',
        }}
      />

      {/* Canopy strut shadows — soft diagonal strips matching R3F strut convergence.
          Offset 2-3px in overhead light direction (downward-right). */}
      {/* Top-left strut shadow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.03) 2%, transparent 4%)',
          transform: 'translate(2px, 3px)',
        }}
      />
      {/* Top-right strut shadow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(225deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.03) 2%, transparent 4%)',
          transform: 'translate(2px, 3px)',
        }}
      />
      {/* Bottom-left strut shadow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(45deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.02) 2%, transparent 4%)',
          transform: 'translate(2px, 2px)',
        }}
      />
      {/* Bottom-right strut shadow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(315deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.02) 2%, transparent 4%)',
          transform: 'translate(2px, 2px)',
        }}
      />
    </div>
  );
}
