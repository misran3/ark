import * as THREE from 'three';

export interface NovaGeometryConfig {
  polyCount?: 'low' | 'medium' | 'high'; // 2k, 4-5k, 8k
  helmetStyle?: 'minimal' | 'detailed';
  fingerCount?: 3 | 4 | 5;
}

export interface NovaBodyParts {
  root: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  visor: THREE.Mesh;
  leftShoulder: THREE.Group;
  rightShoulder: THREE.Group;
  leftUpperArm: THREE.Group;
  rightUpperArm: THREE.Group;
  leftForearm: THREE.Group;
  rightForearm: THREE.Group;
  leftHand: THREE.Group;
  rightHand: THREE.Group;
  chestEmblem: THREE.Mesh;
  belt: THREE.Mesh;
}

export interface AnimationConfig {
  breathing?: { enabled: boolean; cycleDuration: number; scaleAmount: number };
  headTracking?: {
    enabled: boolean;
    maxRotationY: number;
    maxRotationX: number;
    lerpSpeed: number;
  };
  idleSway?: { enabled: boolean; speed: number; amount: number };
}

export interface GestureType {
  name: 'point' | 'salute' | 'at-ease';
  duration: number;
  easing: EasingFunction;
}

export type EasingFunction = (t: number) => number;

export interface AnimationState {
  breathingPhase: number;
  swayPhase: number;
  weightShiftTimer: number;
  lastWeightShiftTime: number;
  headTargetRotation: { x: number; y: number };
  glitchCooldown: number;
}
