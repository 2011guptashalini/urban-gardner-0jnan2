import styled from 'styled-components';
import { flexColumn, respondTo } from '../../styles/mixins';

/**
 * Main container for the profile page
 * Implements responsive layout with max-width constraints
 */
export const ProfileContainer = styled.div`
  ${flexColumn}
  max-width: ${({ theme }) => theme.spacing.container.lg};
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.lg};
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
`;

/**
 * Profile header section containing welcome message and user info
 */
export const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  padding-bottom: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.secondary};

  h1 {
    color: ${({ theme }) => theme.colors.text};
    font-size: ${({ theme }) => theme.typography.fontSize.h1};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    margin: 0;
  }
`;

/**
 * Main content area with responsive grid layout for garden cards
 */
export const ProfileContent = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;

  /* Single column for mobile */
  grid-template-columns: 1fr;

  /* Two columns for tablet */
  ${respondTo('tablet')} {
    grid-template-columns: repeat(2, 1fr);
  }

  /* Three columns for desktop */
  ${respondTo('desktop')} {
    grid-template-columns: repeat(3, 1fr);
  }
`;

/**
 * Individual garden card styling
 * Implements hover effects and consistent spacing
 */
export const GardenCard = styled.article`
  ${({ theme }) => theme.components.card.base};
  cursor: pointer;
  
  /* Card content styling */
  h3 {
    color: ${({ theme }) => theme.colors.primary};
    font-size: ${({ theme }) => theme.typography.fontSize.h4};
    font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
    margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
  }

  p {
    color: ${({ theme }) => theme.colors.text};
    font-size: ${({ theme }) => theme.typography.fontSize.md};
    margin: ${({ theme }) => theme.spacing.xs} 0;
  }

  /* Interactive states */
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-color: ${({ theme }) => theme.colors.primary};
  }

  /* View button styling */
  button {
    margin-top: ${({ theme }) => theme.spacing.md};
    width: 100%;
    ${({ theme }) => theme.components.button.base};
    ${({ theme }) => theme.components.button.variants.secondary};
  }
`;

/**
 * Container for action buttons in the profile header
 */
export const ProfileActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};

  button {
    ${({ theme }) => theme.components.button.base};
    ${({ theme }) => theme.components.button.variants.primary};
  }
`;

/**
 * Empty state container when no gardens are present
 */
export const EmptyState = styled.div`
  ${flexColumn};
  align-items: center;
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.textMuted};
  
  h2 {
    font-size: ${({ theme }) => theme.typography.fontSize.h3};
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }

  p {
    font-size: ${({ theme }) => theme.typography.fontSize.md};
    margin-bottom: ${({ theme }) => theme.spacing.lg};
  }

  button {
    ${({ theme }) => theme.components.button.base};
    ${({ theme }) => theme.components.button.variants.primary};
  }
`;