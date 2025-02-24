import styled from 'styled-components';
import { flexColumn, respondTo } from '../../../styles/mixins';

/**
 * Main form container with responsive layout and consistent spacing
 */
export const FormContainer = styled.form`
  ${flexColumn}
  width: 100%;
  max-width: ${({ theme }) => theme.spacing.container.md};
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.md};

  ${respondTo('mobile')} {
    padding: ${({ theme }) => theme.spacing.md};
  }

  ${respondTo('tablet')} {
    padding: ${({ theme }) => theme.spacing.lg};
  }
`;

/**
 * Section container for grouping related form fields
 */
export const FormSection = styled.div`
  ${flexColumn}
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.textMuted}20;

  &:last-child {
    border-bottom: none;
  }
`;

/**
 * Container for input field and label with validation state styling
 */
export const InputGroup = styled.div<{ hasError?: boolean; isSuccess?: boolean }>`
  ${flexColumn}
  gap: ${({ theme }) => theme.spacing.xs};
  position: relative;

  input, select, textarea {
    ${({ theme }) => theme.components.input.base};
    border-color: ${({ theme, hasError, isSuccess }) => 
      hasError ? theme.colors.warning :
      isSuccess ? theme.colors.success :
      theme.colors.text};
    
    &:focus {
      border-color: ${({ theme, hasError }) =>
        hasError ? theme.colors.warning : theme.colors.primary};
    }
  }

  ${respondTo('tablet')} {
    flex-direction: row;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.md};

    label {
      flex: 0 0 200px;
    }
  }
`;

/**
 * Accessible form labels with consistent typography
 */
export const Label = styled.label`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
`;

/**
 * Radio button group container with horizontal layout
 */
export const RadioGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: center;
  flex-wrap: wrap;

  label {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.xs};
    cursor: pointer;
  }

  input[type="radio"] {
    width: auto;
    margin: 0;
  }
`;

/**
 * Action button container with responsive layout
 */
export const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};
  
  ${respondTo('mobile')} {
    flex-direction: column;
    width: 100%;

    button {
      width: 100%;
    }
  }

  ${respondTo('tablet')} {
    flex-direction: row;
    justify-content: flex-end;

    button {
      width: auto;
    }
  }
`;

/**
 * Validation error message with theme-consistent styling
 */
export const ErrorMessage = styled.span`
  color: ${({ theme }) => theme.colors.warning};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-top: ${({ theme }) => theme.spacing.xxs};
`;

/**
 * Schedule table container with responsive layout
 */
export const ScheduleTable = styled.div`
  width: 100%;
  overflow-x: auto;
  border: 1px solid ${({ theme }) => theme.colors.textMuted}20;
  border-radius: 4px;
  margin-top: ${({ theme }) => theme.spacing.md};

  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 600px;
  }

  th, td {
    padding: ${({ theme }) => theme.spacing.sm};
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.colors.textMuted}20;
  }

  th {
    background-color: ${({ theme }) => theme.colors.background};
    font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  }
`;

/**
 * AI recommendation toggle switch container
 */
export const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} 0;

  input[type="checkbox"] {
    width: auto;
    margin: 0;
  }
`;