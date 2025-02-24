import styled from 'styled-components';
import { flexColumn, respondTo } from '../../styles/mixins';

/**
 * Main container for the dashboard page
 * Implements responsive layout with consistent spacing
 */
export const DashboardContainer = styled.div`
  ${flexColumn}
  max-width: ${({ theme }) => theme.spacing.container.lg};
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.background};
  min-height: 100vh;

  ${respondTo('mobile')} {
    padding: ${({ theme }) => theme.spacing.xl};
  }
`;

/**
 * Welcome section with enhanced visual hierarchy
 */
export const WelcomeSection = styled.section`
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 8px;
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  transition: ${({ theme }) => theme.transitions.normal};

  h1 {
    color: ${({ theme }) => theme.colors.text};
    font-size: ${({ theme }) => theme.typography.fontSize.h1};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }

  .actions {
    display: flex;
    gap: ${({ theme }) => theme.spacing.md};
    margin-top: ${({ theme }) => theme.spacing.lg};
    flex-wrap: wrap;

    ${respondTo('mobile')} {
      flex-wrap: nowrap;
    }
  }
`;

/**
 * Garden cards grid section with responsive layout
 */
export const GardenSection = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing.xl};

  h2 {
    color: ${({ theme }) => theme.colors.text};
    font-size: ${({ theme }) => theme.typography.fontSize.h2};
    font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
    margin-bottom: ${({ theme }) => theme.spacing.lg};
  }

  .garden-grid {
    display: grid;
    gap: ${({ theme }) => theme.spacing.lg};
    grid-template-columns: 1fr;

    ${respondTo('mobile')} {
      grid-template-columns: repeat(2, 1fr);
    }

    ${respondTo('tablet')} {
      grid-template-columns: repeat(3, 1fr);
    }

    ${respondTo('desktop')} {
      grid-template-columns: repeat(4, 1fr);
    }
  }
`;

/**
 * Individual garden card styling
 */
export const GardenCard = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 8px;
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 1px solid ${({ theme }) => theme.colors.secondary};
  transition: ${({ theme }) => theme.transitions.normal};
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  h3 {
    color: ${({ theme }) => theme.colors.text};
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
    font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
    margin-bottom: ${({ theme }) => theme.spacing.sm};
  }

  .stats {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.md};
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }

  .view-button {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.xs};

    &:hover {
      color: ${({ theme }) => theme.colors.primaryDark};
    }
  }
`;

/**
 * Maintenance schedule section with enhanced interaction
 */
export const MaintenanceSection = styled.section`
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 8px;
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};

  h2 {
    color: ${({ theme }) => theme.colors.text};
    font-size: ${({ theme }) => theme.typography.fontSize.h2};
    font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
    margin-bottom: ${({ theme }) => theme.spacing.lg};
  }

  .schedule-list {
    max-height: 400px;
    overflow-y: auto;
    padding-right: ${({ theme }) => theme.spacing.md};
    
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: ${({ theme }) => theme.colors.background};
    }

    &::-webkit-scrollbar-thumb {
      background: ${({ theme }) => theme.colors.secondary};
      border-radius: 3px;
    }
  }

  .schedule-item {
    padding: ${({ theme }) => theme.spacing.md};
    border-bottom: 1px solid ${({ theme }) => theme.colors.secondary};
    transition: ${({ theme }) => theme.transitions.normal};

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background-color: ${({ theme }) => theme.colors.background};
    }
  }
`;

/**
 * Loading state placeholder styling
 */
export const LoadingPlaceholder = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 8px;
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0% {
      opacity: 0.6;
    }
    50% {
      opacity: 0.8;
    }
    100% {
      opacity: 0.6;
    }
  }
`;

/**
 * Empty state styling
 */
export const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.textMuted};

  h3 {
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }

  p {
    margin-bottom: ${({ theme }) => theme.spacing.lg};
  }
`;