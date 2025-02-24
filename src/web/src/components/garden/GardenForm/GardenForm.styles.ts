import styled from 'styled-components';
import { flexColumn, respondTo } from '../../../styles/mixins';
import { theme } from '../../../styles/theme';

/**
 * Helper function to determine input field width based on field type and screen size
 * @param fieldType - Type of form field
 * @returns CSS width value
 */
const getInputWidth = (fieldType: string): string => {
  switch (fieldType) {
    case 'dimension':
      return '48%';
    case 'soil':
    case 'sunlight':
      return '100%';
    default:
      return '100%';
  }
};

/**
 * Main form container with responsive layout and theme-based styling
 */
export const FormContainer = styled.form`
  ${flexColumn};
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background};
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.md};
  transition: ${({ theme }) => theme.transitions.normal};

  ${respondTo('mobile')`
    padding: ${({ theme }) => theme.spacing.md};
    box-shadow: none;
  `}
`;

/**
 * Section wrapper for grouping related form fields
 */
export const FormSection = styled.div`
  ${flexColumn};
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  
  h2 {
    color: ${({ theme }) => theme.colors.text};
    font-size: ${({ theme }) => theme.typography.fontSize.h3};
    font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
    margin-bottom: ${({ theme }) => theme.spacing.sm};
  }
`;

/**
 * Flex container for horizontal input grouping with responsive behavior
 */
export const InputGroup = styled.div<{ fieldType?: string }>`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;

  > div {
    width: ${({ fieldType }) => getInputWidth(fieldType || 'default')};
  }

  ${respondTo('mobile')`
    flex-direction: column;
    
    > div {
      width: 100%;
    }
  `}
`;

/**
 * Form field label with required field indicator and theme typography
 */
export const Label = styled.label`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  display: block;

  &[data-required]:after {
    content: '*';
    color: ${({ theme }) => theme.colors.warning};
    margin-left: ${({ theme }) => theme.spacing.xxs};
  }
`;

/**
 * Input field wrapper with validation state styling
 */
export const InputWrapper = styled.div<{ hasError?: boolean }>`
  position: relative;
  width: 100%;

  input, select {
    width: 100%;
    padding: ${({ theme }) => theme.spacing.sm};
    border: 1px solid ${({ theme, hasError }) => 
      hasError ? theme.colors.warning : theme.colors.text};
    border-radius: 4px;
    font-size: ${({ theme }) => theme.typography.fontSize.md};
    transition: ${({ theme }) => theme.transitions.fast};
    background: ${({ theme }) => theme.colors.background};

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary};
      box-shadow: 0 0 0 2px ${({ theme }) => `${theme.colors.primary}33`};
    }

    &:disabled {
      background: ${({ theme }) => theme.colors.textMuted}33;
      cursor: not-allowed;
    }
  }
`;

/**
 * Error message styling for form validation
 */
export const ErrorMessage = styled.span`
  color: ${({ theme }) => theme.colors.warning};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
  display: block;
`;

/**
 * Radio button group container
 */
export const RadioGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xs};

  ${respondTo('mobile')`
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.sm};
  `}
`;

/**
 * Action button container with responsive alignment
 */
export const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xl};

  ${respondTo('mobile')`
    flex-direction: column;
    width: 100%;
    
    button {
      width: 100%;
    }
  `}
`;

/**
 * Help text for form fields
 */
export const HelpText = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;