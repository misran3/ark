import { useRef, useState } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';

export interface PointConfig {
  duration?: number;
  target?: THREE.Vector3;
}

/**
 * Hook for pointing gesture animation
 *
 * @param characterRef - Reference to character group
 * @param config - Gesture configuration
 */
export function usePoint(
  characterRef: React.RefObject<THREE.Group>,
  config: PointConfig = {}
) {
  const { duration = 0.8, target = new THREE.Vector3(5, 0, 0) } = config;
  const [isPlaying, setIsPlaying] = useState(false);
  const timeline = useRef<gsap.core.Timeline | null>(null);

  const play = () => {
    if (isPlaying || !characterRef.current) return;

    const rightArm = characterRef.current.getObjectByName('rightArm');
    const torso = characterRef.current.getObjectByName('torso');
    if (!rightArm || !torso) return;

    setIsPlaying(true);

    // Calculate pointing direction
    const characterPos = characterRef.current.position;
    const direction = new THREE.Vector3().subVectors(target, characterPos);
    const angleY = Math.atan2(direction.x, direction.z);
    const angleX = Math.atan2(direction.y, direction.length());

    timeline.current = gsap.timeline({
      onComplete: () => {
        setIsPlaying(false);
      },
    });

    // Point at target
    timeline.current
      .to(torso.rotation, {
        y: angleY,
        duration: duration / 2,
        ease: 'power2.out',
      })
      .to(rightArm.rotation, {
        x: angleX,
        z: Math.PI / 4, // Extend arm
        duration: duration / 2,
        ease: 'power2.out',
      }, '<')
      .to({}, { duration: 0.5 }) // Hold
      .to(rightArm.rotation, {
        x: 0,
        z: 0,
        duration: duration / 2,
        ease: 'power2.in',
      })
      .to(torso.rotation, {
        y: 0,
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
