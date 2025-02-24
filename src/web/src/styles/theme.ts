import { DefaultTheme } from 'styled-components';
import { colors, typography, spacing } from './variables';

/**
 * Theme interface extension for styled-components
 * Provides type safety for custom theme properties
 */
declare module 'styled-components' {
  export interface DefaultTheme {
    colors: typeof colors;
    typography: typeof typography;
    spacing: typeof spacing;
    breakpoints: {
      mobile: string;
      tablet: string;
      desktop: string;
    };
    components: {
      button: {
        base: {
          padding: string;
          borderRadius: string;
          transition: string;
          cursor: string;
          border: string;
          fontFamily: string;
          fontSize: string;
          fontWeight: number;
          display: string;
          alignItems: string;
          justifyContent: string;
        };
        variants: {
          primary: {
            backgroundColor: string;
            color: string;
            '&:hover': {
              backgroundColor: string;
            };
          };
          secondary: {
            backgroundColor: string;
            color: string;
            '&:hover': {
              backgroundColor: string;
            };
          };
          warning: {
            backgroundColor: string;
            color: string;
            '&:hover': {
              backgroundColor: string;
            };
          };
        };
      };
      input: {
        base: {
          padding: string;
          borderRadius: string;
          border: string;
          fontSize: string;
          fontFamily: string;
          width: string;
          transition: string;
          backgroundColor: string;
          '&:focus': {
            outline: string;
            borderColor: string;
          };
        };
        states: {
          error: {
            borderColor: string;
            color: string;
          };
          success: {
            borderColor: string;
            color: string;
          };
        };
      };
      card: {
        base: {
          padding: string;
          backgroundColor: string;
          borderRadius: string;
          boxShadow: string;
          transition: string;
          border: string;
        };
      };
    };
  }
}

/**
 * Default theme configuration for the Urban Gardening Assistant application
 * Implements design system specifications from technical requirements
 */
const theme: DefaultTheme = {
  // Core design tokens
  colors,
  typography,
  spacing,

  // Responsive breakpoints
  breakpoints: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1025px',
  },

  // Component-specific styling
  components: {
    button: {
      base: {
        padding: `${spacing.sm} ${spacing.md}`,
        borderRadius: '4px',
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
        border: 'none',
        fontFamily: typography.fontFamily,
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.medium,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      variants: {
        primary: {
          backgroundColor: colors.primary,
          color: colors.textLight,
          '&:hover': {
            backgroundColor: colors.primaryDark,
          },
        },
        secondary: {
          backgroundColor: colors.secondary,
          color: colors.text,
          '&:hover': {
            backgroundColor: colors.secondaryDark,
          },
        },
        warning: {
          backgroundColor: colors.warning,
          color: colors.textLight,
          '&:hover': {
            backgroundColor: colors.warning,
          },
        },
      },
    },
    input: {
      base: {
        padding: spacing.sm,
        borderRadius: '4px',
        border: `1px solid ${colors.text}`,
        fontSize: typography.fontSize.md,
        fontFamily: typography.fontFamily,
        width: '100%',
        transition: 'all 0.2s ease-in-out',
        backgroundColor: colors.background,
        '&:focus': {
          outline: 'none',
          borderColor: colors.primary,
        },
      },
      states: {
        error: {
          borderColor: colors.warning,
          color: colors.warning,
        },
        success: {
          borderColor: colors.success,
          color: colors.success,
        },
      },
    },
    card: {
      base: {
        padding: spacing.lg,
        backgroundColor: colors.background,
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease-in-out',
        border: `1px solid ${colors.text}`,
      },
    },
  },
};

export default theme;