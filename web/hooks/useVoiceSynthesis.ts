'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { VoiceProfile } from '@/lib/voice-profiles';

/** Split text into sentence-sized chunks for natural pacing */
function chunkText(text: string): string[] {
  // Split on sentence-ending punctuation followed by whitespace
  const raw = text.match(/[^.!?]+[.!?]+[\s]*/g);
  if (!raw) return [text];

  // Merge very short chunks (< 20 chars) with their predecessor
  const merged: string[] = [];
  for (const chunk of raw) {
    const trimmed = chunk.trim();
    if (merged.length > 0 && trimmed.length < 20) {
      merged[merged.length - 1] += ' ' + trimmed;
    } else {
      merged.push(trimmed);
    }
  }
  return merged.length > 0 ? merged : [text];
}

/** Preprocess text for more natural speech cadence */
function preprocessText(text: string): string {
  let result = text;

  // Expand common abbreviations
  result = result.replace(/\bCpt\./g, 'Captain');
  result = result.replace(/\bDr\./g, 'Doctor');
  result = result.replace(/\bvs\./g, 'versus');
  result = result.replace(/\betc\./g, 'etcetera');
  result = result.replace(/\be\.g\./g, 'for example');
  result = result.replace(/\bi\.e\./g, 'that is');

  // Format dollar amounts for speech: $1,234.56 → "1,234 dollars and 56 cents"
  result = result.replace(/\$(\d[\d,]*\.\d{2})/g, (_match, amount: string) => {
    const [dollars, cents] = amount.split('.');
    if (cents === '00') return `${dollars} dollars`;
    return `${dollars} dollars and ${cents} cents`;
  });
  result = result.replace(/\$(\d[\d,]*)/g, '$1 dollars');

  // Format percentages for clarity
  result = result.replace(/(\d+)%/g, '$1 percent');

  // Add micro-pauses at commas and semicolons (extra space helps synthesis breathe)
  result = result.replace(/,\s*/g, ', ');
  result = result.replace(/;\s*/g, '; ');

  // Add pause before dash-separated clauses
  result = result.replace(/\s—\s/g, ', ');
  result = result.replace(/\s–\s/g, ', ');
  result = result.replace(/\s-\s/g, ', ');

  return result;
}

/** Find the best matching voice from a ranked preference list */
function findBestVoice(
  voices: SpeechSynthesisVoice[],
  preferredVoices: string[],
): SpeechSynthesisVoice | null {
  for (const preferred of preferredVoices) {
    const match = voices.find((v) =>
      v.name.toLowerCase().includes(preferred.toLowerCase()),
    );
    if (match) return match;
  }
  return null;
}

const CHUNK_PAUSE_MS = 250; // micro-pause between sentence chunks

export function useVoiceSynthesis() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const chunkQueueRef = useRef<string[]>([]);
  const cancelledRef = useRef(false);
  const profileRef = useRef<VoiceProfile | null>(null);
  const boundaryCallbackRef = useRef<((charIndex: number, char: string) => void) | null>(null);
  const charOffsetRef = useRef(0);

  // Stable ref for voices — allows speakChunk to always use latest voices
  // without recreating the callback chain
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  voicesRef.current = voices;

  const isSupportedRef = useRef(false);

  useEffect(() => {
    const supported = 'speechSynthesis' in window;
    setIsSupported(supported);
    isSupportedRef.current = supported;

    if (supported) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
      };

      loadVoices();
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    }
  }, []);

  /** Speak a single chunk, resolve when done */
  const speakChunk = useCallback(
    (text: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(text);
        const profile = profileRef.current;

        if (profile) {
          const voice = findBestVoice(voicesRef.current, profile.preferredVoices);
          if (voice) utterance.voice = voice;
          utterance.pitch = profile.pitch;
          utterance.rate = profile.rate;
          utterance.volume = profile.volume;
        }

        utterance.onend = () => resolve();
        utterance.onerror = (e) => {
          if (e.error === 'canceled') resolve();
          else reject(e);
        };

        if (boundaryCallbackRef.current) {
          const offset = charOffsetRef.current;
          utterance.onboundary = (event) => {
            const globalIndex = offset + event.charIndex;
            const char = text[event.charIndex] || '';
            boundaryCallbackRef.current?.(globalIndex, char);
          };
        }

        window.speechSynthesis.speak(utterance);
        charOffsetRef.current += text.length + 1;
      });
    },
    [], // stable — reads voices from ref
  );

  /** Process the chunk queue sequentially with pauses */
  const processQueue = useCallback(async () => {
    setIsSpeaking(true);
    cancelledRef.current = false;

    while (chunkQueueRef.current.length > 0 && !cancelledRef.current) {
      const chunk = chunkQueueRef.current.shift()!;
      try {
        await speakChunk(chunk);
      } catch {
        break;
      }

      // Micro-pause between chunks for natural breathing
      if (chunkQueueRef.current.length > 0 && !cancelledRef.current) {
        await new Promise((r) => setTimeout(r, CHUNK_PAUSE_MS));
      }
    }

    setIsSpeaking(false);
  }, [speakChunk]);

  const speak = useCallback(
    (
      text: string,
      profile?: VoiceProfile,
      onBoundary?: (charIndex: number, char: string) => void,
    ) => {
      if (!isSupportedRef.current) {
        console.warn('Speech synthesis not supported');
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      cancelledRef.current = true;
      chunkQueueRef.current = [];

      // Store profile and callback for chunk processing
      profileRef.current = profile ?? null;
      boundaryCallbackRef.current = onBoundary ?? null;
      charOffsetRef.current = 0;

      // Preprocess and chunk the text
      const processed = preprocessText(text);
      const chunks = chunkText(processed);
      chunkQueueRef.current = chunks;

      // Start processing
      processQueue();

      return () => {
        cancelledRef.current = true;
        chunkQueueRef.current = [];
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      };
    },
    [processQueue],
  );

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    chunkQueueRef.current = [];
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { speak, cancel, isSpeaking, isSupported, voices };
}
