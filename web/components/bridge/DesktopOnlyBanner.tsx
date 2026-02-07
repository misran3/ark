'use client';

import { useIsMobile } from '@/lib/utils/device';

export function DesktopOnlyBanner() {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[9999] bg-yellow-500/95 backdrop-blur-sm px-4 py-3 text-center">
      <div className="flex items-center justify-center gap-2">
        <span className="text-2xl">🖥️</span>
        <div className="font-rajdhani text-sm text-black">
          <strong>Desktop Experience Recommended</strong>
          <br />
          Bridge view optimized for screens 1024px and wider
        </div>
      </div>
    </div>
  );
}
