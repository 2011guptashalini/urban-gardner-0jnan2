import styled from 'styled-components';
import { flexCenter, respondTo } from '../../../styles/mixins';

/**
 * Container component for the garden list implementing responsive grid layout
 * Adapts grid columns based on screen size:
 * - Desktop (>1024px): 3 columns
 * - Tablet (768-1024px): 2 columns
 * - Mobile (<768px): 1 column
 */
export const GardenListContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.background};
  min-height: 100vh;
  width: 100%;
  margin: 0 auto;
  max-width: ${({ theme }) => theme.spacing.container.lg};
  will-change: grid-template-columns;
  transition: ${({ theme }) => theme.transitions.normal};

  ${respondTo('tablet')} {
    grid-template-columns: repeat(2, 1fr);
    gap: ${({ theme }) => theme.spacing.sm};
    padding: ${({ theme }) => theme.spacing.md};
  }

  ${respondTo('mobile')} {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.sm};
    padding: ${({ theme }) => theme.spacing.sm};
  }
`;

/**
 * Container for empty state message with centered alignment
 * Displays when no gardens are available
 */
export const EmptyStateContainer = styled.div`
  ${flexCenter};
  min-height: 200px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  grid-column: 1 / -1;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

/**
 * Styled button for adding new gardens with interactive states
 * Implements consistent theme colors and transitions
 */
export const AddGardenButton = styled.button`
  ${({ theme }) => theme.components.button.base};
  ${({ theme }) => theme.components.button.variants.primary};
  width: fit-content;
  margin: ${({ theme }) => theme.spacing.md} 0;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  &:active {
    transform: translateY(0);
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }

  ${respondTo('mobile')} {
    width: 100%;
    margin: ${({ theme }) => theme.spacing.sm} 0;
  }
`;

/**
 * Container for garden cards with hover interaction
 */
export const GardenCard = styled.div`
  ${({ theme }) => theme.components.card.base};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.normal};
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }

  &:active {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;