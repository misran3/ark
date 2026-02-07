'use client';

interface RefreshIndicatorProps {
  isRefetching: boolean;
}

export function RefreshIndicator({ isRefetching }: RefreshIndicatorProps) {
  if (!isRefetching) {
    return null;
  }

  return (
    <div className="absolute top-2 right-2 flex items-center gap-1.5">
      <div className="w-1.5 h-1.5 rounded-full bg-purple-400/40 animate-pulse" />
      <span className="font-orbitron text-[6px] tracking-[2px] text-purple-400/20 uppercase">
        SYNCING
      </span>
    </div>
  );
}

export default RefreshIndicator;
