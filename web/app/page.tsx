'use client';

import { BootSequence } from '@/components/bridge/BootSequence';
import { BridgeLayout } from '@/components/bridge/BridgeLayout';
import { DesktopOnlyBanner } from '@/components/bridge/DesktopOnlyBanner';
import { useAlertSync } from '@/hooks/useAlertSync';
import { useHologramDismiss } from '@/hooks/useHologramDismiss';

export default function BridgePage() {
  useAlertSync();
  useHologramDismiss();

  return (
    <>
      <DesktopOnlyBanner />
      <BootSequence>
        <BridgeLayout />
      </BootSequence>
    </>
  );
}
