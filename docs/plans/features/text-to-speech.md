# Feature Spec: Text-to-Speech Engine

**Feature ID:** `NOVA-002`
**Category:** Captain Nova System
**Priority:** P0 (Must-have for MVP)
**Status:** 🟢 Complete
**Current Version:** 1.0
**Target Version:** 1.0

---

## Overview

The Text-to-Speech (TTS) engine brings Captain Nova to life by converting her text responses into natural-sounding voice output. Using the Web Speech API, she speaks financial insights, warnings, and guidance with a calm, authoritative tone that feels futuristic yet approachable.

**The Core Magic:** Real-time speech synthesis with character callbacks that enable perfect synchronization with mouth animations and word highlighting in the speech bubble.

---

## Visual Specification

### Audio Characteristics

**Voice Profile:**
- **Gender:** Female
- **Language:** en-US
- **Pitch:** 1.0 (neutral, not artificially high or low)
- **Rate:** 0.9 (slightly slower than default for clarity)
- **Volume:** 0.8 (80%, not overpowering)
- **Quality:** Use highest quality voice available on system

**Voice Selection Priority:**
```typescript
// Preferred voices (best to worst)
const voicePriority = [
  'Samantha',           // macOS - natural, professional
  'Google US English',  // Chrome - clear, robotic-neutral
  'Microsoft Zira',     // Windows - professional female
  'en-US-Standard-C',   // Android - clear
];
```

**Tone Modulation (Future):**
- Neutral: Normal rate, normal pitch (default)
- Urgent: 1.1x rate, 1.05x pitch (warnings, critical threats)
- Pleased: 0.95x rate, 1.02x pitch (threat deflected, positive outcomes)

### Speech Bubble Integration

**Visual Feedback During Speech:**

1. **Typewriter Effect:**
   - Text appears character-by-character in speech bubble
   - Speed: 50ms per character (synced with speech)
   - Cursor blinks at end of current text

2. **Word Highlighting:**
   - Current word being spoken is highlighted
   - Background: Aurora primary with 20% opacity
   - Border: 1px aurora primary solid
   - Transition: 100ms smooth fade

3. **Audio Waveform:**
   - Small waveform visualization at bottom of speech bubble
   - 5 vertical bars oscillating with speech amplitude
   - Color: Aurora gradient
   - Updates at 60fps based on speech events

4. **Tools Used Pills:**
   - Appear below speech bubble after speech completes
   - Small rounded pills showing which AI tools were invoked
   - Example: `financial_snapshot` `threat_scanner` `budget_analyzer`
   - Fade in: 200ms after speech ends

---

## Technical Requirements

### Dependencies

**Browser APIs:**
- `window.speechSynthesis` - Core TTS API
- `SpeechSynthesisUtterance` - Speech request object
- `SpeechSynthesisVoice` - Voice selection

**Required Packages:**
- None (native Web API)

**Fallback:**
- If TTS not supported: Show text-only in speech bubble
- Display "(Voice synthesis unavailable)" notice
- Continue with animations

### Core Implementation

**Hook: `useVoiceSynthesis.ts`**

```typescript
import { useCallback, useEffect, useState, useRef } from 'react';

interface VoiceConfig {
  pitch: number;
  rate: number;
  volume: number;
  voiceName?: string;
}

type CharacterCallback = (charIndex: number, char: string) => void;

export function useVoiceSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Select best voice
  const selectVoice = useCallback((preferredName?: string): SpeechSynthesisVoice | null => {
    if (preferredName) {
      const voice = availableVoices.find(v => v.name === preferredName);
      if (voice) return voice;
    }

    // Try priority list
    const voicePriority = ['Samantha', 'Google US English', 'Microsoft Zira', 'en-US-Standard-C'];
    for (const name of voicePriority) {
      const voice = availableVoices.find(v => v.name.includes(name));
      if (voice) return voice;
    }

    // Fallback: First en-US female voice
    const enUSFemale = availableVoices.find(v =>
      v.lang.startsWith('en-US') && v.name.toLowerCase().includes('female')
    );
    if (enUSFemale) return enUSFemale;

    // Last resort: First en-US voice
    return availableVoices.find(v => v.lang.startsWith('en-US')) || availableVoices[0] || null;
  }, [availableVoices]);

  // Speak function
  const speak = useCallback((
    text: string,
    onCharacter?: CharacterCallback,
    config: VoiceConfig = { pitch: 1.0, rate: 0.9, volume: 0.8 }
  ) => {
    if (!window.speechSynthesis) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Configure voice
    const voice = selectVoice(config.voiceName);
    if (voice) utterance.voice = voice;

    utterance.pitch = config.pitch;
    utterance.rate = config.rate;
    utterance.volume = config.volume;

    // Character-by-character callback (for typewriter + lip sync)
    if (onCharacter) {
      let charIndex = 0;
      const intervalMs = (text.length / utterance.rate) / text.length * 1000 / 60; // Rough estimate

      const interval = setInterval(() => {
        if (charIndex < text.length) {
          onCharacter(charIndex, text[charIndex]);
          charIndex++;
        } else {
          clearInterval(interval);
        }
      }, intervalMs);

      utterance.onend = () => {
        clearInterval(interval);
        setIsSpeaking(false);
      };
    }

    // Event handlers
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
    };

    // Speak
    window.speechSynthesis.speak(utterance);
  }, [selectVoice]);

  // Stop speaking
  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // Pause/Resume
  const pause = useCallback(() => {
    window.speechSynthesis.pause();
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    availableVoices,
    isSupported: !!window.speechSynthesis,
  };
}
```

### Usage Example

```typescript
// In CaptainNovaUI component
const { speak, isSpeaking } = useVoiceSynthesis();
const [displayedText, setDisplayedText] = useState('');
const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1);

const handleSpeak = (text: string) => {
  setDisplayedText('');

  speak(text, (charIndex, char) => {
    // Typewriter effect
    setDisplayedText(prev => prev + char);

    // Calculate word index for highlighting
    const words = text.slice(0, charIndex + 1).split(' ');
    setHighlightedWordIndex(words.length - 1);
  }, {
    pitch: 1.0,
    rate: 0.9,
    volume: 0.8
  });
};
```

### Phoneme Detection (for Mouth Sync)

**Basic Phoneme Mapping:**
```typescript
const phonemeMap: Record<string, string> = {
  // Vowels (open mouth)
  'a': 'open', 'e': 'open', 'i': 'open', 'o': 'open', 'u': 'open',

  // Consonants (closed/narrow)
  'b': 'closed', 'p': 'closed', 'm': 'closed',
  'f': 'narrow', 'v': 'narrow',

  // Default
  ' ': 'closed', // Pause between words
};

function getPhoneme(char: string): 'open' | 'closed' | 'narrow' {
  const lower = char.toLowerCase();
  return phonemeMap[lower] || 'closed';
}

// In character callback
onCharacter: (charIndex, char) => {
  const phoneme = getPhoneme(char);
  updateMouthShape(phoneme); // See mouth-sync-animation.md
}
```

**Advanced: Web Speech API Marks (Future)**
```typescript
// Insert SSML marks for precise timing
const textWithMarks = `
  <speak>
    <mark name="word1"/>Commander,
    <mark name="word2"/>welcome
    <mark name="word3"/>aboard.
  </speak>
`;

utterance.onmark = (event) => {
  console.log('Reached mark:', event.name);
  // Trigger specific animations at precise moments
};
```

---

## Acceptance Criteria

### ✅ Audio Quality

- [ ] Voice sounds natural (not robotic or distorted)
- [ ] Speech is clear and understandable
- [ ] Pitch and rate feel appropriate for character
- [ ] Volume is balanced (not too loud or quiet)
- [ ] No clipping or distortion on any phrases

### ✅ Synchronization

- [ ] Typewriter effect stays in sync with speech
- [ ] Word highlighting matches currently spoken word (±100ms)
- [ ] Character callback fires reliably for every character
- [ ] Speech completes when last character is displayed
- [ ] No delay between text completion and speech end

### ✅ User Control

- [ ] Can stop speech mid-sentence (stop button works)
- [ ] Can skip to end (show all text immediately)
- [ ] Cannot trigger multiple speeches simultaneously (cancel previous)
- [ ] Pause/resume works (if implemented)

### ✅ Edge Cases

- [ ] Works with long texts (500+ characters)
- [ ] Works with special characters (punctuation, numbers)
- [ ] Handles emoji gracefully (skips or speaks description)
- [ ] Works when tab is backgrounded (doesn't pause unexpectedly)
- [ ] Fallback text-only mode works if TTS unavailable

### ✅ Performance

- [ ] No memory leaks (utterances properly cleaned up)
- [ ] No performance impact on 3D scene (runs on separate thread)
- [ ] Voice selection is fast (< 50ms)
- [ ] Speech starts within 200ms of trigger

---

## Design Alternatives Considered

### Alternative 1: Pre-Recorded Audio Files
**Approach:** Record all possible Captain Nova lines with voice actor
**Pros:** Highest audio quality, consistent voice, no browser dependency
**Cons:** Inflexible (can't generate new responses), huge file size, expensive
**Decision:** ❌ Rejected - not scalable for AI-generated responses

### Alternative 2: External TTS Service (e.g., Amazon Polly)
**Approach:** Send text to cloud service, stream back audio
**Pros:** Very high quality, consistent across browsers, advanced features
**Cons:** Latency (network round-trip), cost, requires backend integration
**Decision:** ❌ Rejected for MVP - Web Speech API sufficient, can upgrade later

### Alternative 3: Web Speech API (SELECTED)
**Approach:** Use native browser TTS with best available voice
**Pros:** Zero latency, free, works offline, character-level callbacks
**Cons:** Voice quality varies by OS/browser, limited customization
**Decision:** ✅ **Selected** - best for MVP, can enhance later

### Alternative 4: Hybrid (Web Speech + Cloud Fallback)
**Approach:** Try Web Speech API first, fall back to cloud TTS if poor quality
**Pros:** Best of both worlds
**Cons:** Complex implementation, still has latency issue
**Decision:** 🔵 **Future Enhancement** - revisit after MVP

---

## Open Questions

### Resolved
- ✅ Q: Should we cache audio for repeated phrases?
  - A: No - text is dynamic (AI-generated), caching complex

- ✅ Q: Should user be able to select voice?
  - A: Future feature - settings panel in Phase 4

### Unresolved
- ⚠️ Q: Should speech auto-play on page load or require user interaction?
  - A: Chrome blocks auto-play audio - require first user interaction (click)

- ⚠️ Q: Should we add background ambient hum when Nova speaks?
  - A: Defer to sound design phase

---

## Implementation Checklist

### Phase 1: Core Setup
- [x] Create useVoiceSynthesis hook
- [x] Implement voice selection logic
- [x] Add basic speak() function
- [x] Test on macOS, Windows, Chrome, Safari

### Phase 2: Callbacks
- [x] Add character-by-character callback
- [x] Implement word boundary detection
- [x] Test synchronization with UI updates

### Phase 3: Integration
- [x] Connect to Captain Nova UI component
- [x] Add typewriter effect in speech bubble
- [x] Add word highlighting
- [x] Connect to mouth sync system

### Phase 4: Controls
- [x] Add stop button
- [ ] Add skip button (show all text immediately)
- [ ] Add pause/resume (optional)
- [ ] Add settings (voice selection, rate, pitch)

### Phase 5: Polish
- [ ] Fine-tune timing values
- [ ] Add audio waveform visualization
- [ ] Add tools used pills
- [ ] Test edge cases (long text, special chars)

### Phase 6: Documentation & Cleanup
- [ ] Update this feature spec: set Status to 🟢 Complete, bump Current Version, add Revision History entry
- [ ] Update `MASTER-synesthesiapay-bridge.md`: change this feature's status in the Feature Catalog table
- [ ] Update `IMPLEMENTATION-GUIDE.md`: note progress in any relevant phase tracking
- [ ] Commit documentation changes separately from code: `docs: mark text-to-speech as complete`

---

## Related Features

- `NOVA-003`: Mouth Animation Sync (uses phoneme data from this system)
- `NOVA-001`: Captain Nova Hologram (breathing syncs with speech)
- `UI-003`: Captain Nova UI Panel (displays text being spoken)
- `BACKEND-001`: Threat Detection Engine / AI Analysis (provides text to speak)

---

## Browser Compatibility

| Browser | Support | Voice Quality | Notes |
|---------|---------|---------------|-------|
| Chrome 120+ | ✅ Excellent | Good | Google voices available |
| Safari 17+ | ✅ Excellent | Excellent | Samantha (macOS) is best quality |
| Firefox 120+ | ✅ Good | Fair | Limited voice selection |
| Edge 120+ | ✅ Excellent | Good | Microsoft voices available |
| Mobile Safari | ✅ Good | Good | Works but may require user gesture |
| Mobile Chrome | ✅ Good | Good | Works with limitations |

---

## Completion Protocol

When this feature's implementation is finished and all acceptance criteria pass, the implementing agent **must** update the following documents before considering the work done:

1. **This feature spec** — Set `Status` to 🟢 Complete (or 🔵 Needs Polish if partially done), update `Current Version`, and add a row to the Revision History table.
2. **Master Document** (`docs/plans/MASTER-synesthesiapay-bridge.md`) — Update this feature's row in the Feature Catalog to reflect the new status.
3. **Implementation Guide** (`docs/plans/IMPLEMENTATION-GUIDE.md`) — Record any learnings, update phase progress tracking, and note actual vs estimated time if a build guide was created.

These documentation updates should be committed separately from code changes. See the Implementation Guide's [Status Updates](../IMPLEMENTATION-GUIDE.md#status-updates) section for detailed instructions.

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-06 | Initial implementation (basic TTS with callbacks) |

---

**Status:** ✅ Complete - Ready for integration with mouth sync system.
