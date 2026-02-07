import { Timeline, easings } from './animations';
import type { NovaBodyParts } from './types';

export type GestureName = 'point' | 'salute' | 'at-ease';

export interface GestureConfig {
  name: GestureName;
  duration: number;
  onComplete?: () => void;
}

export class GestureSystem {
  private parts: NovaBodyParts;
  private currentGesture: Timeline | null = null;
  private isGesturing = false;

  constructor(parts: NovaBodyParts) {
    this.parts = parts;
  }

  playGesture(config: GestureConfig) {
    if (this.isGesturing) {
      this.currentGesture?.stop();
    }

    this.isGesturing = true;

    switch (config.name) {
      case 'point':
        this.currentGesture = this.createPointGesture(config);
        break;
      case 'salute':
        this.currentGesture = this.createSaluteGesture(config);
        break;
      case 'at-ease':
        this.currentGesture = this.createAtEaseGesture(config);
        break;
    }

    this.currentGesture?.play();
  }

  update(deltaTime: number) {
    if (this.currentGesture) {
      this.currentGesture.update(deltaTime);
    }
  }

  private createPointGesture(config: GestureConfig): Timeline {
    const timeline = new Timeline();
    const { rightShoulder, rightUpperArm, rightForearm } = this.parts;

    // Shoulder rotates up
    timeline.add({
      target: rightShoulder.rotation,
      property: 'z',
      from: rightShoulder.rotation.z,
      to: -Math.PI / 6,
      duration: config.duration * 0.3,
      easing: easings.easeOut,
    });

    // Upper arm extends forward
    timeline.add({
      target: rightUpperArm.rotation,
      property: 'x',
      from: rightUpperArm.rotation.x,
      to: Math.PI / 2,
      duration: config.duration * 0.4,
      easing: easings.easeInOut,
    });

    // Forearm extends (straightens elbow)
    timeline.add({
      target: rightForearm.rotation,
      property: 'x',
      from: rightForearm.rotation.x,
      to: 0,
      duration: config.duration * 0.3,
      easing: easings.easeOut,
      onComplete: () => {
        this.isGesturing = false;
        config.onComplete?.();
      },
    });

    return timeline;
  }

  private createSaluteGesture(config: GestureConfig): Timeline {
    const timeline = new Timeline();
    const { rightShoulder, rightUpperArm } = this.parts;

    // Snap hand up to helmet side
    timeline.add({
      target: rightShoulder.rotation,
      property: 'z',
      from: rightShoulder.rotation.z,
      to: -Math.PI / 4,
      duration: config.duration * 0.2,
      easing: easings.snap,
    });

    timeline.add({
      target: rightUpperArm.rotation,
      property: 'x',
      from: rightUpperArm.rotation.x,
      to: Math.PI / 3,
      duration: config.duration * 0.2,
      easing: easings.snap,
    });

    // Hold position
    timeline.add({
      target: rightShoulder.rotation,
      property: 'z',
      from: -Math.PI / 4,
      to: -Math.PI / 4,
      duration: config.duration * 0.4,
    });

    // Return smoothly
    timeline.add({
      target: rightShoulder.rotation,
      property: 'z',
      from: -Math.PI / 4,
      to: 0,
      duration: config.duration * 0.2,
      easing: easings.easeInOut,
    });

    timeline.add({
      target: rightUpperArm.rotation,
      property: 'x',
      from: Math.PI / 3,
      to: 0,
      duration: config.duration * 0.2,
      easing: easings.easeInOut,
      onComplete: () => {
        this.isGesturing = false;
        config.onComplete?.();
      },
    });

    return timeline;
  }

  private createAtEaseGesture(config: GestureConfig): Timeline {
    const timeline = new Timeline();
    const { rightShoulder, rightUpperArm } = this.parts;

    // Return both arms to neutral
    timeline.add({
      target: rightShoulder.rotation,
      property: 'z',
      from: rightShoulder.rotation.z,
      to: 0,
      duration: config.duration,
      easing: easings.easeInOut,
    });

    timeline.add({
      target: rightUpperArm.rotation,
      property: 'x',
      from: rightUpperArm.rotation.x,
      to: 0,
      duration: config.duration,
      easing: easings.easeInOut,
      onComplete: () => {
        this.isGesturing = false;
        config.onComplete?.();
      },
    });

    return timeline;
  }
}
