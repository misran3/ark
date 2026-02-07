'use client';

export function StaleDataIndicator() {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 flex justify-center">
      <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-b-md">
        <span className="font-orbitron text-[7px] tracking-[2px] text-yellow-500/60">
          ⚠ USING CACHED DATA — CONNECTION INTERRUPTED
        </span>
      </div>
    </div>
  );
}

export default StaleDataIndicator;
