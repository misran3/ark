'use client';

import { StartScreen } from '@/components/bridge/boot/StartScreen';

export default function TestPage() {
  return <StartScreen onStart={() => console.log('Start clicked')} />;
}
