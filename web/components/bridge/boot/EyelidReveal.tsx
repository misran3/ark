'use client';

interface EyelidRevealProps {
  isOpen: boolean;
}

export function EyelidReveal({ isOpen }: EyelidRevealProps) {
  return (
    <>
      {/* Top eyelid */}
      <div
        className="fixed top-0 left-0 right-0 h-[50vh] bg-black z-[999] transition-transform duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          transform: isOpen ? 'translateY(-100%)' : 'translateY(0)',
        }}
      />

      {/* Bottom eyelid */}
      <div
        className="fixed bottom-0 left-0 right-0 h-[50vh] bg-black z-[999] transition-transform duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          transform: isOpen ? 'translateY(100%)' : 'translateY(0)',
        }}
      />
    </>
  );
}
