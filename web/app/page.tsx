'use client';

import { BootSequence } from '@/components/bridge/BootSequence';
import { BridgeLayout } from '@/components/bridge/BridgeLayout';
import { DesktopOnlyBanner } from '@/components/bridge/DesktopOnlyBanner';
import { ShieldsPopup } from '@/components/bridge/console/panels/ShieldsPopup';
import { NetWorthPopup } from '@/components/bridge/console/panels/NetWorthPopup';
import { TransactionsPopup } from '@/components/bridge/console/panels/TransactionsPopup';
import { CardsPopup } from '@/components/bridge/console/panels/CardsPopup';
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

      {/* Panel popups */}
      <ShieldsPopup />
      <NetWorthPopup />
      <TransactionsPopup />
      <CardsPopup />
    </>
  );
}
