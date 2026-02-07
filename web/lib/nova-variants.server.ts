import { NovaVariant } from '@/components/ui/NovaVariantDropdown';
import fs from 'fs';
import path from 'path';

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
