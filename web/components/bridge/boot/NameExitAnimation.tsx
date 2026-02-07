'use client';

export function NameExitAnimation() {
  return (
    <div className="fixed inset-0 z-[9999] bg-black overflow-hidden pointer-events-none">
      {/* Falling name */}
      <h1
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                   font-orbitron font-bold text-6xl tracking-widest
                   animate-name-exit"
        style={{
          color: '#00f0ff',
          textShadow: '0 0 20px rgba(0, 240, 255, 0.5)',
        }}
      >
        SYNESTHESIAPAY
      </h1>
    </div>
  );
}
