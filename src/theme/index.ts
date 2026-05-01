/**
 * Theme Module
 *
 * Provides dynamic theme colors that respond to dark mode toggle.
 * Default is light theme - dark mode only activates when user explicitly enables it.
 */

import {
  animations,
  borderRadius as premiumBorderRadius,
  colors as premiumColors,
  components,
  darkColors,
  designSystem,
  layout,
  shadows as premiumShadows,
  spacing as premiumSpacing,
  typography as premiumTypography,
} from './designSystem';
import { borderRadius } from './borderRadius';
import { colors as staticColors } from './colors';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { typography } from './typography';

const light = staticColors.light;
const dark = staticColors.dark;

let globalIsDark = false;

export function setGlobalTheme(isDark: boolean) {
  globalIsDark = isDark;
}

function getActiveColors() {
  return globalIsDark ? dark : light;
}

const activeLight = {
  get background() { return getActiveColors().background; },
  get surface() { return getActiveColors().surface; },
  get card() { return getActiveColors().card; },
  get text() { return getActiveColors().text; },
  get textSecondary() { return getActiveColors().textSecondary; },
  get border() { return getActiveColors().border; },
};

const colors = {
  get primary() { return staticColors.primary; },
  get accent() { return staticColors.accent; },
  get neutral() { return staticColors.neutral; },
  get secondary() { return staticColors.secondary; },
  get success() { return staticColors.success; },
  get warning() { return staticColors.warning; },
  get error() { return staticColors.error; },
  get info() { return staticColors.info; },
  get critical() { return staticColors.critical; },
  get background() { return getActiveColors().background; },
  get surface() { return getActiveColors().surface; },
  get card() { return getActiveColors().card; },
  get text() { return getActiveColors().text; },
  get textSecondary() { return getActiveColors().textSecondary; },
  get border() { return getActiveColors().border; },
  get primaryLight() { return staticColors.primaryLight; },
  get light() { return activeLight; },
  get dark() { return globalIsDark ? dark : light; },
};

export { colors, typography, spacing, borderRadius, shadows };

export {
  designSystem,
  layout,
  animations,
  components,
  darkColors,
  premiumColors,
  premiumTypography,
  premiumSpacing,
  premiumBorderRadius,
  premiumShadows,
};

export const colorsLegacy = staticColors;
export const typographyLegacy = typography;
export const spacingLegacy = spacing;
export const shadowsLegacy = shadows;
export const borderRadiusLegacy = borderRadius;