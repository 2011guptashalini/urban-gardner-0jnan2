import styled, { css } from 'styled-components';
import { colors, typography, spacing } from '../../styles/variables';
import { transition } from '../../styles/mixins';

// Type definitions for button props
type ButtonVariant = 'primary' | 'secondary' | 'warning' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant: ButtonVariant;
  size: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
}

// Helper function to calculate hover color (20% darker)
const getDarkerColor = (hex: string): string => {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) * 0.8;
  const g = ((rgb >> 8) & 0xff) * 0.8;
  const b = (rgb & 0xff) * 0.8;
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

// Generate styles for different button variants
const getButtonVariantStyles = (variant: ButtonVariant) => {
  const variantStyles = {
    primary: {
      background: colors.primary,
      color: '#FFFFFF',
      hoverBg: getDarkerColor(colors.primary),
    },
    secondary: {
      background: colors.secondary,
      color: colors.text,
      hoverBg: getDarkerColor(colors.secondary),
    },
    warning: {
      background: colors.warning,
      color: '#FFFFFF',
      hoverBg: getDarkerColor(colors.warning),
    },
    success: {
      background: colors.success,
      color: '#FFFFFF',
      hoverBg: getDarkerColor(colors.success),
    },
  };

  return css`
    background-color: ${variantStyles[variant].background};
    color: ${variantStyles[variant].color};

    &:hover:not(:disabled) {
      background-color: ${variantStyles[variant].hoverBg};
    }

    &:active:not(:disabled) {
      transform: translateY(1px);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `;
};

// Generate styles for different button sizes
const getButtonSizeStyles = (size: ButtonSize) => {
  const sizeStyles = {
    sm: {
      padding: `${spacing.xs} ${spacing.sm}`,
      fontSize: typography.fontSize.sm,
      minWidth: '80px',
    },
    md: {
      padding: `${spacing.sm} ${spacing.md}`,
      fontSize: typography.fontSize.md,
      minWidth: '120px',
    },
    lg: {
      padding: `${spacing.md} ${spacing.lg}`,
      fontSize: typography.fontSize.lg,
      minWidth: '160px',
    },
  };

  return css`
    padding: ${sizeStyles[size].padding};
    font-size: ${sizeStyles[size].fontSize};
    min-width: ${sizeStyles[size].minWidth};
  `;
};

// Main styled button component
export const StyledButton = styled.button<ButtonProps>`
  // Base styles
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  font-family: ${typography.fontFamily};
  font-weight: ${typography.fontWeight.medium};
  line-height: ${typography.lineHeight.normal};
  text-align: center;
  cursor: pointer;
  outline: none;
  white-space: nowrap;
  user-select: none;
  
  // Width control
  width: ${({ fullWidth }) => fullWidth ? '100%' : 'auto'};
  
  // Transitions
  ${transition('all', '300ms')}
  
  // Focus styles
  &:focus-visible {
    box-shadow: 0 0 0 2px ${colors.primary}40;
  }

  // Apply variant-specific styles
  ${({ variant }) => getButtonVariantStyles(variant)}
  
  // Apply size-specific styles
  ${({ size }) => getButtonSizeStyles(size)}
`;