'use client';

export function NameExitAnimation() {
  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden pointer-events-none"
      style={{
        animation: 'fadeToBlack 500ms ease-in forwards',
      }}
    >
      {/* Vignette — matches start screen, fades with container */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.85) 100%)',
        }}
      />

      {/* Falling name */}
      <h1
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                   font-orbitron font-black tracking-[0.3em]
                   animate-name-exit"
        style={{
          fontSize: 'clamp(80px, 12vw, 160px)',
          lineHeight: 1,
          color: 'rgba(0, 240, 255, 0.9)',
          textShadow:
            '0 0 30px rgba(0, 240, 255, 0.5), 0 0 60px rgba(0, 240, 255, 0.25)',
          mixBlendMode: 'screen',
        }}
      >
        ARK
      </h1>
    </div>
  );
}
