import type { NovaVariant } from '@/components/ui/NovaVariantDropdown';

export interface VoiceProfile {
  /** Ranked preference list — first available match wins */
  preferredVoices: string[];
  /** 0.1–2.0 (1.0 = normal) */
  pitch: number;
  /** 0.1–2.0 (1.0 = normal) */
  rate: number;
  /** 0–1.0 */
  volume: number;
}

/**
 * Voice profiles keyed by variant label.
 * Each Nova variant gets a distinct vocal identity.
 */
const VOICE_PROFILES: Record<string, VoiceProfile> = {
  // Built-in skeletal Nova — authoritative female starship captain
  'A: Skeletal-less Hierarchical': {
    preferredVoices: ['Samantha', 'Victoria', 'Google US English', 'Microsoft Zira'],
    pitch: 0.9,
    rate: 0.95,
    volume: 1.0,
  },

  // Caucasian Man — standard male voice
  'CAUCASIAN MAN': {
    preferredVoices: ['Daniel', 'Google UK English Male', 'Microsoft David', 'Alex'],
    pitch: 0.85,
    rate: 1.0,
    volume: 1.0,
  },

  // Vinayagar — silly, funny, playful
  'Vinayagar': {
    preferredVoices: ['Fred', 'Trinoids', 'Zarvox', 'Google US English'],
    pitch: 1.4,
    rate: 1.15,
    volume: 1.0,
  },

  // THE POPE — regal, solemn, authoritative
  'THE POPE': {
    preferredVoices: ['Daniel', 'Thomas', 'Google UK English Male', 'Microsoft Mark'],
    pitch: 0.7,
    rate: 0.85,
    volume: 1.0,
  },
};

/** Neutral fallback for variants without a custom profile */
const DEFAULT_PROFILE: VoiceProfile = {
  preferredVoices: ['Samantha', 'Google US English', 'Microsoft Zira'],
  pitch: 1.0,
  rate: 1.0,
  volume: 1.0,
};

/**
 * Resolve the voice profile for the active Nova variant.
 * Matches on variant label; falls back to DEFAULT_PROFILE.
 */
export function getVoiceProfileForVariant(variant: NovaVariant): VoiceProfile {
  return VOICE_PROFILES[variant.label] ?? DEFAULT_PROFILE;
}
