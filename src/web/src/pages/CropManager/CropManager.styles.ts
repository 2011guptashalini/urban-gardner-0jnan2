import styled from '@emotion/styled';
import { flexCenter, flexColumn, respondTo } from '../../styles/mixins';
import { colors, spacing } from '../../styles/variables';

/**
 * Main container for the CropManager page
 * Implements full-height layout with consistent padding and background
 */
export const Container = styled.div`
  ${flexColumn};
  min-height: 100vh;
  width: 100%;
  padding: ${spacing.lg};
  background-color: ${colors.background};
  gap: ${spacing.lg};
`;

/**
 * Header section with centered content and bottom margin
 * Contains page title and action buttons
 */
export const Header = styled.div`
  ${flexCenter};
  width: 100%;
  margin-bottom: ${spacing.lg};
  padding: ${spacing.md};
  border-bottom: 1px solid ${colors.primary}20;
`;

/**
 * Main content area with responsive grid layout
 * Adapts from single to dual-column based on screen size
 */
export const Content = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${spacing.lg};
  width: 100%;
  
  ${respondTo('tablet')} {
    grid-template-columns: 3fr 2fr;
  }
`;

/**
 * Section for displaying the list of crops
 * Implements vertical layout with consistent spacing
 */
export const CropListSection = styled.section`
  ${flexColumn};
  background-color: ${colors.background};
  border-radius: 8px;
  padding: ${spacing.lg};
  min-height: 400px;
  box-shadow: 0 2px 4px ${colors.primary}10;
`;

/**
 * Section for yield calculations and statistics
 * Features themed background and elevated appearance
 */
export const YieldSection = styled.section`
  ${flexColumn};
  background-color: ${colors.background};
  border-radius: 8px;
  padding: ${spacing.lg};
  border: 1px solid ${colors.primary}20;
  min-height: 300px;
`;

/**
 * Container for action buttons
 * Implements horizontal layout with consistent spacing
 */
export const ActionBar = styled.div`
  ${flexCenter};
  justify-content: flex-end;
  padding: ${spacing.md} 0;
  gap: ${spacing.md};
`;

/**
 * Container for crop cards with grid layout
 * Implements responsive grid for crop items
 */
export const CropGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${spacing.md};
  
  ${respondTo('mobile')} {
    grid-template-columns: repeat(2, 1fr);
  }
  
  ${respondTo('tablet')} {
    grid-template-columns: repeat(2, 1fr);
  }
  
  ${respondTo('desktop')} {
    grid-template-columns: repeat(3, 1fr);
  }
`;

/**
 * Container for yield calculation results
 * Features distinct background and padding
 */
export const YieldResults = styled.div`
  ${flexColumn};
  background-color: ${colors.primary}08;
  border-radius: 4px;
  padding: ${spacing.md};
  margin-top: ${spacing.md};
`;

/**
 * Status indicator container
 * Displays capacity and warning indicators
 */
export const StatusIndicator = styled.div`
  ${flexCenter};
  justify-content: space-between;
  padding: ${spacing.md};
  background-color: ${colors.background};
  border-radius: 4px;
  border: 1px solid ${colors.primary}20;
`;