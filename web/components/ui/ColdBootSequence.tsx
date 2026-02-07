'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useBootStore } from '@/lib/stores/boot-store';

export default function ColdBootSequence() {
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { bootComplete, completeBoot, skipBoot } = useBootStore();

  useEffect(() => {
    // Check if user has already booted (session storage)
    const hasBooted = sessionStorage.getItem('hasBooted');
    if (hasBooted) {
      completeBoot();
      return;
    }

    // Create the GSAP timeline - abbreviated 8 second version for hackathon
    const tl = gsap.timeline({
      onComplete: () => {
        sessionStorage.setItem('hasBooted', 'true');
        completeBoot();
      },
    });

    // **Phase 1 (0-1.5s): System Init**
    // Text fade in
    tl.to('.boot-text', {
      opacity: 1,
      duration: 0.5,
      ease: 'power2.in',
    }, 0);

    // Progress bar animation
    tl.to('.progress-bar-fill', {
      width: '100%',
      duration: 1.5,
      ease: 'power1.inOut',
    }, 0);

    // Aurora shimmer background
    tl.to('.aurora-shimmer', {
      opacity: 0.3,
      duration: 1.5,
      ease: 'power2.inOut',
    }, 0);

    // **Phase 2 (1.5-3s): Viewport Reveal**
    // White flash
    tl.to('.flash', {
      opacity: 1,
      duration: 0.1,
    }, '1.5');

    tl.to('.flash', {
      opacity: 0,
      duration: 0.1,
    }, '1.61');

    // Eyelid open (top slides up)
    tl.to('.eyelid-top', {
      y: '-100vh',
      duration: 0.5,
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    } as any, '1.61');

    // Eyelid open (bottom slides down)
    tl.to('.eyelid-bottom', {
      y: '100vh',
      duration: 0.5,
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    } as any, '<');

    // Boot text fades out
    tl.to('.boot-text', {
      opacity: 0,
      duration: 0.3,
    }, '2.1');

    // Progress bar fades out
    tl.to('.progress-bar', {
      opacity: 0,
      duration: 0.3,
    }, '<');

    // **Phase 3 (3-5s): Bridge Frame Materialization**
    // Corner brackets fade in and scale (staggered)
    tl.to('.corner-bracket', {
      opacity: 1,
      scale: 1,
      duration: 0.4,
      stagger: 0.1,
      ease: 'back.out',
    }, '3');

    // Side beams slide in from edges
    tl.to('.side-beam-left', {
      x: 0,
      opacity: 1,
      duration: 0.4,
      ease: 'power2.out',
    } as any, '3.2');

    tl.to('.side-beam-right', {
      x: 0,
      opacity: 1,
      duration: 0.4,
      ease: 'power2.out',
    } as any, '<');

    // Top status bar slides down
    tl.to('.top-bar-boot', {
      y: 0,
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out',
    }, '3.6');

    // Bottom console slides up
    tl.to('.bottom-console-boot', {
      y: 0,
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out',
    }, '3.9');

    // Fade out the boot overlay
    tl.to('.cold-boot-overlay', {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
      pointerEvents: 'none' as any,
    }, '7.5');

    timelineRef.current = tl;

    // Add click handler to skip
    const handleClick = () => {
      if (timelineRef.current) {
        timelineRef.current.progress(1);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('click', handleClick);
    }

    return () => {
      if (container) {
        container.removeEventListener('click', handleClick);
      }
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, [completeBoot, skipBoot]);

  // Don't render overlay once boot is complete
  if (bootComplete) return null;

  return (
    <div
      ref={containerRef}
      className="cold-boot-overlay fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black cursor-pointer"
    >
      {/* Aurora shimmer background */}
      <div className="aurora-shimmer absolute inset-0 opacity-0">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/20 via-transparent to-cyan-600/20" />
      </div>

      {/* Flash overlay */}
      <div className="flash absolute inset-0 bg-white opacity-0 z-40" />

      {/* Eyelids */}
      <div className="eyelid-top absolute top-0 left-0 right-0 h-1/2 bg-black z-30" />
      <div className="eyelid-bottom absolute bottom-0 left-0 right-0 h-1/2 bg-black z-30" />

      {/* Boot text */}
      <div className="boot-text absolute inset-0 flex flex-col items-center justify-center opacity-0 z-20 pointer-events-none">
        <div className="font-orbitron font-black text-5xl tracking-[0.2em] aurora-text mb-2">
          SYNESTHESIAPAY
        </div>
        <div className="font-orbitron text-sm tracking-[0.15em] text-aurora-primary/50">
          BRIDGE SYSTEMS INITIALIZING...
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar absolute bottom-1/3 flex flex-col items-center gap-3 opacity-100">
        <div className="w-[400px] h-[8px] bg-white/5 rounded-full overflow-hidden border border-aurora-primary/20">
          <div className="progress-bar-fill h-full w-0 bg-gradient-to-r from-aurora-primary via-aurora-secondary to-aurora-tertiary rounded-full" />
        </div>
        <div className="font-mono text-[10px] text-aurora-primary/40">
          INITIALIZING SYSTEMS...
        </div>
      </div>

      {/* Corner brackets (will appear after eyelids open) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Top-left */}
        <div className="corner-bracket tl absolute top-8 left-8 w-[40px] h-[40px] border-t-[2px] border-l-[2px] border-aurora-primary/0 opacity-0" />

        {/* Top-right */}
        <div className="corner-bracket tr absolute top-8 right-8 w-[40px] h-[40px] border-t-[2px] border-r-[2px] border-aurora-primary/0 opacity-0" />

        {/* Bottom-left */}
        <div className="corner-bracket bl absolute bottom-8 left-8 w-[40px] h-[40px] border-b-[2px] border-l-[2px] border-aurora-primary/0 opacity-0" />

        {/* Bottom-right */}
        <div className="corner-bracket br absolute bottom-8 right-8 w-[40px] h-[40px] border-b-[2px] border-r-[2px] border-aurora-primary/0 opacity-0" />
      </div>

      {/* Side beams */}
      <div className="side-beam-left absolute left-0 top-0 bottom-0 w-7 opacity-0 -translate-x-full z-10 pointer-events-none bg-gradient-to-r from-space-darker to-space-dark border-r border-aurora-primary/20" />
      <div className="side-beam-right absolute right-0 top-0 bottom-0 w-7 opacity-0 translate-x-full z-10 pointer-events-none bg-gradient-to-l from-space-darker to-space-dark border-l border-aurora-primary/20" />

      {/* Top bar placeholder (for boot sequence only) */}
      <div className="top-bar-boot absolute top-0 left-0 right-0 h-11 opacity-0 -translate-y-full z-10 pointer-events-none bg-gradient-to-b from-space-dark/95 to-space-dark/80 border-b border-aurora-primary/10" />

      {/* Bottom console placeholder (for boot sequence only) */}
      <div className="bottom-console-boot absolute bottom-0 left-0 right-0 h-[220px] opacity-0 translate-y-full z-10 pointer-events-none bg-gradient-to-t from-space-dark via-space-dark/98 to-space-dark/95 border-t border-aurora-primary/10" />
    </div>
  );
}
