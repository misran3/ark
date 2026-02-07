/**
 * Viewport bounds defining the glass/scene viewport area.
 * Used by glass layers, HUD, and cockpit frame positioning.
 *
 * These values correspond to the fixed frame widths:
 * - top: 24px (HUD top bar height)
 * - left: 50px (left data strip width)
 * - right: 180px (Captain Nova panel width)
 * - bottom: 220px (console dashboard height)
 */
export const VIEWPORT_BOUNDS = {
  top: '24px',
  left: '50px',
  right: '180px',
  bottom: '220px',
} as const;

/** Numeric values for Tailwind classes and calculations */
export const VIEWPORT_BOUNDS_PX = {
  top: 24,
  left: 50,
  right: 180,
  bottom: 220,
} as const;
