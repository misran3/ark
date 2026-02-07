import { NovaVariant } from '@/components/ui/NovaVariantDropdown';
import fs from 'fs';
import path from 'path';

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
 * Scans the web/3D folder for .glb files and returns an array of community variants.
 * This runs server-side only (e.g., in getStaticProps or at build time).
 */
export function getCommunityVariants(): NovaVariant[] {
  const publicDir = path.join(process.cwd(), '3D');

  // Check if directory exists
  if (!fs.existsSync(publicDir)) {
    console.warn('3D folder not found at:', publicDir);
    return [];
  }

  const files = fs.readdirSync(publicDir);
  const glbFiles = files.filter((file) => file.toLowerCase().endsWith('.glb'));

  return glbFiles.map((filename) => {
    // Remove .glb extension and format as label
    const label = filename
      .replace(/\.glb$/i, '')
      .replace(/[_-]/g, ' ')
      .trim();

    return {
      type: 'community',
      label,
      path: `/3D/${filename}`,
    };
  });
}

/**
 * Returns all available Nova variants (skeletal + community).
 * Server-side only.
 */
export function getAllNovaVariants(): NovaVariant[] {
  const skeletal: NovaVariant = {
    type: 'skeletal',
    label: 'A: Skeletal-less Hierarchical',
  };

  const community = getCommunityVariants();

  return [skeletal, ...community];
}

/**
 * Client-safe variants list. Use this when variants are passed from server.
 */
export function getDefaultVariant(): NovaVariant {
  return {
    type: 'skeletal',
    label: 'A: Skeletal-less Hierarchical',
  };
}
