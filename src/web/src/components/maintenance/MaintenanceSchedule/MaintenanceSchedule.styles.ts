import styled from 'styled-components';
import { DefaultTheme } from 'styled-components';
import { flexColumn, respondTo } from '../../../styles/mixins';

/**
 * Main container for the maintenance schedule interface
 * Implements responsive layout and consistent spacing
 */
export const ScheduleContainer = styled.div`
  ${flexColumn};
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background};
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.md};
  gap: ${({ theme }) => theme.spacing.md};
  transition: all 0.3s ease;

  ${respondTo('tablet')} {
    padding: ${({ theme }) => theme.spacing.lg};
  }
`;

/**
 * Header section containing title and controls
 */
export const ScheduleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-bottom: ${({ theme }) => theme.spacing.sm};
  border-bottom: 1px solid ${({ theme }) => theme.colors.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.md};

  ${respondTo('mobile')} {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

/**
 * Container for task cards with responsive grid layout
 */
export const TasksContainer = styled.div`
  ${flexColumn};
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;

  ${respondTo('tablet')} {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: ${({ theme }) => theme.spacing.lg};
  }

  ${respondTo('desktop')} {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
`;

/**
 * Individual task card with hover effects
 */
export const TaskCard = styled.div`
  background: white;
  border-radius: 6px;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.secondary};
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

/**
 * Badge indicating AI-recommended tasks
 */
export const AiRecommendationBadge = styled.div`
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textLight};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: 16px;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};

  svg {
    width: 14px;
    height: 14px;
  }
`;

/**
 * Container for schedule control buttons and filters
 */
export const ScheduleControls = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
  align-items: center;

  ${respondTo('mobile')} {
    width: 100%;
    justify-content: space-between;
  }
`;

/**
 * Task frequency indicator
 */
export const FrequencyIndicator = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

/**
 * Task status indicator with color variants
 */
export const StatusIndicator = styled.div<{ status: 'pending' | 'completed' | 'overdue' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${({ theme, status }) => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'overdue':
        return theme.colors.warning;
      default:
        return theme.colors.secondary;
    }
  }};
  margin-right: ${({ theme }) => theme.spacing.xs};
`;

/**
 * Task details section within card
 */
export const TaskDetails = styled.div`
  ${flexColumn};
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

/**
 * Container for task actions (complete, edit, delete)
 */
export const TaskActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.sm};
  border-top: 1px solid ${({ theme }) => theme.colors.secondary};
`;