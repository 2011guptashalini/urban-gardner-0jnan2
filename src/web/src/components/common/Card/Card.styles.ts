import styled from 'styled-components';
import { colors, spacing } from '../../styles/variables';
import { flexColumn, respondTo } from '../../styles/mixins';

/**
 * Main card container component with base styling and hover effects
 * Implements responsive design and accessibility features
 */
export const CardWrapper = styled.div`
  ${flexColumn}
  background: ${colors.background};
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
  margin-bottom: ${spacing.md};
  overflow: hidden;
  width: 100%;

  /* Responsive padding adjustments */
  padding: ${spacing.sm};
  ${respondTo('tablet')} {
    padding: ${spacing.md};
  }
  ${respondTo('desktop')} {
    padding: ${spacing.lg};
  }

  /* Hover effects */
  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  /* Focus styles for accessibility */
  &:focus-within {
    outline: 2px solid ${colors.primary};
    outline-offset: 2px;
  }
`;

/**
 * Card header section with title styling and bottom border
 */
export const CardHeader = styled.div`
  border-bottom: 1px solid ${colors.secondary};
  margin-bottom: ${spacing.md};
  padding-bottom: ${spacing.sm};
  color: ${colors.text};
  font-weight: 500;

  /* Responsive text alignment */
  ${respondTo('mobile')} {
    text-align: left;
  }
`;

/**
 * Card content section with flexible content area
 */
export const CardContent = styled.div`
  color: ${colors.text};
  min-height: 50px;
  flex: 1;

  /* Responsive spacing */
  padding: ${spacing.sm} 0;
  ${respondTo('tablet')} {
    padding: ${spacing.md} 0;
  }
`;

/**
 * Card footer section with action buttons layout
 */
export const CardFooter = styled.div`
  border-top: 1px solid ${colors.secondary};
  margin-top: ${spacing.md};
  padding-top: ${spacing.sm};
  display: flex;
  justify-content: flex-end;
  gap: ${spacing.sm};

  /* Responsive button layout */
  ${respondTo('mobile')} {
    flex-direction: column;
  }
  ${respondTo('tablet')} {
    flex-direction: row;
  }
`;