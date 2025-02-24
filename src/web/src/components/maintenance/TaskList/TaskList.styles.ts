import styled from 'styled-components';
import { flexColumn, respondTo } from '../../styles/mixins';
import type { DefaultTheme } from '../../styles/theme';

/**
 * Main container for the task list with responsive layout
 */
export const TaskListContainer = styled.div`
  ${flexColumn}
  width: 100%;
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.components.card.base.borderRadius};
  box-shadow: ${({ theme }) => theme.components.card.base.boxShadow};
  overflow: hidden;

  ${respondTo('tablet')} {
    max-width: ${({ theme }) => theme.spacing.container.md};
    margin: 0 auto;
  }
`;

/**
 * Header component for the task list
 */
export const TaskHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  
  ${respondTo('mobile')} {
    padding: ${({ theme }) => theme.spacing.lg};
  }
`;

/**
 * Individual task item with hover states and transitions
 */
export const TaskItem = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.secondary};
  transition: background-color 0.2s ease-in-out;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.colors.secondary}10;
  }

  &:last-child {
    border-bottom: none;
  }

  ${respondTo('tablet')} {
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: ${({ theme }) => theme.spacing.md};
    padding: ${({ theme }) => theme.spacing.lg};
  }
`;

/**
 * Task content container with proper layout and spacing
 */
export const TaskContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};

  ${respondTo('mobile')} {
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

/**
 * Task name with proper typography
 */
export const TaskName = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text};
`;

/**
 * Task details with muted color
 */
export const TaskDetails = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/**
 * Task frequency indicator
 */
export const TaskFrequency = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};

  ${respondTo('tablet')} {
    justify-content: center;
  }
`;

/**
 * Task amount display
 */
export const TaskAmount = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text};

  ${respondTo('tablet')} {
    justify-content: center;
  }
`;

/**
 * Task time display
 */
export const TaskTime = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text};

  ${respondTo('tablet')} {
    justify-content: center;
  }
`;

/**
 * Add task button styles
 */
export const AddTaskButton = styled.button`
  ${({ theme }) => theme.components.button.base};
  ${({ theme }) => theme.components.button.variants.primary};
  margin: ${({ theme }) => theme.spacing.md};
  width: calc(100% - ${({ theme }) => theme.spacing.md} * 2);

  ${respondTo('tablet')} {
    width: auto;
    margin: ${({ theme }) => theme.spacing.lg};
  }
`;