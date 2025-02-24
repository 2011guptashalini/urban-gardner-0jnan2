import styled from 'styled-components';
import { flexColumn, respondTo, rtl } from '../../../styles/mixins';

/**
 * Main container for the yield calculator component
 * Implements responsive layout with consistent spacing
 */
export const Container = styled.div`
  ${flexColumn};
  padding: ${({ theme }) => theme.spacing.md};
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  max-width: ${({ theme }) => theme.spacing.container.lg};
  margin: 0 auto;
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 8px;
  
  ${respondTo('mobile')} {
    padding: ${({ theme }) => theme.spacing.lg};
  }

  ${rtl`
    direction: inherit;
  `};
`;

/**
 * Groups input fields with responsive layout
 * Supports RTL languages and maintains spacing
 */
export const InputGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  align-items: flex-start;
  
  ${respondTo('mobile')} {
    flex-direction: column;
  }

  ${rtl`
    flex-direction: row-reverse;
  `};
`;

/**
 * Container for displaying calculated yield results
 * Features elevation and interactive hover states
 */
export const YieldDisplay = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.secondary};
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.md};
  transition: ${({ theme }) => theme.transitions.normal};
  margin-top: ${({ theme }) => theme.spacing.md};

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.lg};
    transform: translateY(-2px);
  }

  ${respondTo('mobile')} {
    padding: ${({ theme }) => theme.spacing.sm};
  }
`;

/**
 * High-visibility warning message for space capacity alerts
 * Implements WCAG compliant contrast and responsive text
 */
export const WarningMessage = styled.span`
  color: ${({ theme }) => theme.colors.warning};
  font-family: ${({ theme }) => theme.typography.fontFamily};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 4px;
  border: 1px solid ${({ theme }) => theme.colors.warning};

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  ${respondTo('mobile')} {
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    padding: ${({ theme }) => theme.spacing.xs};
  }
`;

/**
 * Results table container with enhanced readability
 */
export const ResultsTable = styled.div`
  width: 100%;
  border-collapse: collapse;
  margin-top: ${({ theme }) => theme.spacing.md};
  
  table {
    width: 100%;
    border-spacing: 0;
  }

  th, td {
    padding: ${({ theme }) => theme.spacing.sm};
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.colors.secondary};
    font-family: ${({ theme }) => theme.typography.fontFamily};
  }

  th {
    font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
    color: ${({ theme }) => theme.colors.text};
  }

  td {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  ${rtl`
    th, td {
      text-align: right;
    }
  `};
`;