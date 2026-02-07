import * as THREE from 'three';
import type { NovaGeometryConfig, NovaBodyParts } from './types';

/**
 * Creates the complete Captain Nova v3 geometry hierarchy.
 * Returns nested Groups for cascading animations.
 * ~4,000-5,000 triangles total with faceted low-poly aesthetic.
 */
export function createNovaGeometry(config?: NovaGeometryConfig): NovaBodyParts {
  const helmetStyle = config?.helmetStyle || 'minimal';
  const fingerCount = config?.fingerCount || 4;

  // Root hierarchy
  const root = new THREE.Group();
  root.name = 'nova-root';

  const torso = new THREE.Group();
  torso.name = 'nova-torso';
  root.add(torso);

  // Torso mesh
  const torsoMesh = createTorsoMesh();
  torso.add(torsoMesh);

  // Head (attached to torso for breathing cascade)
  const head = createHead(helmetStyle);
  torso.add(head);

  const visor = head.children.find((c) => c.name === 'visor') as THREE.Mesh;

  // Shoulders
  const { leftShoulder, rightShoulder } = createShoulders();
  torso.add(leftShoulder, rightShoulder);

  // Left arm chain
  const {
    upperArm: leftUpperArm,
    forearm: leftForearm,
    hand: leftHand,
  } = createArm('left', fingerCount);
  leftShoulder.add(leftUpperArm);
  leftUpperArm.add(leftForearm);
  leftForearm.add(leftHand);

  // Right arm chain
  const {
    upperArm: rightUpperArm,
    forearm: rightForearm,
    hand: rightHand,
  } = createArm('right', fingerCount);
  rightShoulder.add(rightUpperArm);
  rightUpperArm.add(rightForearm);
  rightForearm.add(rightHand);

  // Chest emblem and belt
  const chestEmblem = createChestEmblem();
  torso.add(chestEmblem);

  const belt = createBelt();
  torso.add(belt);

  return {
    root,
    torso,
    head,
    visor,
    leftShoulder,
    rightShoulder,
    leftUpperArm,
    rightUpperArm,
    leftForearm,
    rightForearm,
    leftHand,
    rightHand,
    chestEmblem,
    belt,
  };
}

// ---------------------------------------------------------------------------
// Torso
// ---------------------------------------------------------------------------

function createTorsoMesh(): THREE.Mesh {
  const torsoGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.3, 3, 4, 2);
  const mesh = new THREE.Mesh(torsoGeometry);
  mesh.name = 'torso-chest';
  mesh.position.set(0, 0.2, 0);
  return mesh;
}

// ---------------------------------------------------------------------------
// Head (helmet + face)
// ---------------------------------------------------------------------------

function createHead(style: string): THREE.Group {
  const group = new THREE.Group();
  group.name = 'nova-head';
  group.position.set(0, 0.8, 0);

  // Helmet dome (~800 tris)
  const helmetGeometry = new THREE.SphereGeometry(0.25, 16, 12);
  const helmetMesh = new THREE.Mesh(helmetGeometry);
  helmetMesh.name = 'helmet-dome';
  group.add(helmetMesh);

  // Visor cutout (hexagonal opening, ~100 tris)
  const visorShape = new THREE.Shape();
  const visorRadius = 0.18;
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const x = Math.cos(angle) * visorRadius;
    const y = Math.sin(angle) * visorRadius * 0.7; // Slightly flattened
    if (i === 0) visorShape.moveTo(x, y);
    else visorShape.lineTo(x, y);
  }
  visorShape.closePath();

  const visorGeometry = new THREE.ShapeGeometry(visorShape);
  const visorMesh = new THREE.Mesh(visorGeometry);
  visorMesh.name = 'visor';
  visorMesh.position.set(0, 0, 0.24);
  visorMesh.rotation.set(0, 0, Math.PI / 12);
  group.add(visorMesh);

  // Facial features
  const face = createFacialFeatures();
  group.add(face);

  // Helmet rank insignia (optional detail)
  if (style === 'detailed') {
    const insigniaGeometry = new THREE.BoxGeometry(0.04, 0.06, 0.01);
    const insigniaMesh = new THREE.Mesh(insigniaGeometry);
    insigniaMesh.name = 'helmet-insignia';
    insigniaMesh.position.set(0.2, 0.05, 0.1);
    group.add(insigniaMesh);
  }

  return group;
}

function createFacialFeatures(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'facial-features';
  group.position.set(0, 0, 0.23);

  // Eyes (glowing hexagons, ~50 tris each)
  const eyeGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.02, 6);
  eyeGeometry.rotateX(Math.PI / 2);

  const leftEye = new THREE.Mesh(eyeGeometry);
  leftEye.name = 'eye-left';
  leftEye.position.set(-0.06, 0.02, 0.01);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeometry.clone());
  rightEye.name = 'eye-right';
  rightEye.position.set(0.06, 0.02, 0.01);
  group.add(rightEye);

  // Nose (small wedge, ~50 tris)
  const noseGeometry = new THREE.ConeGeometry(0.02, 0.04, 4);
  noseGeometry.rotateX(Math.PI / 2);
  const nose = new THREE.Mesh(noseGeometry);
  nose.name = 'nose';
  nose.position.set(0, -0.02, 0.02);
  group.add(nose);

  // Mouth (thin geometric slit, ~30 tris)
  const mouthGeometry = new THREE.BoxGeometry(0.08, 0.01, 0.01);
  const mouth = new THREE.Mesh(mouthGeometry);
  mouth.name = 'mouth';
  mouth.position.set(0, -0.08, 0.015);
  group.add(mouth);

  return group;
}

// ---------------------------------------------------------------------------
// Shoulders
// ---------------------------------------------------------------------------

function createShoulders(): {
  leftShoulder: THREE.Group;
  rightShoulder: THREE.Group;
} {
  const leftShoulder = new THREE.Group();
  leftShoulder.name = 'nova-shoulder-left';
  leftShoulder.position.set(-0.5, 0.6, 0);

  // Shoulder pad (~200 tris)
  const shoulderPadGeometry = new THREE.BoxGeometry(0.2, 0.15, 0.2, 2, 2, 2);
  const leftPad = new THREE.Mesh(shoulderPadGeometry);
  leftPad.name = 'shoulder-pad-left';
  leftPad.position.set(-0.05, 0.05, 0);
  leftShoulder.add(leftPad);

  // Epaulette detail (~100 tris)
  const epauletteGeometry = new THREE.ConeGeometry(0.1, 0.08, 4);
  epauletteGeometry.rotateZ(-Math.PI / 4);
  const leftEpaulette = new THREE.Mesh(epauletteGeometry);
  leftEpaulette.name = 'epaulette-left';
  leftEpaulette.position.set(-0.1, 0.1, 0);
  leftShoulder.add(leftEpaulette);

  // Right shoulder (mirror)
  const rightShoulder = new THREE.Group();
  rightShoulder.name = 'nova-shoulder-right';
  rightShoulder.position.set(0.5, 0.6, 0);

  const rightPad = new THREE.Mesh(shoulderPadGeometry.clone());
  rightPad.name = 'shoulder-pad-right';
  rightPad.position.set(0.05, 0.05, 0);
  rightShoulder.add(rightPad);

  const rightEpauletteGeometry = new THREE.ConeGeometry(0.1, 0.08, 4);
  rightEpauletteGeometry.rotateZ(Math.PI / 4); // Mirror
  const rightEpaulette = new THREE.Mesh(rightEpauletteGeometry);
  rightEpaulette.name = 'epaulette-right';
  rightEpaulette.position.set(0.1, 0.1, 0);
  rightShoulder.add(rightEpaulette);

  return { leftShoulder, rightShoulder };
}

// ---------------------------------------------------------------------------
// Chest Emblem
// ---------------------------------------------------------------------------

function createChestEmblem(): THREE.Mesh {
  // Hexagonal emblem with inset depth (~200 tris)
  const emblemShape = new THREE.Shape();
  const radius = 0.08;
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) emblemShape.moveTo(x, y);
    else emblemShape.lineTo(x, y);
  }
  emblemShape.closePath();

  const extrudeSettings = {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
  };
  const emblemGeometry = new THREE.ExtrudeGeometry(emblemShape, extrudeSettings);

  const mesh = new THREE.Mesh(emblemGeometry);
  mesh.name = 'nova-chest-emblem';
  mesh.position.set(0, 0.3, 0.16);
  mesh.rotation.set(0, 0, Math.PI / 12);

  return mesh;
}

// ---------------------------------------------------------------------------
// Belt
// ---------------------------------------------------------------------------

function createBelt(): THREE.Mesh {
  // Geometric belt at waist (where fade begins, ~100 tris)
  const beltGeometry = new THREE.CylinderGeometry(0.32, 0.28, 0.08, 8);
  const mesh = new THREE.Mesh(beltGeometry);
  mesh.name = 'nova-belt';
  mesh.position.set(0, -0.5, 0);
  return mesh;
}

// ---------------------------------------------------------------------------
// Arms and Hands
// ---------------------------------------------------------------------------

function createArm(
  side: 'left' | 'right',
  fingerCount: number
): { upperArm: THREE.Group; forearm: THREE.Group; hand: THREE.Group } {
  const upperArm = new THREE.Group();
  upperArm.name = `nova-upperarm-${side}`;
  upperArm.position.set(0, -0.15, 0);

  // Upper arm mesh (faceted tapered cylinder, ~400 tris)
  const upperArmGeometry = new THREE.CylinderGeometry(0.08, 0.06, 0.4, 12);
  const upperArmMesh = new THREE.Mesh(upperArmGeometry);
  upperArmMesh.name = `upperarm-mesh-${side}`;
  upperArmMesh.position.set(0, -0.2, 0);
  upperArm.add(upperArmMesh);

  const forearm = new THREE.Group();
  forearm.name = `nova-forearm-${side}`;
  forearm.position.set(0, -0.4, 0);

  // Forearm mesh (faceted tapered cylinder, ~400 tris)
  const forearmGeometry = new THREE.CylinderGeometry(0.06, 0.05, 0.35, 12);
  const forearmMesh = new THREE.Mesh(forearmGeometry);
  forearmMesh.name = `forearm-mesh-${side}`;
  forearmMesh.position.set(0, -0.175, 0);
  forearm.add(forearmMesh);

  // Hand with fingers
  const hand = createHand(side, fingerCount);
  hand.position.set(0, -0.35, 0);

  return { upperArm, forearm, hand };
}

function createHand(side: string, fingerCount: number): THREE.Group {
  const hand = new THREE.Group();
  hand.name = `nova-hand-${side}`;

  // Palm (~100 tris)
  const palmGeometry = new THREE.BoxGeometry(0.08, 0.05, 0.12, 2, 1, 2);
  const palm = new THREE.Mesh(palmGeometry);
  palm.name = `palm-${side}`;
  hand.add(palm);

  // Fingers (~100 tris each)
  const fingerWidth = 0.015;
  const fingerSpacing = 0.02;
  const fingerLength = 0.08;

  for (let i = 0; i < fingerCount; i++) {
    const fingerGeometry = new THREE.BoxGeometry(
      fingerWidth,
      fingerWidth,
      fingerLength,
      1,
      1,
      2
    );
    const finger = new THREE.Mesh(fingerGeometry);
    finger.name = `finger-${i}-${side}`;

    // Position fingers across palm width
    const offset = (i - (fingerCount - 1) / 2) * fingerSpacing;
    finger.position.set(offset, 0, 0.06 + fingerLength / 2);

    hand.add(finger);
  }

  return hand;
}
