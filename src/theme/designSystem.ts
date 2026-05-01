/**
 * Premium Design System
 * 
 * Modern, elegant, premium-looking design system for MyChama.
 * Features:
 * - Premium green/emerald brand foundation
 * - Subtle gold/amber accents
 * - Refined neutral surfaces
 * - Beautiful dark mode support
 * - Soft shadows
 * - Rounded corners
 * - Clean card layouts
 * - Excellent spacing
 * - Strong visual hierarchy
 * - Premium typography
 * - Subtle micro-interactions
 */

import { Platform, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const colors = {
  // Primary - Premium Emerald Green
  primary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981', // Main brand color
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  
  // Secondary - Gold/Amber Accents
  secondary: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Main accent
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Neutral - Refined Grays
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  
  // Semantic Colors
  success: {
    light: '#d1fae5',
    main: '#10b981',
    dark: '#047857',
  },
  
  warning: {
    light: '#fef3c7',
    main: '#f59e0b',
    dark: '#b45309',
  },
  
  error: {
    light: '#fee2e2',
    main: '#ef4444',
    dark: '#b91c1c',
  },
  
  info: {
    light: '#dbeafe',
    main: '#3b82f6',
    dark: '#1d4ed8',
  },
  
  // Background Colors
  background: {
    light: '#ffffff',
    dark: '#0a0a0a',
    card: '#ffffff',
    cardDark: '#1a1a1a',
    elevated: '#f9fafb',
    elevatedDark: '#262626',
  },
  
  // Text Colors
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    tertiary: '#9ca3af',
    inverse: '#ffffff',
    disabled: '#d1d5db',
  },
  
  // Border Colors
  border: {
    light: '#e5e7eb',
    medium: '#d1d5db',
    dark: '#9ca3af',
  },
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  // Font Families
  fontFamily: {
    regular: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
    medium: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
      default: 'System',
    }),
    semibold: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
      default: 'System',
    }),
    bold: Platform.select({
      ios: 'System',
      android: 'Roboto-Bold',
      default: 'System',
    }),
  },
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Font Weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // Text Styles
  h1: {
    fontSize: 36,
    fontWeight: '700' as const,
    lineHeight: 1.25,
    color: colors.text.primary,
  },
  h2: {
    fontSize: 30,
    fontWeight: '700' as const,
    lineHeight: 1.25,
    color: colors.text.primary,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 1.25,
    color: colors.text.primary,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 1.25,
    color: colors.text.primary,
  },
  h5: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 1.25,
    color: colors.text.primary,
  },
  h6: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 1.25,
    color: colors.text.primary,
  },
  body1: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 1.5,
    color: colors.text.primary,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 1.5,
    color: colors.text.secondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 1.5,
    color: colors.text.tertiary,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 1.5,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 1.5,
    color: colors.text.secondary,
  },
};

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
};

// ============================================================================
// LAYOUT
// ============================================================================

export const layout = {
  screen: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    padding: spacing.base,
  },
  container: {
    maxWidth: 1200,
    paddingHorizontal: spacing.base,
  },
  card: {
    padding: spacing.base,
    borderRadius: borderRadius.lg,
  },
  button: {
    height: 48,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  input: {
    height: 48,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
  },
};

// ============================================================================
// ANIMATIONS
// ============================================================================

export const animations = {
  timing: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  easing: {
    easeInOut: 'ease-in-out',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    linear: 'linear',
  },
  scale: {
    pressed: 0.98,
    hover: 1.02,
  },
};

// ============================================================================
// COMPONENT STYLES
// ============================================================================

export const components = {
  // Button Styles
  button: {
    primary: {
      backgroundColor: colors.primary[500],
      borderRadius: borderRadius.md,
      height: layout.button.height,
      paddingHorizontal: layout.button.paddingHorizontal,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      ...shadows.sm,
    },
    secondary: {
      backgroundColor: colors.primary[50],
      borderRadius: borderRadius.md,
      height: layout.button.height,
      paddingHorizontal: layout.button.paddingHorizontal,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderColor: colors.primary[200],
    },
    outline: {
      backgroundColor: 'transparent',
      borderRadius: borderRadius.md,
      height: layout.button.height,
      paddingHorizontal: layout.button.paddingHorizontal,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderColor: colors.border.medium,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderRadius: borderRadius.md,
      height: layout.button.height,
      paddingHorizontal: layout.button.paddingHorizontal,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    danger: {
      backgroundColor: colors.error.main,
      borderRadius: borderRadius.md,
      height: layout.button.height,
      paddingHorizontal: layout.button.paddingHorizontal,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      ...shadows.sm,
    },
  },
  
  // Card Styles
  card: {
    default: {
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.lg,
      padding: layout.card.padding,
      ...shadows.base,
    },
    elevated: {
      backgroundColor: colors.background.elevated,
      borderRadius: borderRadius.lg,
      padding: layout.card.padding,
      ...shadows.md,
    },
    outlined: {
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.lg,
      padding: layout.card.padding,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
  },
  
  // Input Styles
  input: {
    default: {
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.md,
      height: layout.input.height,
      paddingHorizontal: layout.input.paddingHorizontal,
      borderWidth: 1,
      borderColor: colors.border.light,
      fontSize: typography.fontSize.base,
      color: colors.text.primary,
    },
    focused: {
      borderColor: colors.primary[500],
      borderWidth: 2,
    },
    error: {
      borderColor: colors.error.main,
      borderWidth: 2,
    },
    disabled: {
      backgroundColor: colors.neutral[100],
      borderColor: colors.border.light,
      color: colors.text.disabled,
    },
  },
  
  // Avatar Styles
  avatar: {
    sm: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.full,
    },
    md: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.full,
    },
    lg: {
      width: 56,
      height: 56,
      borderRadius: borderRadius.full,
    },
    xl: {
      width: 80,
      height: 80,
      borderRadius: borderRadius.full,
    },
  },
  
  // Badge Styles
  badge: {
    default: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      backgroundColor: colors.neutral[100],
    },
    primary: {
      backgroundColor: colors.primary[100],
    },
    success: {
      backgroundColor: colors.success.light,
    },
    warning: {
      backgroundColor: colors.warning.light,
    },
    error: {
      backgroundColor: colors.error.light,
    },
  },
  
  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.base,
  },
  
  // Skeleton
  skeleton: {
    backgroundColor: colors.neutral[200],
    borderRadius: borderRadius.base,
  },
};

// ============================================================================
// DARK MODE COLORS
// ============================================================================

export const darkColors = {
  ...colors,
  background: {
    light: '#0a0a0a',
    dark: '#ffffff',
    card: '#1a1a1a',
    cardDark: '#ffffff',
    elevated: '#262626',
    elevatedDark: '#f9fafb',
  },
  text: {
    primary: '#f9fafb',
    secondary: '#a3a3a3',
    tertiary: '#737373',
    inverse: '#111827',
    disabled: '#525252',
  },
  border: {
    light: '#404040',
    medium: '#525252',
    dark: '#737373',
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export const designSystem = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  layout,
  animations,
  components,
  darkColors,
};

export default designSystem;
