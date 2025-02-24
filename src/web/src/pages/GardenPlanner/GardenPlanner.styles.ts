import styled from 'styled-components';
import { flexColumn, respondTo } from '../../styles/mixins';

/**
 * Main container for the garden planner page
 * Implements responsive layout with consistent spacing
 */
export const Container = styled.div`
  ${flexColumn};
  width: 100%;
  min-height: 100vh;
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.background};
  
  ${respondTo('tablet')} {
    padding: ${({ theme }) => theme.spacing.md};
  }
  
  ${respondTo('mobile')} {
    padding: ${({ theme }) => theme.spacing.sm};
  }
`;

/**
 * Form section containing garden space inputs
 * Uses CSS Grid for responsive layout
 */
export const FormSection = styled.section`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  
  ${respondTo('desktop')} {
    grid-template-columns: 1fr 1fr;
  }
`;

/**
 * Container for garden space visualization
 * Maintains fixed aspect ratio with themed background
 */
export const VisualizerSection = styled.section`
  width: 100%;
  min-height: 400px;
  background-color: ${({ theme }) => theme.colors.secondary};
  border-radius: 8px;
  padding: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};
  transition: all 0.2s ease-in-out;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

/**
 * Grid layout for dimension input fields
 * Collapses to single column on mobile
 */
export const InputGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  
  ${respondTo('mobile')} {
    grid-template-columns: 1fr;
  }
`;

/**
 * Container for growing conditions inputs
 * Uses flexbox for vertical layout
 */
export const ConditionsWrapper = styled.div`
  ${flexColumn};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.background};
`;

/**
 * Header section with title and actions
 */
export const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  
  ${respondTo('mobile')} {
    flex-direction: column;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

/**
 * Error message container with warning styling
 */
export const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.warning};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

/**
 * Success message container with success styling
 */
export const SuccessMessage = styled.div`
  color: ${({ theme }) => theme.colors.success};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

/**
 * Label wrapper for form inputs
 */
export const LabelWrapper = styled.label`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text};
`;

/**
 * Help text for input fields
 */
export const HelpText = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-top: ${({ theme }) => theme.spacing.xxs};
`;