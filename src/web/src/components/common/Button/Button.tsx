import React from 'react';
import { StyledButton } from './Button.styles';

// Button variant type definition
export type ButtonVariant = 'primary' | 'secondary' | 'warning' | 'success';

// Button size type definition
export type ButtonSize = 'small' | 'medium' | 'large';

// Props interface for the Button component
export interface ButtonProps {
  /** Visual style variant of the button */
  variant?: ButtonVariant;
  /** Size variant of the button */
  size?: ButtonSize;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether the button takes full width of container */
  fullWidth?: boolean;
  /** Whether the button is in loading state */
  isLoading?: boolean;
  /** Click event handler function */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Button content */
  children: React.ReactNode;
  /** Accessibility label for the button */
  ariaLabel?: string;
}

/**
 * Validates button props and logs warnings for invalid combinations
 * @param props - ButtonProps to validate
 */
const validateProps = (props: ButtonProps): void => {
  const validVariants: ButtonVariant[] = ['primary', 'secondary', 'warning', 'success'];
  const validSizes: ButtonSize[] = ['small', 'medium', 'large'];

  if (props.variant && !validVariants.includes(props.variant)) {
    console.warn(`Invalid button variant: ${props.variant}. Must be one of: ${validVariants.join(', ')}`);
  }

  if (props.size && !validSizes.includes(props.size)) {
    console.warn(`Invalid button size: ${props.size}. Must be one of: ${validSizes.join(', ')}`);
  }

  if (props.disabled && props.isLoading) {
    console.warn('Button should not have both disabled and isLoading states active');
  }

  if (props.onClick && props.disabled) {
    console.warn('onClick handler provided for disabled button will not be triggered');
  }
};

/**
 * A reusable, accessible button component that provides consistent styling
 * and behavior across the Urban Gardening Assistant application.
 */
export const Button = React.memo<ButtonProps>(({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
  isLoading = false,
  onClick,
  children,
  ariaLabel,
}) => {
  // Validate props in development environment
  if (process.env.NODE_ENV === 'development') {
    validateProps({ variant, size, disabled, fullWidth, isLoading, onClick, children, ariaLabel });
  }

  // Convert size prop to match styled component expectations
  const sizeMap: Record<ButtonSize, 'sm' | 'md' | 'lg'> = {
    small: 'sm',
    medium: 'md',
    large: 'lg'
  };

  // Handle click events
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !isLoading && onClick) {
      onClick(event);
    }
  };

  return (
    <StyledButton
      variant={variant}
      size={sizeMap[size]}
      disabled={disabled || isLoading}
      fullWidth={fullWidth}
      onClick={handleClick}
      aria-label={ariaLabel}
      aria-disabled={disabled || isLoading}
      role="button"
    >
      {isLoading ? (
        <>
          <span className="visually-hidden">Loading...</span>
          {children}
        </>
      ) : (
        children
      )}
    </StyledButton>
  );
});

// Display name for debugging
Button.displayName = 'Button';

export default Button;