'use client';

interface LoadingBarProps {
  progress: number; // 0-100
}

export function LoadingBar({ progress }: LoadingBarProps) {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-8">
      {/* Logo */}
      <div
        className="font-orbitron text-3xl font-bold aurora-text opacity-0 animate-[fadeIn_0.6s_ease-out_forwards]"
        style={{ animationDelay: '0.2s' }}
      >
        SYNESTHESIAPAY
      </div>

      {/* Boot text lines */}
      <div className="flex flex-col gap-3">
        {[
          { text: 'INITIALIZING NEURAL LINK...', delay: '0.6s' },
          { text: 'SCANNING FINANCIAL MATRICES...', delay: '1.0s' },
          { text: 'THREAT DETECTION ONLINE...', delay: '1.4s' },
          { text: 'CAPTAIN NOVA ACTIVATED...', delay: '1.8s' },
          { text: 'BRIDGE SYSTEMS NOMINAL \u2713', delay: '2.2s' },
        ].map((line, i) => (
          <div
            key={i}
            className="font-mono text-sm text-aurora-primary opacity-0 animate-[fadeInUp_0.3s_ease-out_forwards]"
            style={{
              animationDelay: line.delay,
              textShadow: '0 0 20px rgba(139, 92, 246, 0.4)'
            }}
          >
            {line.text}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-[300px] h-[2px] bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-aurora-primary via-aurora-tertiary to-green-500 transition-all duration-300 ease-out"
          style={{
            width: `${progress}%`,
            boxShadow: '0 0 15px rgba(139, 92, 246, 0.6)'
          }}
        />
      </div>
    </div>
  );
}
