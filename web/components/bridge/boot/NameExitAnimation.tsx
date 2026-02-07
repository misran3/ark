'use client';

export function NameExitAnimation() {
  return (
    <div className="fixed inset-0 z-[9999] bg-black overflow-hidden pointer-events-none">
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
        }}
      >
        ARK
      </h1>
    </div>
  );
}
