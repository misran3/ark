import { NovaVariant } from '@/components/ui/NovaVariantDropdown';

/**
 * Hardcoded variants for client-side use.
 * TODO: Replace with server-side getAllNovaVariants() call when SSR is implemented.
 */
export const HARDCODED_VARIANTS: NovaVariant[] = [
  { type: 'skeletal', label: 'A: Skeletal-less Hierarchical' },
  { type: 'community', label: 'CAUCASIAN MAN', path: '/models/caucasian-man.glb' },
  { type: 'community', label: 'Vinayagar', path: '/models/vinayagar.glb' },
  { type: 'community', label: 'THE POPE', path: '/models/googleapis-model.glb' },
  { type: 'community', label: 'Stacy', path: '/models/stacy.glb', yOffset: -0.6, zOffset: -2 },
];

/**
 * Client-safe default variant.
 */
export function getDefaultVariant(): NovaVariant {
  return {
    type: 'skeletal',
    label: 'A: Skeletal-less Hierarchical',
  };
}
