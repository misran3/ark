'use client';

/**
 * DashboardProjection — visible dashboard ledge between viewport glass and console (z-9).
 *
 * Creates the physical transition where the windshield meets the dashboard,
 * like a car's dash meeting the windshield. Bottom canopy struts visually
 * disappear behind this ledge.
 *
 * Three elements:
 * 1. Highlight edge — bright top lip catching overhead light
 * 2. Ledge surface — angled brushed-metal surface receding toward viewer
 * 3. Shadow undercut — dark gap separating ledge from console below
 */
export function DashboardProjection() {
  return (
    <div className="fixed inset-0 z-[9] pointer-events-none" aria-hidden="true">
      {/* === Shadow undercut: dark gap between ledge and console === */}
      <div
        style={{
          position: 'absolute',
          bottom: '220px',
          left: '50px',
          right: '180px',
          height: '4px',
          background: '#000000',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.8), 0 2px 6px rgba(0,0,0,0.6)',
        }}
      />

      {/* === Ledge surface: angled horizontal plane === */}
      <div
        style={{
          position: 'absolute',
          bottom: '224px',
          left: '50px',
          right: '180px',
          height: '24px',
          transform: 'perspective(600px) rotateX(25deg)',
          transformOrigin: 'center bottom',
          // Opaque brushed metal with wider value range
          background: `
            linear-gradient(180deg,
              #1a2238 0%,
              #0e1220 60%,
              #080a14 100%
            )
          `,
          // Visible horizontal brush lines (matching console)
          backgroundImage: `
            linear-gradient(180deg,
              #1a2238 0%,
              #0e1220 60%,
              #080a14 100%
            ),
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 1px,
              rgba(200, 220, 255, 0.02) 1px,
              transparent 2px
            )
          `,
          boxShadow:
            'inset 0 1px 0 rgba(200, 220, 255, 0.10), ' +
            'inset 0 -1px 0 rgba(0, 0, 0, 0.6), ' +
            '0 -4px 12px rgba(0, 0, 0, 0.5)',
        }}
      />

      {/* === Highlight edge: bright top lip catching overhead light === */}
      <div
        style={{
          position: 'absolute',
          bottom: '248px',
          left: '50px',
          right: '180px',
          height: '2px',
          background: 'linear-gradient(90deg, rgba(160, 180, 210, 0.06), rgba(200, 220, 255, 0.28) 25%, rgba(210, 225, 255, 0.32) 50%, rgba(200, 220, 255, 0.28) 75%, rgba(160, 180, 210, 0.06))',
          boxShadow: '0 0 8px rgba(200, 220, 255, 0.08), 0 1px 3px rgba(0, 0, 0, 0.7)',
        }}
      />

      {/* === Ledge end caps: where ledge meets side frames === */}
      {/* Left end cap */}
      <div
        style={{
          position: 'absolute',
          bottom: '224px',
          left: '50px',
          width: '8px',
          height: '24px',
          background: 'linear-gradient(90deg, rgba(200, 220, 255, 0.03), transparent)',
        }}
      />
      {/* Right end cap */}
      <div
        style={{
          position: 'absolute',
          bottom: '224px',
          right: '180px',
          width: '8px',
          height: '24px',
          background: 'linear-gradient(270deg, rgba(200, 220, 255, 0.03), transparent)',
        }}
      />
    </div>
  );
}
