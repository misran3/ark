'use client';

import { NovaVariantDropdown } from '@/components/ui/NovaVariantDropdown';
import { useNovaVariant } from '@/contexts/NovaVariantContext';

export function NovaVariantSelector() {
  const { activeVariant, setActiveVariant, availableVariants } = useNovaVariant();

  return (
    <div className="space-y-1">
      <div className="font-orbitron text-xs text-cyan-400/60 tracking-wider">
        NOVA VARIANT
      </div>
      <NovaVariantDropdown
        value={activeVariant}
        onChange={setActiveVariant}
        variants={availableVariants}
        className="w-full"
        dropUp
      />
      <div className="font-rajdhani text-xs text-cyan-400/40 mt-1">
        {activeVariant.type === 'skeletal' ? 'Built-in system' : 'Community model'}
      </div>
    </div>
  );
}
