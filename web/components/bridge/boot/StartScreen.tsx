'use client';

interface StartScreenProps {
  onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center">
      {/* App Name */}
      <h1
        className="font-orbitron font-bold text-6xl tracking-widest mb-8"
        style={{
          color: '#00f0ff', // Aurora cyan
          textShadow: '0 0 20px rgba(0, 240, 255, 0.5), 0 0 40px rgba(0, 240, 255, 0.3)',
        }}
      >
        SYNESTHESIAPAY
      </h1>

      {/* Start Button */}
      <button
        onClick={onStart}
        className="group relative px-8 py-3 font-mono text-sm tracking-wider uppercase
                   border border-cyan-400/50 rounded-sm
                   hover:border-cyan-400 hover:bg-cyan-400/10
                   transition-all duration-300"
        style={{
          boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)',
        }}
      >
        <span
          className="text-cyan-400 group-hover:text-cyan-300 transition-colors"
          style={{
            textShadow: '0 0 10px rgba(0, 240, 255, 0.3)',
          }}
        >
          Initialize Bridge
        </span>
      </button>
    </div>
  );
}
