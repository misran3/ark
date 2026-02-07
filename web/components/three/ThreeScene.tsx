'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import Starfield from './Starfield';
import CaptainNova from './CaptainNova';
import Threats from './Threats';
import PostProcessingPipeline from './PostProcessingPipeline';
import { useTransitionStore } from '@/lib/stores/transition-store';
import { useNovaVariant } from '@/contexts/NovaVariantContext';
import gsap from 'gsap';
import * as THREE from 'three';

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

function GLBModel({ path }: { path: string }) {
  const { scene } = useGLTF(path);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    // Auto-center the model at origin
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    clone.position.set(-center.x, -box.min.y, -center.z);
    return clone;
  }, [scene]);

  // Cleanup: dispose of cloned scene when component unmounts or variant changes
  useEffect(() => {
    return () => {
      clonedScene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          // Dispose geometry
          if (obj.geometry) {
            obj.geometry.dispose();
          }
          // Dispose materials (can be single or array)
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((mat) => mat.dispose());
            } else {
              obj.material.dispose();
            }
          }
        }
      });
    };
  }, [clonedScene]);

  return <primitive object={clonedScene} position={[-4, -2, 0]} />;
}

function NovaVariantRenderer() {
  const { activeVariant } = useNovaVariant();

  if (activeVariant.type === 'skeletal') {
    return <CaptainNova />;
  }

  if (activeVariant.type === 'community' && activeVariant.path) {
    return (
      <Suspense fallback={null}>
        <GLBModel path={activeVariant.path} />
      </Suspense>
    );
  }

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
          <NovaVariantRenderer />
          <Threats />
          <PostProcessingPipeline />
        </Suspense>
      </Canvas>
    </div>
  );
}
