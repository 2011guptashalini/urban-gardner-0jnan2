import styled from 'styled-components';
import { flexCenter, flexColumn, respondTo } from '../../styles/mixins';

/**
 * Main container for the registration page
 * Implements full-height centering with themed background
 */
export const RegisterContainer = styled.div`
  ${flexCenter}
  min-height: 100vh;
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.background};
  transition: background-color 0.3s ease;
  
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/**
 * Registration form component with responsive sizing and elevation
 * Implements accessibility attributes for form validation
 */
export const RegisterForm = styled.form`
  ${flexColumn}
  width: 100%;
  max-width: 480px;
  padding: ${({ theme }) => theme.spacing.xl};
  background-color: ${({ theme }) => theme.colors.textLight};
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.md};
  transition: all 0.3s ease;

  ${respondTo('tablet')`
    max-width: 400px;
    padding: ${({ theme }) => theme.spacing.lg};
  `}

  ${respondTo('mobile')`
    max-width: 320px;
    padding: ${({ theme }) => theme.spacing.md};
  `}

  &:focus-within {
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }

  &[aria-invalid='true'] {
    border: 1px solid ${({ theme }) => theme.colors.warning};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/**
 * Form title component with responsive typography
 */
export const FormTitle = styled.h1`
  color: ${({ theme }) => theme.colors.primary};
  font-family: ${({ theme }) => theme.typography.fontFamily};
  font-size: ${({ theme }) => theme.typography.fontSize.h1};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  ${respondTo('mobile')`
    font-size: ${({ theme }) => theme.typography.fontSize.h2};
    margin-bottom: ${({ theme }) => theme.spacing.md};
  `}
`;

/**
 * Form group container for input fields
 * Implements error states and proper spacing
 */
export const FormGroup = styled.div`
  ${flexColumn}
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.md};

  &[aria-invalid='true'] label {
    color: ${({ theme }) => theme.colors.warning};
  }

  &[aria-invalid='true'] input {
    border-color: ${({ theme }) => theme.colors.warning};
    background-color: rgba(244, 67, 54, 0.05);
  }
`;

/**
 * Form label component with proper styling and accessibility
 */
export const FormLabel = styled.label`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin-bottom: ${({ theme }) => theme.spacing.xxs};
`;

/**
 * Form input component with themed styling and states
 */
export const FormInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.textMuted};
  border-radius: 4px;
  font-family: ${({ theme }) => theme.typography.fontFamily};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text};
  background-color: ${({ theme }) => theme.colors.textLight};
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.secondary}40;
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.background};
    cursor: not-allowed;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/**
 * Submit button component with themed styling and states
 */
export const SubmitButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textLight};
  border: none;
  border-radius: 4px;
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.secondary};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.textMuted};
    cursor: not-allowed;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/**
 * Error message component for form validation feedback
 */
export const ErrorMessage = styled.span`
  color: ${({ theme }) => theme.colors.warning};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-top: ${({ theme }) => theme.spacing.xxs};
`;