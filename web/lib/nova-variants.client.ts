import { NovaVariant } from '@/components/ui/NovaVariantDropdown';

/**
 * Hardcoded variants for client-side use.
 * TODO: Replace with server-side getAllNovaVariants() call when SSR is implemented.
 */
export const HARDCODED_VARIANTS: NovaVariant[] = [
  { type: 'skeletal', label: 'A: Skeletal-less Hierarchical' },
  { type: 'community', label: 'CAUCASIAN MAN', path: '/3D/CAUCASIAN MAN.glb' },
  { type: 'community', label: 'Vinayagar', path: '/3D/Vinayagar.glb' },
  { type: 'community', label: 'https storage googleapis', path: '/3D/https___storage_googleapis_com_ai_services_quality_jobs_xr4enzsf_input_png.glb' },
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
