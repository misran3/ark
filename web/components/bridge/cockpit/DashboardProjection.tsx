'use client';

/**
 * DashboardProjection — visible horizontal top surface of the dashboard (z-9).
 *
 * Sits between the glass layers (z-5-8) and the CockpitFrame (z-10).
 * Creates the illusion of a physical console table extending forward
 * toward the viewport, with a dark shadow gap separating dashboard from glass.
 */
export function DashboardProjection() {
  return (
    <div className="fixed inset-0 z-[9] pointer-events-none" aria-hidden="true">
      {/* Shadow gap — dark channel between dashboard surface and viewport glass */}
      <div
        style={{
          position: 'absolute',
          bottom: '220px',
          left: '50px',
          right: '180px',
          height: '5px',
          transform: 'translateY(-35px)',
          background: 'rgba(0, 0, 0, 0.7)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}
      />

      {/* Dashboard top surface — perspective-projected horizontal plane */}
      <div
        style={{
          position: 'absolute',
          bottom: '220px',
          left: '50px',
          right: '180px',
          height: '35px',
          transform: 'perspective(400px) rotateX(45deg)',
          transformOrigin: 'center bottom',
          // Base surface color + lighting gradient from overhead
          backgroundImage: `
            linear-gradient(180deg, rgba(15,20,35,0.95) 0%, rgba(10,14,26,1) 100%),
            linear-gradient(90deg, rgba(200,220,255,0.02) 0%, transparent 60%)
          `,
          backgroundSize: '100% 100%',
          // 4D: Surface lighting — brighter at back edge (near overhead light)
          boxShadow: 'inset 0 1px 0 rgba(200,220,255,0.03), 0 -2px 6px rgba(0,0,0,0.4)',
        }}
      />
    </div>
  );
}
