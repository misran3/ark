'use client';

export function CaptainNovaPanel() {
  return (
    <div className="h-full bg-gradient-to-b from-space-dark/80 to-space-dark/95 border-l border-aurora-primary/10 p-4">
      <div className="glass-panel glass-panel-level-2 h-full flex flex-col">
        {/* Header */}
        <div className="font-orbitron text-[10px] tracking-[2px] text-aurora-primary/40 uppercase p-3 border-b border-aurora-primary/10">
          Captain Nova
        </div>

        {/* Content area - to be filled by other agent */}
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-aurora-primary/10 border-2 border-aurora-primary/30 flex items-center justify-center">
              <span className="text-2xl">{'\uD83D\uDC64'}</span>
            </div>
            <div className="font-rajdhani text-sm text-white/60">
              Captain Nova initializing...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
