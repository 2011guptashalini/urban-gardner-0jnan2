import styled from 'styled-components';
import { DefaultTheme } from 'styled-components';
import { flexColumn, respondTo } from '../../../styles/mixins';

/**
 * Main container for the space calculator component
 * Implements responsive layout with theme-based styling
 */
export const Container = styled.div`
  ${flexColumn}
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.md};
  max-width: ${({ theme }) => theme.spacing.container.md};
  width: 100%;
  margin: 0 auto;

  ${respondTo('tablet')} {
    padding: ${({ theme }) => theme.spacing.md};
    gap: ${({ theme }) => theme.spacing.sm};
  }

  ${respondTo('mobile')} {
    padding: ${({ theme }) => theme.spacing.sm};
    max-width: 100%;
  }
`;

/**
 * Container for input field groups with consistent spacing
 */
export const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  width: 100%;

  ${respondTo('mobile')} {
    gap: ${({ theme }) => theme.spacing.xxs};
  }
`;

/**
 * Label for dimension input fields
 */
export const Label = styled.label`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin-bottom: ${({ theme }) => theme.spacing.xxs};
`;

/**
 * Input field for dimensions with theme-based styling
 */
export const Input = styled.input`
  ${({ theme }) => theme.components.input.base};
  
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &[aria-invalid="true"] {
    ${({ theme }) => theme.components.input.states.error};
  }
`;

/**
 * Styled message for validation feedback
 */
export const ValidationMessage = styled.span<{ error?: boolean }>`
  color: ${({ theme, error }) => error ? theme.colors.warning : theme.colors.text};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  margin-top: ${({ theme }) => theme.spacing.xs};
  transition: color 0.2s ease;

  ${respondTo('mobile')} {
    font-size: ${({ theme }) => theme.typography.fontSize.xxs};
  }
`;

/**
 * Container for unit selection (feet/meters)
 */
export const UnitSelector = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

/**
 * Radio button container for unit selection
 */
export const RadioGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: center;

  ${respondTo('mobile')} {
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

/**
 * Label for radio buttons
 */
export const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  cursor: pointer;
`;

/**
 * Results container for calculated values
 */
export const ResultsContainer = styled.div`
  ${flexColumn}
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.secondary}10;
  border-radius: 4px;
  margin-top: ${({ theme }) => theme.spacing.md};
`;

/**
 * Text for displaying calculation results
 */
export const ResultText = styled.p`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin: 0;
`;