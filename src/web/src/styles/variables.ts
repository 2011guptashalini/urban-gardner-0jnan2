/**
 * Core style variables and constants for the Urban Gardening Assistant application.
 * Defines fundamental styling values used throughout the application.
 * @version 1.0.0
 */

/**
 * Application color palette
 * Follows Material Design color system principles
 */
const colors = {
  // Primary brand colors
  primary: '#2E7D32',
  primaryDark: '#1B5E20',
  
  // Secondary accent colors
  secondary: '#81C784',
  secondaryDark: '#558B2F',
  
  // Background colors
  background: '#F5F5F5',
  
  // Text colors
  text: '#333333',
  textLight: '#FFFFFF',
  textMuted: '#757575',
  
  // Semantic colors
  warning: '#F44336',
  success: '#4CAF50'
} as const;

/**
 * Responsive design breakpoints
 * Mobile-first approach with min-width breakpoints
 */
const breakpoints = {
  mobile: 768,    // Mobile devices (<768px)
  tablet: 1024,   // Tablets (768px-1024px)
  desktop: 1200,  // Desktop (1024px-1200px)
  largeDesktop: 1440 // Large desktop (>1200px)
} as const;

/**
 * Spacing system
 * Uses 8px grid for consistent component spacing
 */
const spacing = {
  // Base spacing units
  xxs: '2px',
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  
  // Container max-widths
  container: {
    sm: '600px',
    md: '960px',
    lg: '1280px'
  }
} as const;

/**
 * Typography system
 * Uses Roboto as primary font with system fallbacks
 */
const typography = {
  fontFamily: 'Roboto, system-ui, sans-serif',
  
  // Font sizes
  fontSize: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    h1: '32px',
    h2: '28px',
    h3: '24px',
    h4: '20px'
  },
  
  // Font weights
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    bold: 700
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75
  }
} as const;

/**
 * Z-index management system
 * Ensures consistent layering of UI elements
 */
const zIndex = {
  modal: 1000,
  overlay: 900,
  dropdown: 800,
  header: 700,
  tooltip: 600,
  default: 1
} as const;

/**
 * Shadow system
 * Provides consistent elevation and depth
 */
const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px rgba(0,0,0,0.1)',
  lg: '0 10px 15px rgba(0,0,0,0.1)'
} as const;

/**
 * Animation timing system
 * Ensures consistent motion design
 */
const transitions = {
  fast: '150ms ease-in-out',
  normal: '300ms ease-in-out',
  slow: '500ms ease-in-out'
} as const;

// Export all style variables
export {
  colors,
  breakpoints,
  spacing,
  typography,
  zIndex,
  shadows,
  transitions
};

// Type exports for TypeScript support
export type Colors = typeof colors;
export type Breakpoints = typeof breakpoints;
export type Spacing = typeof spacing;
export type Typography = typeof typography;
export type ZIndex = typeof zIndex;
export type Shadows = typeof shadows;
export type Transitions = typeof transitions;