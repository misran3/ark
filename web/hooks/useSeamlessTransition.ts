'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTransitionStore } from '@/lib/stores/transition-store';
import gsap from 'gsap';

export function useSeamlessTransition() {
  const router = useRouter();
  const { startTransition, completeTransition, setCameraZ, setStarfieldOpacity } = useTransitionStore();

  const transitionTo = useCallback(
    (route: string) => {
      startTransition(route);

      // Create GSAP timeline for smooth transitions
      const tl = gsap.timeline({
        onComplete: () => {
          setTimeout(() => {
            completeTransition();
          }, 100);
        },
      });

      // Animate starfield dimming
      tl.to(
        {},
        {
          duration: 0.3,
          onUpdate: function () {
            const progress = this.progress();
            setStarfieldOpacity(1 - progress * 0.7);
          },
        },
        0
      );

      // Animate side panels out
      tl.to('.side-panels', {
        x: (index) => (index === 0 ? -500 : 500),
        opacity: 0,
        duration: 0.3,
        ease: 'power2.inOut',
      }, 0.1);

      // Camera zoom (handled in Three.js scene via store)
      tl.to(
        {},
        {
          duration: 0.4,
          ease: 'power2.inOut',
          onUpdate: function () {
            const progress = this.progress();
            setCameraZ(10 - progress * 5); // Zoom from 10 to 5
          },
        },
        0
      );

      // Trigger Next.js navigation after visual transition starts
      setTimeout(() => {
        router.push(route);
      }, 200);
    },
    [router, startTransition, completeTransition, setCameraZ, setStarfieldOpacity]
  );

  const transitionBack = useCallback(() => {
    // Reverse transition
    const tl = gsap.timeline({
      onComplete: () => {
        completeTransition();
      },
    });

    // Brighten starfield
    tl.to(
      {},
      {
        duration: 0.3,
        onUpdate: function () {
          const progress = this.progress();
          setStarfieldOpacity(0.3 + progress * 0.7);
        },
      },
      0
    );

    // Camera zoom back
    tl.to(
      {},
      {
        duration: 0.4,
        ease: 'power2.inOut',
        onUpdate: function () {
          const progress = this.progress();
          setCameraZ(5 + progress * 5); // Zoom from 5 to 10
        },
      },
      0
    );

    // Bring back side panels
    tl.to('.side-panels', {
      x: 0,
      opacity: 1,
      duration: 0.3,
      ease: 'power2.inOut',
    }, 0.2);

    setTimeout(() => {
      router.push('/');
    }, 200);
  }, [router, completeTransition, setCameraZ, setStarfieldOpacity]);

  return { transitionTo, transitionBack };
}
