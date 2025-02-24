import styled from 'styled-components';
import { colors, spacing, breakpoints } from '../../../styles/variables';

// Media query constants for responsive design
const mediaQueries = {
  mobile: `@media (max-width: ${breakpoints.mobile}px)`,
  tablet: `@media (max-width: ${breakpoints.tablet}px)`
};

// Main container for the crop list with responsive grid layout
export const CropListContainer = styled.div`
  display: grid;
  gap: ${spacing.lg};
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  padding: ${spacing.md};
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;

  ${mediaQueries.tablet} {
    grid-template-columns: repeat(2, 1fr);
    gap: ${spacing.md};
  }

  ${mediaQueries.mobile} {
    grid-template-columns: 1fr;
    padding: ${spacing.md} ${spacing.sm};
  }
`;

// Individual crop card with elevation and hover effects
export const CropCard = styled.div`
  background: ${colors.background};
  padding: ${spacing.lg};
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:focus-within {
    outline: 2px solid ${colors.primary};
    outline-offset: 2px;
  }

  ${mediaQueries.mobile} {
    padding: ${spacing.md};
  }
`;

// Container for crop details with proper spacing
export const CropDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.md};
  align-items: flex-start;

  /* Support for RTL languages */
  [dir='rtl'] & {
    align-items: flex-end;
  }
`;

// Yield information display with proper visibility
export const YieldDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
  font-size: 1.1rem;
  color: ${colors.primary};
  font-weight: 500;

  /* Ensure proper contrast ratio for accessibility */
  @media (prefers-contrast: more) {
    color: ${colors.primaryDark};
  }
`;

// Warning text for space capacity issues
export const WarningText = styled.p`
  color: ${colors.warning};
  font-weight: 600;
  font-size: 0.9rem;
  padding: ${spacing.sm} 0;
  margin: 0;

  /* High contrast mode support */
  @media (prefers-contrast: more) {
    text-decoration: underline;
  }

  /* Reduced motion preference support */
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

// Remove button styling
export const RemoveButton = styled.button`
  background: transparent;
  border: 1px solid ${colors.warning};
  color: ${colors.warning};
  padding: ${spacing.sm} ${spacing.md};
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${colors.warning};
    color: white;
  }

  &:focus {
    outline: 2px solid ${colors.warning};
    outline-offset: 2px;
  }

  /* Ensure proper touch target size for mobile */
  ${mediaQueries.mobile} {
    padding: ${spacing.md};
  }
`;

// Quantity adjustment container
export const QuantityContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
  margin-top: ${spacing.md};

  /* Support for RTL languages */
  [dir='rtl'] & {
    flex-direction: row-reverse;
  }
`;

// Grow bag information container
export const GrowBagInfo = styled.div`
  background-color: rgba(46, 125, 50, 0.1);
  padding: ${spacing.sm} ${spacing.md};
  border-radius: 4px;
  font-size: 0.9rem;
  color: ${colors.primary};
  margin-top: ${spacing.sm};

  /* High contrast mode support */
  @media (prefers-contrast: more) {
    border: 1px solid ${colors.primary};
  }
`;