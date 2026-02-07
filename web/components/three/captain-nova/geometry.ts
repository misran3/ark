// web/components/three/captain-nova/geometry.ts
import * as THREE from 'three';

export interface NovaGeometryConfig {
  baseHeight?: number;
  headRadius?: number;
  torsoWidth?: number;
  shoulderWidth?: number;
  armLength?: number;
  legLength?: number;
}

const DEFAULT_CONFIG: Required<NovaGeometryConfig> = {
  baseHeight: 1.8,
  headRadius: 0.12,
  torsoWidth: 0.22,
  shoulderWidth: 0.3,
  armLength: 0.4,
  legLength: 0.55,
};

// Individual body part creators
function createHead(radius: number): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(radius, 24, 24);
  const mesh = new THREE.Mesh(geometry);
  mesh.name = 'head';
  return mesh;
}

function createNeck(height: number): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(0.04, 0.05, height, 12);
  const mesh = new THREE.Mesh(geometry);
  mesh.name = 'neck';
  return mesh;
}

function createTorso(width: number, height: number, depth: number): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const mesh = new THREE.Mesh(geometry);
  mesh.name = 'torso';
  return mesh;
}

function createShoulder(side: 'left' | 'right'): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(0.055, 12, 12);
  const mesh = new THREE.Mesh(geometry);
  mesh.name = `${side}Shoulder`;
  return mesh;
}

function createArm(side: 'left' | 'right', armWidth: number, armLength: number): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(armWidth, armWidth * 0.8, armLength, 10);
  const mesh = new THREE.Mesh(geometry);
  mesh.name = `${side}Arm`;
  return mesh;
}

function createHand(side: 'left' | 'right'): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(0.04, 10, 10);
  const mesh = new THREE.Mesh(geometry);
  mesh.name = `${side}Hand`;
  return mesh;
}

function createHips(hipWidth: number, torsoDepth: number): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(hipWidth, 0.12, torsoDepth);
  const mesh = new THREE.Mesh(geometry);
  mesh.name = 'hips';
  return mesh;
}

function createLeg(side: 'left' | 'right', legWidth: number, legLength: number): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(legWidth, legWidth * 0.85, legLength, 12);
  const mesh = new THREE.Mesh(geometry);
  mesh.name = `${side}Leg`;
  return mesh;
}

function createBoot(side: 'left' | 'right'): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(0.08, 0.06, 0.12);
  const mesh = new THREE.Mesh(geometry);
  mesh.name = `${side}Boot`;
  return mesh;
}

function createEmblem(): THREE.Mesh {
  const geometry = new THREE.CircleGeometry(0.04, 16);
  const mesh = new THREE.Mesh(geometry);
  mesh.name = 'emblem';
  return mesh;
}

function createShoulderPad(side: 'left' | 'right'): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(0.08, 0.04, 0.06);
  const mesh = new THREE.Mesh(geometry);
  mesh.name = `${side}ShoulderPad`;
  return mesh;
}

// Position calculator based on measurements
interface BodyPartPositions {
  head: THREE.Vector3;
  neck: THREE.Vector3;
  torso: THREE.Vector3;
  leftShoulder: THREE.Vector3;
  rightShoulder: THREE.Vector3;
  leftArm: THREE.Vector3;
  rightArm: THREE.Vector3;
  leftHand: THREE.Vector3;
  rightHand: THREE.Vector3;
  hips: THREE.Vector3;
  leftLeg: THREE.Vector3;
  rightLeg: THREE.Vector3;
  leftBoot: THREE.Vector3;
  rightBoot: THREE.Vector3;
  emblem: THREE.Vector3;
  leftShoulderPad: THREE.Vector3;
  rightShoulderPad: THREE.Vector3;
}

function calculatePositions(config: Required<NovaGeometryConfig>): BodyPartPositions {
  const { baseHeight, headRadius, shoulderWidth, armLength, legLength } = config;

  // Derived measurements
  const neckHeight = 0.1;
  const torsoHeight = 0.5;
  const torsoDepth = 0.15;
  const hipWidth = 0.2;

  // Y-axis positions (top-down construction)
  const headY = baseHeight - headRadius;
  const neckY = baseHeight - headRadius * 2 - neckHeight / 2;
  const shoulderY = baseHeight - headRadius * 2 - neckHeight - 0.05;
  const torsoY = baseHeight - headRadius * 2 - neckHeight - torsoHeight / 2;
  const hipY = baseHeight - headRadius * 2 - neckHeight - torsoHeight;

  return {
    head: new THREE.Vector3(0, headY, 0),
    neck: new THREE.Vector3(0, neckY, 0),
    torso: new THREE.Vector3(0, torsoY, 0),
    leftShoulder: new THREE.Vector3(-shoulderWidth / 2, shoulderY, 0),
    rightShoulder: new THREE.Vector3(shoulderWidth / 2, shoulderY, 0),
    leftArm: new THREE.Vector3(-shoulderWidth / 2, shoulderY - armLength / 2, 0),
    rightArm: new THREE.Vector3(shoulderWidth / 2, shoulderY - armLength / 2, 0),
    leftHand: new THREE.Vector3(-shoulderWidth / 2, shoulderY - armLength, 0),
    rightHand: new THREE.Vector3(shoulderWidth / 2, shoulderY - armLength, 0),
    hips: new THREE.Vector3(0, hipY, 0),
    leftLeg: new THREE.Vector3(-hipWidth / 3, hipY - legLength / 2, 0),
    rightLeg: new THREE.Vector3(hipWidth / 3, hipY - legLength / 2, 0),
    leftBoot: new THREE.Vector3(-hipWidth / 3, hipY - legLength - 0.03, 0.02),
    rightBoot: new THREE.Vector3(hipWidth / 3, hipY - legLength - 0.03, 0.02),
    emblem: new THREE.Vector3(0, torsoY + 0.15, torsoDepth / 2 + 0.001),
    leftShoulderPad: new THREE.Vector3(-shoulderWidth / 2, shoulderY + 0.02, 0),
    rightShoulderPad: new THREE.Vector3(shoulderWidth / 2, shoulderY + 0.02, 0),
  };
}

// Main assembly function
export function assembleCharacter(userConfig?: NovaGeometryConfig): THREE.Group {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  const character = new THREE.Group();
  character.name = 'novaCharacter';

  // Derived measurements
  const torsoHeight = 0.5;
  const torsoDepth = 0.15;
  const neckHeight = 0.1;
  const hipWidth = 0.2;
  const armWidth = 0.045;
  const legWidth = 0.06;

  // Calculate all positions
  const positions = calculatePositions(config);

  // Create all body parts
  const head = createHead(config.headRadius);
  const neck = createNeck(neckHeight);
  const torso = createTorso(config.torsoWidth, torsoHeight, torsoDepth);
  const leftShoulder = createShoulder('left');
  const rightShoulder = createShoulder('right');
  const leftArm = createArm('left', armWidth, config.armLength);
  const rightArm = createArm('right', armWidth, config.armLength);
  const leftHand = createHand('left');
  const rightHand = createHand('right');
  const hips = createHips(hipWidth, torsoDepth);
  const leftLeg = createLeg('left', legWidth, config.legLength);
  const rightLeg = createLeg('right', legWidth, config.legLength);
  const leftBoot = createBoot('left');
  const rightBoot = createBoot('right');
  const emblem = createEmblem();
  const leftShoulderPad = createShoulderPad('left');
  const rightShoulderPad = createShoulderPad('right');

  // Position all parts
  head.position.copy(positions.head);
  neck.position.copy(positions.neck);
  torso.position.copy(positions.torso);
  leftShoulder.position.copy(positions.leftShoulder);
  rightShoulder.position.copy(positions.rightShoulder);
  leftArm.position.copy(positions.leftArm);
  rightArm.position.copy(positions.rightArm);
  leftHand.position.copy(positions.leftHand);
  rightHand.position.copy(positions.rightHand);
  hips.position.copy(positions.hips);
  leftLeg.position.copy(positions.leftLeg);
  rightLeg.position.copy(positions.rightLeg);
  leftBoot.position.copy(positions.leftBoot);
  rightBoot.position.copy(positions.rightBoot);
  emblem.position.copy(positions.emblem);
  leftShoulderPad.position.copy(positions.leftShoulderPad);
  rightShoulderPad.position.copy(positions.rightShoulderPad);

  // Add all parts to character group
  character.add(
    head,
    neck,
    torso,
    leftShoulder,
    rightShoulder,
    leftArm,
    rightArm,
    leftHand,
    rightHand,
    hips,
    leftLeg,
    rightLeg,
    leftBoot,
    rightBoot,
    emblem,
    leftShoulderPad,
    rightShoulderPad
  );

  return character;
}
