'use client';

import { useCallback, useEffect, useState } from 'react';

export function useVoiceSynthesis() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    setIsSupported('speechSynthesis' in window);

    if ('speechSynthesis' in window) {
      // Load voices
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

  const speak = useCallback(
    (text: string, onBoundary?: (charIndex: number, char: string) => void) => {
      if (!isSupported) {
        console.warn('Speech synthesis not supported');
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Try to find a good female voice
      const femaleVoice = voices.find(
        (v) =>
          v.name.toLowerCase().includes('female') ||
          v.name.includes('Samantha') ||
          v.name.includes('Victoria') ||
          v.name.includes('Karen') ||
          v.name.includes('Moira') ||
          v.name.includes('Fiona')
      );

      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      // Configure for Captain Nova's voice
      utterance.rate = 0.95; // Slightly slower for authority
      utterance.pitch = 0.9; // Slightly lower for command presence
      utterance.volume = 1.0;

      // Events
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      if (onBoundary) {
        utterance.onboundary = (event) => {
          const char = text[event.charIndex] || '';
          onBoundary(event.charIndex, char);
        };
      }

      window.speechSynthesis.speak(utterance);

      return () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      };
    },
    [isSupported, voices]
  );

  const cancel = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { speak, cancel, isSpeaking, isSupported };
}
