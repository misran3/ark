import { useRef, useState } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';

export interface SaluteConfig {
  duration?: number;
  holdTime?: number;
}

/**
 * Hook for salute gesture animation
 *
 * @param characterRef - Reference to character group
 * @param config - Gesture configuration
 */
export function useSalute(
  characterRef: React.RefObject<THREE.Group>,
  config: SaluteConfig = {}
) {
  const { duration = 1, holdTime = 0.5 } = config;
  const [isPlaying, setIsPlaying] = useState(false);
  const timeline = useRef<gsap.core.Timeline | null>(null);

  const play = () => {
    if (isPlaying || !characterRef.current) return;

    const rightArm = characterRef.current.getObjectByName('rightArm');
    const rightHand = characterRef.current.getObjectByName('rightHand');
    if (!rightArm || !rightHand) return;

    setIsPlaying(true);

    // Create timeline
    timeline.current = gsap.timeline({
      onComplete: () => {
        setIsPlaying(false);
      },
    });

    // Raise arm to salute position
    timeline.current
      .to(rightArm.rotation, {
        x: -Math.PI / 2, // 90 degrees up
        duration: duration / 2,
        ease: 'power2.out',
      })
      .to(rightHand.position, {
        y: rightHand.position.y + 0.3,
        duration: duration / 2,
        ease: 'power2.out',
      }, '<') // Start at same time as arm
      .to({}, { duration: holdTime }) // Hold
      .to(rightArm.rotation, {
        x: 0, // Return to neutral
        duration: duration / 2,
        ease: 'power2.in',
      })
      .to(rightHand.position, {
        y: rightHand.position.y,
        duration: duration / 2,
        ease: 'power2.in',
      }, '<');
  };

  const stop = () => {
    if (timeline.current) {
      timeline.current.kill();
      setIsPlaying(false);
    }
  };

  return { play, stop, isPlaying };
}
