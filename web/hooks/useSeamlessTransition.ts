'use client';

import { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTransitionStore } from '@/lib/stores/transition-store';
import gsap from 'gsap';

export function useSeamlessTransition() {
  const router = useRouter();
  const { startTransition, completeTransition, setCameraZ, setStarfieldOpacity, setIsTransitioning } = useTransitionStore();
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const transitionTo = useCallback(
    (route: string, panelRef?: React.RefObject<HTMLElement | null>) => {
      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        // Instant transition for accessibility
        router.push(route);
        return;
      }

      startTransition(route);

      // Kill any existing timeline
      if (timelineRef.current) {
        timelineRef.current.kill();
      }

      // Create GSAP timeline with proper phasing
      const tl = gsap.timeline({
        onStart: () => setIsTransitioning(true),
        onComplete: () => {
          setTimeout(() => {
            completeTransition();
            setIsTransitioning(false);
          }, 100);
        },
      });

      timelineRef.current = tl;

      // Phase 1: Click feedback (0-200ms)
      if (panelRef?.current) {
        tl.to(panelRef.current, { scale: 1.02, duration: 0.1, ease: 'power2.out' }, 0);
        tl.to(panelRef.current, { scale: 1.0, duration: 0.1, ease: 'power2.in' }, 0.1);
      }

      // Phase 1: Camera starts dolly (0-400ms)
      tl.to(
        {},
        {
          duration: 0.4,
          ease: 'power2.out',
          onUpdate: function () {
            const progress = this.progress();
            setCameraZ(10 - progress * 5); // Zoom from 10 to 5
          },
        },
        0.05
      );

      // Phase 2: Navigate at 200ms mark
      tl.call(() => router.push(route), undefined, 0.2);

      // Phase 2: Starfield fade (200-400ms)
      tl.to(
        {},
        {
          duration: 0.2,
          ease: 'power1.out',
          onUpdate: function () {
            const progress = this.progress();
            setStarfieldOpacity(1 - progress * 0.7); // 100% → 30%
          },
        },
        0.2
      );

      // Phase 2: Bridge content fade out (200-350ms)
      tl.to('.bridge-content', {
        opacity: 0,
        duration: 0.15,
        ease: 'power1.out',
      }, 0.2);

      // Phase 2: Animate side panels out
      tl.to('.side-panels', {
        x: (index) => (index === 0 ? -500 : 500),
        opacity: 0,
        duration: 0.2,
        ease: 'power2.inOut',
      }, 0.2);
    },
    [router, startTransition, completeTransition, setCameraZ, setStarfieldOpacity, setIsTransitioning]
  );

  const transitionBack = useCallback(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Instant transition for accessibility
      router.push('/');
      return;
    }

    // Kill any existing timeline
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    // Reverse transition (slightly faster: 600ms total)
    const tl = gsap.timeline({
      onStart: () => setIsTransitioning(true),
      onComplete: () => {
        completeTransition();
        setIsTransitioning(false);
      },
    });

    timelineRef.current = tl;

    // Navigate immediately
    tl.call(() => router.push('/'), undefined, 0);

    // Camera zoom back (0-500ms)
    tl.to(
      {},
      {
        duration: 0.5,
        ease: 'power2.inOut',
        onUpdate: function () {
          const progress = this.progress();
          setCameraZ(5 + progress * 5); // Zoom from 5 to 10
        },
      },
      0
    );

    // Brighten starfield (0-300ms)
    tl.to(
      {},
      {
        duration: 0.3,
        ease: 'power1.in',
        onUpdate: function () {
          const progress = this.progress();
          setStarfieldOpacity(0.3 + progress * 0.7); // 30% → 100%
        },
      },
      0
    );

    // Bring back side panels (200-500ms)
    tl.to('.side-panels', {
      x: 0,
      opacity: 1,
      duration: 0.3,
      ease: 'power2.inOut',
    }, 0.2);

    // Bridge content fade in (300-500ms)
    tl.fromTo('.bridge-content', {
      opacity: 0,
    }, {
      opacity: 1,
      duration: 0.2,
      ease: 'power1.in',
    }, 0.3);
  }, [router, completeTransition, setCameraZ, setStarfieldOpacity, setIsTransitioning]);

  return { transitionTo, transitionBack };
}
