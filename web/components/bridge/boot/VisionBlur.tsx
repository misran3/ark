'use client';

interface VisionBlurProps {
  phase: 'blur' | 'blink';
}

export function VisionBlur({ phase }: VisionBlurProps) {
  if (phase === 'blur') {
    return (
      <div
        className="fixed inset-0 z-[998] pointer-events-none backdrop-blur-[20px] animate-reduce-blur"
      />
    );
  }

  if (phase === 'blink') {
    return (
      <div
        className="fixed inset-0 z-[998] pointer-events-none bg-black animate-quick-blink"
      />
    );
  }

  return null;
}
