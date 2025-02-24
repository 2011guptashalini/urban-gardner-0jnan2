import styled from 'styled-components';
import { DefaultTheme } from 'styled-components';
import { flexColumn, respondTo } from '../../../styles/mixins';

/**
 * Main form container with responsive layout and accessibility enhancements
 */
export const FormContainer = styled.form`
  ${flexColumn};
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
  max-width: ${({ theme }) => theme.spacing.container.sm};
  padding: ${({ theme }) => theme.spacing.lg};
  margin: 0 auto;
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: box-shadow 0.2s ease-in-out;

  ${respondTo('mobile')`
    padding: ${({ theme }) => theme.spacing.md};
  `}

  &:focus-within {
    box-shadow: ${({ theme }) => theme.shadows.md};
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  /* Ensure form is keyboard accessible */
  &:focus {
    outline: none;
  }

  /* Support for RTL languages */
  [dir='rtl'] & {
    text-align: right;
  }
`;

/**
 * Form group wrapper for input fields and labels
 */
export const FormGroup = styled.div`
  ${flexColumn};
  gap: ${({ theme }) => theme.spacing.xs};
  position: relative;

  label {
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
    color: ${({ theme }) => theme.colors.text};
    font-size: ${({ theme }) => theme.typography.fontSize.md};
    margin-bottom: ${({ theme }) => theme.spacing.xxs};

    /* Required field indicator */
    &[data-required]::after {
      content: '*';
      color: ${({ theme }) => theme.colors.warning};
      margin-left: ${({ theme }) => theme.spacing.xxs};
    }
  }

  input, select {
    padding: ${({ theme }) => theme.spacing.sm};
    border: 1px solid ${({ theme }) => theme.colors.secondary};
    border-radius: 4px;
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.fontSize.md};
    width: 100%;
    background-color: ${({ theme }) => theme.colors.background};
    transition: border-color 0.2s ease-in-out;
    
    &:focus {
      border-color: ${({ theme }) => theme.colors.primary};
      outline: none;
      box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
    }

    &:invalid {
      border-color: ${({ theme }) => theme.colors.warning};
    }

    /* High contrast mode support */
    @media (forced-colors: active) {
      border: 2px solid ButtonText;
    }

    /* Increase touch target size on mobile */
    ${respondTo('mobile')`
      min-height: 44px;
    `}
  }
`;

/**
 * Error message styling with high visibility and accessibility
 */
export const ErrorMessage = styled.span`
  color: ${({ theme }) => theme.colors.warning};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin-top: ${({ theme }) => theme.spacing.xs};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  animation: fadeIn 0.2s ease-in-out;

  /* Warning icon */
  &::before {
    content: '⚠';
    font-size: ${({ theme }) => theme.typography.fontSize.md};
  }

  /* Respect reduced motion preferences */
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  /* High contrast mode support */
  @media (forced-colors: active) {
    color: Mark;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

/**
 * Button group with responsive layout
 */
export const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.lg};

  /* Stack buttons vertically on mobile */
  ${respondTo('mobile')`
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.md};
    
    button {
      width: 100%;
      min-height: 44px; /* Ensure minimum touch target size */
    }
  `}

  /* RTL support */
  [dir='rtl'] & {
    justify-content: flex-start;
  }

  /* High contrast mode support */
  @media (forced-colors: active) {
    border-top: 1px solid ButtonText;
    padding-top: ${({ theme }) => theme.spacing.md};
  }
`;