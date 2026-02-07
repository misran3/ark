'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect } from 'react';
import Starfield from './Starfield';
import CaptainNova from './CaptainNova';
import Threats from './Threats';
import PostProcessingPipeline from './PostProcessingPipeline';
import { useTransitionStore } from '@/lib/stores/transition-store';
import gsap from 'gsap';

function CameraController() {
  const { camera } = useThree();
  const cameraZ = useTransitionStore((state) => state.cameraZ);

  useEffect(() => {
    gsap.to(camera.position, {
      z: cameraZ,
      duration: 0.4,
      ease: 'power2.inOut',
    });
  }, [cameraZ, camera]);

  return null;
}

export default function ThreeScene() {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 75 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <Suspense fallback={null}>
          {/* Camera controller for transitions */}
          <CameraController />

          {/* Lighting */}
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={0.5} color="#8b5cf6" />
          <pointLight position={[-10, -10, 5]} intensity={0.3} color="#06b6d4" />

          {/* Scene elements */}
          <Starfield />
          <CaptainNova />
          <Threats />
          <PostProcessingPipeline />
        </Suspense>
      </Canvas>
    </div>
  );
}
