import styled from 'styled-components';
import { colors, typography, spacing } from '../../styles/variables';
import { transition } from '../../styles/mixins';

/**
 * Determines input border color based on validation and focus states
 * @param hasError - Whether the input has validation errors
 * @param isFocused - Whether the input is currently focused
 * @returns Appropriate border color based on state
 */
const getInputBorderColor = (hasError: boolean, isFocused: boolean): string => {
  if (hasError) return colors.warning;
  if (isFocused) return colors.primary;
  return 'rgba(0, 0, 0, 0.23)'; // Default border color
};

/**
 * Container component for input field and associated elements
 * Provides consistent spacing and layout
 */
export const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.sm};
  width: 100%;
  position: relative;
  margin-bottom: ${spacing.md};
`;

/**
 * Styled input element with enhanced interaction states
 * and validation feedback
 */
export const StyledInput = styled.input<{
  hasError?: boolean;
  isFocused?: boolean;
}>`
  width: 100%;
  height: 48px;
  padding: ${spacing.sm} ${spacing.md};
  font-family: ${typography.fontFamily};
  font-size: ${typography.fontSize.md};
  color: ${colors.text};
  background-color: transparent;
  border: 1px solid ${({ hasError, isFocused }) => 
    getInputBorderColor(Boolean(hasError), Boolean(isFocused))};
  border-radius: 4px;
  outline: none;
  ${transition('all', '300ms')}

  &::placeholder {
    color: rgba(0, 0, 0, 0.54);
  }

  &:hover {
    border-color: ${({ hasError }) => 
      hasError ? colors.warning : 'rgba(0, 0, 0, 0.87)'};
  }

  &:focus {
    border-color: ${({ hasError }) => 
      hasError ? colors.warning : colors.primary};
    border-width: 2px;
    padding: ${spacing.sm} calc(${spacing.md} - 1px);
  }

  &:disabled {
    background-color: rgba(0, 0, 0, 0.12);
    border-color: rgba(0, 0, 0, 0.26);
    cursor: not-allowed;
  }
`;

/**
 * Label component for input field with consistent typography
 */
export const InputLabel = styled.label<{
  hasError?: boolean;
  required?: boolean;
}>`
  font-family: ${typography.fontFamily};
  font-size: ${typography.fontSize.sm};
  color: ${({ hasError }) => hasError ? colors.warning : colors.text};
  margin-bottom: ${spacing.xs};

  ${({ required }) => required && `
    &::after {
      content: '*';
      color: ${colors.warning};
      margin-left: ${spacing.xs};
    }
  `}
`;

/**
 * Error message component for validation feedback
 */
export const ErrorMessage = styled.span`
  font-family: ${typography.fontFamily};
  font-size: ${typography.fontSize.sm};
  color: ${colors.warning};
  margin-top: ${spacing.xs};
  min-height: 20px;
  ${transition('opacity')}
`;