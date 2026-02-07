'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { NovaVariant } from '@/components/ui/NovaVariantDropdown';

interface NovaVariantContextValue {
  activeVariant: NovaVariant;
  setActiveVariant: (variant: NovaVariant) => void;
  availableVariants: NovaVariant[];
}

const NovaVariantContext = createContext<NovaVariantContextValue | undefined>(undefined);

export interface NovaVariantProviderProps {
  children: ReactNode;
  /** Initial variants list (from server) */
  variants: NovaVariant[];
  /** Initial active variant */
  initialVariant?: NovaVariant;
}

export function NovaVariantProvider({
  children,
  variants,
  initialVariant,
}: NovaVariantProviderProps) {
  const [activeVariant, setActiveVariant] = useState<NovaVariant>(
    initialVariant || variants[0]
  );

  return (
    <NovaVariantContext.Provider
      value={{
        activeVariant,
        setActiveVariant,
        availableVariants: variants,
      }}
    >
      {children}
    </NovaVariantContext.Provider>
  );
}

export function useNovaVariant() {
  const ctx = useContext(NovaVariantContext);
  if (!ctx) {
    throw new Error('useNovaVariant must be used within NovaVariantProvider');
  }
  return ctx;
}
