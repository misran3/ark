# Feature Spec: Mouth Animation Sync

**Feature ID:** `NOVA-003`
**Category:** Captain Nova System
**Priority:** P0 (Must-have for MVP)
**Status:** 🟡 In Progress
**Current Version:** 0.3 (Basic lip sync exists)
**Target Version:** 1.0

---

## Overview

Mouth animation sync creates the illusion that Captain Nova is actually speaking by animating her jaw and mouth shape in time with the text-to-speech output. Using phoneme-based shape morphing, her mouth opens for vowels, closes for consonants, and creates the subtle movements that make her feel alive.

**The Core Magic:** Real-time morph target blending driven by character callbacks from the TTS engine, creating believable lip sync without complex audio analysis.

---

## Visual Specification

### Mouth Shapes (Visemes)

**Primary Mouth Shapes:**

1. **Closed** (default/rest)
   - Lips together, relaxed
   - Used for: silence, pauses, consonants (b, p, m)
   - Morph target: `mouth_closed` (weight: 1.0)

2. **Open** (vowels)
   - Jaw drops, mouth opens
   - Used for: a, e, i, o, u
   - Morph target: `mouth_open` (weight: 0.7-1.0 depending on vowel)
   - Variants:
     - Wide open: "ah" sounds (weight: 1.0)
     - Medium: "eh" sounds (weight: 0.7)
     - Narrow: "ee" sounds (weight: 0.5)

3. **Narrow** (f/v sounds)
   - Top teeth touch bottom lip
   - Used for: f, v
   - Morph target: `mouth_narrow` (weight: 0.8)

4. **Rounded** (o/u sounds)
   - Lips form O shape
   - Used for: o, oo, w
   - Morph target: `mouth_rounded` (weight: 0.9)

5. **Smile** (ee/i sounds)
   - Lips stretched sideways
   - Used for: ee, i
   - Morph target: `mouth_smile` (weight: 0.6)

### Animation Timing

**Transition Speeds:**
```
Closed → Open:  80ms (quick snap)
Open → Closed:  100ms (slight overshoot, natural)
Open → Open:    60ms (vowel to vowel)
Closed → Closed: 40ms (consonant to consonant)
```

**Easing:**
- Use `cubic-bezier(0.4, 0, 0.2, 1)` for natural motion
- Add slight overshoot on consonants (1.05x target weight, settle back)

**Idle State:**
- When not speaking: Mouth slowly oscillates between closed and slightly open
- Breathing sync: Mouth opens 10% on inhale, closes on exhale
- Frequency: Matches breathing cycle (4s)

---

## Technical Requirements

### Dependencies

**Required Packages:**
- `@react-three/fiber` (^9.5.0) - React Three.js integration
- `@react-three/drei` (^10.7.7) - useGLTF, useAnimations

**Required Assets:**
- Captain Nova model must have morph targets:
  - `mouth_closed`
  - `mouth_open`
  - `mouth_narrow`
  - `mouth_rounded`
  - `mouth_smile`

**Fallback:**
- If morph targets missing: Animate jaw bone rotation only (simple open/close)

### Core Implementation

**Hook: `useMouthSync.ts`**

```typescript
import { useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type MouthShape = 'closed' | 'open' | 'narrow' | 'rounded' | 'smile';

interface MorphTargets {
  mouth_closed: number;
  mouth_open: number;
  mouth_narrow: number;
  mouth_rounded: number;
  mouth_smile: number;
}

export function useMouthSync(meshRef: React.RefObject<THREE.SkinnedMesh>) {
  const targetWeightsRef = useRef<MorphTargets>({
    mouth_closed: 1.0,
    mouth_open: 0.0,
    mouth_narrow: 0.0,
    mouth_rounded: 0.0,
    mouth_smile: 0.0,
  });

  const currentWeightsRef = useRef<MorphTargets>({ ...targetWeightsRef.current });

  // Phoneme to mouth shape mapping
  const phonemeMap: Record<string, MouthShape> = {
    // Vowels
    'a': 'open',
    'e': 'smile',
    'i': 'smile',
    'o': 'rounded',
    'u': 'rounded',

    // Consonants
    'b': 'closed',
    'p': 'closed',
    'm': 'closed',
    'f': 'narrow',
    'v': 'narrow',
    'w': 'rounded',

    // Default
    ' ': 'closed', // Space = pause
  };

  // Set mouth shape based on character
  const setMouthShape = useCallback((char: string) => {
    const phoneme = phonemeMap[char.toLowerCase()] || 'closed';

    // Reset all to 0
    const newTargets: MorphTargets = {
      mouth_closed: 0,
      mouth_open: 0,
      mouth_narrow: 0,
      mouth_rounded: 0,
      mouth_smile: 0,
    };

    // Set active shape
    switch (phoneme) {
      case 'open':
        newTargets.mouth_open = 1.0;
        break;
      case 'narrow':
        newTargets.mouth_narrow = 0.8;
        break;
      case 'rounded':
        newTargets.mouth_rounded = 0.9;
        break;
      case 'smile':
        newTargets.mouth_smile = 0.6;
        break;
      case 'closed':
      default:
        newTargets.mouth_closed = 1.0;
        break;
    }

    targetWeightsRef.current = newTargets;
  }, []);

  // Smooth interpolation in animation loop
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const morphTargetInfluences = meshRef.current.morphTargetInfluences;
    const morphTargetDictionary = meshRef.current.morphTargetDictionary;

    if (!morphTargetInfluences || !morphTargetDictionary) return;

    // Interpolate current weights toward target weights
    const lerpFactor = 10 * delta; // Speed of transition

    Object.keys(targetWeightsRef.current).forEach((key) => {
      const targetKey = key as keyof MorphTargets;
      const targetWeight = targetWeightsRef.current[targetKey];
      const currentWeight = currentWeightsRef.current[targetKey];

      const newWeight = THREE.MathUtils.lerp(currentWeight, targetWeight, lerpFactor);
      currentWeightsRef.current[targetKey] = newWeight;

      // Apply to mesh
      const morphIndex = morphTargetDictionary[key];
      if (morphIndex !== undefined) {
        morphTargetInfluences[morphIndex] = newWeight;
      }
    });
  });

  // Reset to closed (idle state)
  const resetMouth = useCallback(() => {
    targetWeightsRef.current = {
      mouth_closed: 1.0,
      mouth_open: 0.0,
      mouth_narrow: 0.0,
      mouth_rounded: 0.0,
      mouth_smile: 0.0,
    };
  }, []);

  return {
    setMouthShape,
    resetMouth,
  };
}
```

### Integration with TTS

**In CaptainNova Component:**

```typescript
const meshRef = useRef<THREE.SkinnedMesh>(null);
const { setMouthShape, resetMouth } = useMouthSync(meshRef);
const { speak } = useVoiceSynthesis();

const handleSpeak = (text: string) => {
  speak(text, (charIndex, char) => {
    // Update mouth shape for each character
    setMouthShape(char);
  });

  // Reset mouth when speech ends
  setTimeout(() => {
    resetMouth();
  }, calculateSpeechDuration(text));
};

// In JSX
<skinnedMesh ref={meshRef} ... />
```

### Advanced: Audio-Driven Sync (Future)

**Using Web Audio API for Amplitude Analysis:**

```typescript
// Analyze audio output to drive mouth opening amount
const analyzeAudio = (audioContext: AudioContext, source: MediaStreamAudioSourceNode) => {
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);

  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  const update = () => {
    analyser.getByteFrequencyData(dataArray);

    // Calculate average amplitude
    const average = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
    const normalized = average / 255; // 0-1

    // Drive mouth opening based on volume
    setMouthOpenAmount(normalized * 0.8); // 0-80% open

    requestAnimationFrame(update);
  };

  update();
};
```

**Benefits:**
- Perfect sync with actual audio output
- Natural variation in mouth opening (louder = more open)

**Drawbacks:**
- Complex setup (requires audio routing)
- Browser compatibility issues
- **Defer to Phase 2**

---

## Acceptance Criteria

### ✅ Visual Quality

- [ ] Mouth movements look natural (not robotic)
- [ ] Transitions between shapes are smooth (no popping)
- [ ] Mouth shape matches phoneme being spoken (±50ms acceptable)
- [ ] Idle mouth breathing is subtle and organic
- [ ] No weird distortion of face mesh during morphing

### ✅ Synchronization

- [ ] Mouth opens when vowels are spoken
- [ ] Mouth closes when consonants are spoken
- [ ] Pauses between words show closed mouth briefly
- [ ] Speech end returns mouth to neutral closed state
- [ ] Sync works for fast speech (1.2x rate) and slow (0.8x rate)

### ✅ Performance

- [ ] Morph target updates run at 60fps
- [ ] No frame drops during rapid phoneme changes
- [ ] Smooth interpolation (no jittery movement)
- [ ] Works with hologram shader active (no conflicts)

### ✅ Edge Cases

- [ ] Works with punctuation (mouth closes briefly)
- [ ] Works with numbers ("one thousand" = phonemes)
- [ ] Handles silence gracefully (returns to idle)
- [ ] Works if model has different morph target names (fallback to jaw rotation)
- [ ] Doesn't break if character callback fires too fast

---

## Design Alternatives Considered

### Alternative 1: Pre-Baked Animation (Audio to Animation File)
**Approach:** Generate animation curve offline, play back in sync with audio
**Pros:** Perfect sync, professional quality
**Cons:** Can't work with real-time TTS, requires preprocessing
**Decision:** ❌ Rejected - not compatible with dynamic AI responses

### Alternative 2: Simple Jaw Rotation
**Approach:** Just rotate jaw bone up/down based on vowel/consonant
**Pros:** Simple, works with any model (no morph targets needed)
**Cons:** Looks basic, not believable
**Decision:** 🔵 **Fallback** - use if morph targets unavailable

### Alternative 3: Phoneme-Based Morph Targets (SELECTED)
**Approach:** Map characters to mouth shapes, blend morph targets
**Pros:** Good quality, real-time compatible, believable
**Cons:** Requires model with morph targets
**Decision:** ✅ **Selected** - best balance for our use case

### Alternative 4: ML-Based Phoneme Detection
**Approach:** Use machine learning to detect phonemes from audio output
**Pros:** Most accurate, handles any voice/language
**Cons:** Heavy computation, complex integration, latency
**Decision:** ❌ Rejected for MVP - overkill

---

## Open Questions

### Resolved
- ✅ Q: Should mouth movements exaggerate for clarity?
  - A: Slight exaggeration (1.1x) is good - she's a hologram, can be slightly stylized

- ✅ Q: Should we add tongue movement?
  - A: No - not visible in hologram aesthetic, adds complexity

### Unresolved
- ⚠️ Q: Should mouth movements be visible when she's "thinking" (before speaking)?
  - A: Interesting idea - subtle mouth movement could indicate processing

- ⚠️ Q: Should we add emotional expressions (smile when pleased)?
  - A: Defer to emotion states feature (NOVA-008)

---

## Implementation Checklist

### Phase 1: Model Setup
- [ ] Verify Captain Nova model has morph targets
- [ ] Test morph targets in Blender (confirm they work)
- [ ] Export with correct naming convention
- [ ] Load model and access morph target dictionary

### Phase 2: Core Sync
- [x] Create useMouthSync hook
- [x] Implement phoneme mapping
- [x] Add smooth interpolation (lerp)
- [x] Test with basic TTS

### Phase 3: Refinement
- [ ] Tune transition speeds (test various values)
- [ ] Add overshoot to consonants (natural effect)
- [ ] Implement idle breathing sync
- [ ] Fine-tune morph target weights (some shapes may need adjustment)

### Phase 4: Integration
- [ ] Connect to TTS character callback
- [ ] Test with long speeches (500+ chars)
- [ ] Test with rapid speech (1.2x rate)
- [ ] Test with slow speech (0.8x rate)

### Phase 5: Fallback
- [ ] Implement jaw rotation fallback (if morph targets missing)
- [ ] Detect morph target availability at runtime
- [ ] Graceful degradation path

### Phase 6: Polish
- [ ] Record video of sync quality
- [ ] Compare to reference (AAA game lip sync)
- [ ] Adjust timing values based on feedback
- [ ] Test across different voices/browsers

---

## Related Features

- `NOVA-002`: Text-to-Speech Engine (provides character callbacks)
- `NOVA-001`: Captain Nova Hologram (mesh with morph targets)
- `NOVA-004`: Eye Tracking System (eyes + mouth = full facial animation)
- `NOVA-008`: Emotion States (could modulate mouth resting position)

---

## Model Requirements

**Morph Target Specifications:**

```
mouth_closed:
  - Lips together, relaxed
  - Jaw in neutral position
  - Neutral expression

mouth_open:
  - Jaw drops ~30 degrees
  - Lips part vertically
  - Teeth visible

mouth_narrow:
  - Top teeth touch bottom lip
  - Jaw slightly closed
  - F/V articulation

mouth_rounded:
  - Lips form O/U shape
  - Jaw slightly open
  - Lips protrude slightly forward

mouth_smile:
  - Lips stretch horizontally
  - Corners of mouth raised
  - Teeth visible (optional)
```

**Morph Target Weights:**
- All weights should range 0.0 (no influence) to 1.0 (full influence)
- Multiple targets can be active simultaneously (blend)
- Sum of weights doesn't need to equal 1.0

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 0.3 | 2026-02-06 | Initial implementation (basic phoneme sync) |
| 1.0 | TBD | Full spec implementation with polished timing |

---

**Status:** Ready for model verification and timing refinement.
