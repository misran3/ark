import { Color } from 'three';
import { SYSTEM_HUES, type PanelType } from '@/lib/stores/console-store';

const _colorA = new Color();
const _colorB = new Color();
const _result = new Color();

/**
 * Get the interpolated system color based on health (0-1).
 * health=1 → healthy hue, health=0 → distress hue.
 * Returns a THREE.Color (mutates internal cache — clone if storing).
 */
export function getSystemColor(panel: PanelType, health: number): Color {
  const hues = SYSTEM_HUES[panel];
  _colorA.setRGB(hues.healthy[0] / 255, hues.healthy[1] / 255, hues.healthy[2] / 255);
  _colorB.setRGB(hues.distress[0] / 255, hues.distress[1] / 255, hues.distress[2] / 255);
  _result.copy(_colorA).lerp(_colorB, 1 - health);
  return _result;
}

/**
 * Get CSS color string for Html overlays.
 */
export function getSystemCSSColor(panel: PanelType, health: number): string {
  const color = getSystemColor(panel, health);
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Get CSS rgba with alpha for glows/backgrounds.
 */
export function getSystemCSSGlow(panel: PanelType, health: number, alpha: number): string {
  const color = getSystemColor(panel, health);
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
