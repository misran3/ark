'use client';

import { BootSequence } from '@/components/bridge/BootSequence';
import { BridgeLayout } from '@/components/bridge/BridgeLayout';
import { DesktopOnlyBanner } from '@/components/bridge/DesktopOnlyBanner';
import { ShieldsPopup } from '@/components/bridge/console/panels/ShieldsPopup';
import { NetWorthPopup } from '@/components/bridge/console/panels/NetWorthPopup';
import { TransactionsPopup } from '@/components/bridge/console/panels/TransactionsPopup';
import { CardsPopup } from '@/components/bridge/console/panels/CardsPopup';

export default function BridgePage() {
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
