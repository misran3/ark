'use client';

import { VIEWPORT_BOUNDS } from '@/lib/constants/cockpit-layout';

/**
 * Layer A — Glass Bevel (z-8)
 *
 * Multi-step bevel creating "thick glass set into metal frame":
 * 1. Bright outer highlight edge (1-2px) — light catching glass frame lip
 * 2. Darker mid-thickness band (3-4px) — actual glass edge/depth
 * 3. Inner shadow lip (1-2px) — transition from glass edge to glass surface
 *
 * Corner reinforcement: more pronounced bevel with visible corner bracket hardware.
 */
export function GlassBevel() {

  return (
    <div
      className="fixed pointer-events-none"
      style={{
        ...VIEWPORT_BOUNDS,
        zIndex: 8,
      }}
      aria-hidden="true"
    >
      {/* Step 1: Outer highlight edge — light catching the glass frame lip */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow:
            'inset 0 0 0 1px rgba(180, 200, 230, 0.12), ' +
            'inset 0 -1px 0 rgba(140, 170, 210, 0.08)',
          borderRadius: '1px',
        }}
      />

      {/* Step 2: Mid-thickness band — the actual glass edge depth */}
      <div
        className="absolute"
        style={{
          inset: '1px',
          boxShadow:
            'inset 0 0 0 3px rgba(8, 12, 28, 0.7), ' +
            'inset 0 2px 4px rgba(0, 0, 0, 0.5), ' +
            'inset 0 -1px 3px rgba(0, 0, 0, 0.3)',
          borderRadius: '1px',
        }}
      />

      {/* Step 3: Inner shadow lip — transition to glass surface */}
      <div
        className="absolute"
        style={{
          inset: '4px',
          boxShadow:
            'inset 0 0 0 1px rgba(100, 140, 180, 0.06), ' +
            'inset 0 1px 2px rgba(0, 0, 0, 0.4)',
          borderRadius: '1px',
        }}
      />

      {/* Corner reinforcement brackets — thicker mounting hardware */}
      {/* Top-left */}
      <div
        className="absolute"
        style={{
          top: -1,
          left: -1,
          width: 28,
          height: 28,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            borderTop: '2px solid rgba(160, 180, 210, 0.1)',
            borderLeft: '2px solid rgba(160, 180, 210, 0.1)',
            boxShadow: 'inset 3px 3px 6px rgba(0, 0, 0, 0.4)',
          }}
        />
        {/* Mounting bolt */}
        <div
          className="absolute"
          style={{
            top: 5,
            left: 5,
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, rgba(200, 210, 230, 0.15), rgba(40, 50, 70, 0.3))',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
          }}
        />
      </div>

      {/* Top-right */}
      <div
        className="absolute"
        style={{
          top: -1,
          right: -1,
          width: 28,
          height: 28,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            borderTop: '2px solid rgba(160, 180, 210, 0.1)',
            borderRight: '2px solid rgba(140, 160, 190, 0.08)',
            boxShadow: 'inset -3px 3px 6px rgba(0, 0, 0, 0.4)',
          }}
        />
        <div
          className="absolute"
          style={{
            top: 5,
            right: 5,
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, rgba(200, 210, 230, 0.12), rgba(40, 50, 70, 0.3))',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
          }}
        />
      </div>

      {/* Bottom-left */}
      <div
        className="absolute"
        style={{
          bottom: -1,
          left: -1,
          width: 28,
          height: 28,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            borderBottom: '2px solid rgba(140, 160, 190, 0.08)',
            borderLeft: '2px solid rgba(160, 180, 210, 0.1)',
            boxShadow: 'inset 3px -3px 6px rgba(0, 0, 0, 0.4)',
          }}
        />
        <div
          className="absolute"
          style={{
            bottom: 5,
            left: 5,
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, rgba(200, 210, 230, 0.12), rgba(40, 50, 70, 0.3))',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
          }}
        />
      </div>

      {/* Bottom-right */}
      <div
        className="absolute"
        style={{
          bottom: -1,
          right: -1,
          width: 28,
          height: 28,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            borderBottom: '2px solid rgba(140, 160, 190, 0.08)',
            borderRight: '2px solid rgba(140, 160, 190, 0.08)',
            boxShadow: 'inset -3px -3px 6px rgba(0, 0, 0, 0.4)',
          }}
        />
        <div
          className="absolute"
          style={{
            bottom: 5,
            right: 5,
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, rgba(200, 210, 230, 0.12), rgba(40, 50, 70, 0.3))',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
          }}
        />
      </div>
    </div>
  );
}
