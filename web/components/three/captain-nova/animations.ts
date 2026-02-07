import type {
  EasingFunction,
  NovaBodyParts,
  AnimationConfig,
  AnimationState,
} from './types';

// ============================================================================
// Easing Functions
// ============================================================================

export const easings: Record<string, EasingFunction> = {
  linear: (t) => t,
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeOut: (t) => t * (2 - t),
  easeIn: (t) => t * t,
  snap: (t) => (t < 0.1 ? 0 : 1), // Instant snap for salute
};

// ============================================================================
// Tween
// ============================================================================

export interface TweenConfig {
  target: any;
  property: string;
  from: number;
  to: number;
  duration: number;
  easing?: EasingFunction;
  onComplete?: () => void;
}

export class Tween {
  private target: any;
  private property: string;
  private from: number;
  private to: number;
  private duration: number;
  private easing: EasingFunction;
  private onComplete?: () => void;
  private elapsed = 0;
  private isComplete = false;

  constructor(config: TweenConfig) {
    this.target = config.target;
    this.property = config.property;
    this.from = config.from;
    this.to = config.to;
    this.duration = config.duration;
    this.easing = config.easing || easings.easeInOut;
    this.onComplete = config.onComplete;
  }

  update(deltaTime: number): boolean {
    if (this.isComplete) return true;

    this.elapsed += deltaTime;
    const t = Math.min(this.elapsed / this.duration, 1);
    const easedT = this.easing(t);
    const value = this.from + (this.to - this.from) * easedT;

    // Handle nested properties (e.g., "rotation.x")
    const keys = this.property.split('.');
    let obj = this.target;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;

    if (t >= 1) {
      this.isComplete = true;
      this.onComplete?.();
      return true;
    }

    return false;
  }

  cancel() {
    this.isComplete = true;
  }
}

// ============================================================================
// Timeline (sequential tweens)
// ============================================================================

export class Timeline {
  private tweens: Tween[] = [];
  private currentIndex = 0;
  private isPlaying = false;

  add(config: TweenConfig): this {
    this.tweens.push(new Tween(config));
    return this;
  }

  play() {
    this.isPlaying = true;
    this.currentIndex = 0;
  }

  update(deltaTime: number) {
    if (!this.isPlaying || this.currentIndex >= this.tweens.length) return;

    const complete = this.tweens[this.currentIndex].update(deltaTime);
    if (complete) {
      this.currentIndex++;
      if (this.currentIndex >= this.tweens.length) {
        this.isPlaying = false;
      }
    }
  }

  stop() {
    this.isPlaying = false;
    this.tweens.forEach((t) => t.cancel());
  }
}

// ============================================================================
// Idle Animation Manager
// ============================================================================

export class NovaIdleAnimations {
  private parts: NovaBodyParts;
  private config: AnimationConfig;
  private state: AnimationState;

  constructor(parts: NovaBodyParts, config: AnimationConfig) {
    this.parts = parts;
    this.config = config;
    this.state = {
      breathingPhase: 0,
      swayPhase: 0,
      weightShiftTimer: 0,
      lastWeightShiftTime: 0,
      headTargetRotation: { x: 0, y: 0 },
      glitchCooldown: 0,
    };
  }

  update(
    deltaTime: number,
    elapsedTime: number,
    mousePosition?: { x: number; y: number }
  ) {
    this.updateBreathing(elapsedTime);
    this.updateSway(elapsedTime);
    this.updateHeadTracking(deltaTime, mousePosition);
  }

  private updateBreathing(time: number) {
    if (!this.config.breathing?.enabled) return;

    const { cycleDuration, scaleAmount } = this.config.breathing;
    const breathingScale =
      1 + Math.sin((time * Math.PI * 2) / cycleDuration) * scaleAmount;

    this.parts.torso.scale.y = breathingScale;
  }

  private updateSway(time: number) {
    if (!this.config.idleSway?.enabled) return;

    const { speed, amount } = this.config.idleSway;
    this.parts.root.rotation.z = Math.sin(time * speed) * amount;
  }

  private updateHeadTracking(
    deltaTime: number,
    mousePosition?: { x: number; y: number }
  ) {
    if (!this.config.headTracking?.enabled) return;

    const { maxRotationY, maxRotationX, lerpSpeed } =
      this.config.headTracking;

    if (mousePosition) {
      this.state.headTargetRotation.y = mousePosition.x * maxRotationY;
      this.state.headTargetRotation.x = -mousePosition.y * maxRotationX;
    }

    // Smooth lerp to target
    this.parts.head.rotation.y +=
      (this.state.headTargetRotation.y - this.parts.head.rotation.y) *
      lerpSpeed;
    this.parts.head.rotation.x +=
      (this.state.headTargetRotation.x - this.parts.head.rotation.x) *
      lerpSpeed;
  }
}
