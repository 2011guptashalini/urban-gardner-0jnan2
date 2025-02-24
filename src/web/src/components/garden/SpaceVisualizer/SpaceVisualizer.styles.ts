import styled from 'styled-components';
import { DefaultTheme } from 'styled-components';
import { flexCenter, respondTo } from '../../../styles/mixins';

// Scale factor for responsive grow bag sizing
const SCALE_FACTOR = 10;

// Standard transition duration for smooth animations
const TRANSITION_DURATION = '0.3s';

/**
 * Helper function to calculate grow bag size with responsive scaling
 * @param bagSize - Size of the grow bag in inches
 * @param screenWidth - Current screen width
 * @returns Calculated size in pixels with responsive scaling
 */
const getGrowBagSize = (bagSize: string, screenWidth: number): string => {
  const numericSize = parseInt(bagSize, 10);
  const baseSize = numericSize * SCALE_FACTOR;
  
  // Apply responsive scaling based on screen width
  if (screenWidth <= 768) return `${baseSize * 0.6}px`;
  if (screenWidth <= 1024) return `${baseSize * 0.8}px`;
  return `${baseSize}px`;
};

/**
 * Main container for the garden space visualization
 * Implements responsive scaling and smooth transitions
 */
export const VisualizerContainer = styled.div`
  ${flexCenter}
  position: relative;
  width: 100%;
  min-height: 400px;
  background-color: ${({ theme }) => theme.colors.background};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: 8px;
  padding: ${({ theme }) => theme.spacing.lg};
  margin: ${({ theme }) => theme.spacing.md} 0;
  overflow: hidden;
  transition: all ${TRANSITION_DURATION} ease-in-out;
  box-shadow: ${({ theme }) => theme.shadows.md};

  ${respondTo('tablet')} {
    min-height: 500px;
  }

  ${respondTo('desktop')} {
    min-height: 600px;
  }

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

/**
 * Container for individual grow bags with interactive effects
 * Implements depth perception and accessibility features
 */
export const GrowBagContainer = styled.div<{
  size: string;
  isSelected?: boolean;
  theme: DefaultTheme;
}>`
  ${flexCenter}
  position: relative;
  width: ${props => getGrowBagSize(props.size, window.innerWidth)};
  height: ${props => getGrowBagSize(props.size, window.innerWidth)};
  background-color: ${({ theme }) => theme.colors.secondary};
  border-radius: 8px;
  margin: ${({ theme }) => theme.spacing.sm};
  cursor: pointer;
  transition: all ${TRANSITION_DURATION} ease-in-out;
  transform-origin: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);

  ${({ isSelected, theme }) => isSelected && `
    border: 2px solid ${theme.colors.primary};
    transform: scale(1.05);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  `}

  &:hover {
    transform: scale(1.05) translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  /* Ensure proper contrast for accessibility */
  @media (prefers-contrast: more) {
    border: 2px solid ${({ theme }) => theme.colors.text};
  }
`;

/**
 * Label component for crop information
 * Implements responsive text sizing and contrast
 */
export const CropLabel = styled.span`
  position: absolute;
  bottom: -${({ theme }) => theme.spacing.md};
  left: 50%;
  transform: translateX(-50%);
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textLight};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: 4px;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
  z-index: 1;
  transition: all ${TRANSITION_DURATION} ease-in-out;

  ${respondTo('tablet')} {
    font-size: ${({ theme }) => theme.typography.fontSize.md};
    max-width: 150px;
  }

  /* High contrast mode support */
  @media (prefers-contrast: more) {
    background-color: ${({ theme }) => theme.colors.text};
    border: 1px solid ${({ theme }) => theme.colors.textLight};
  }
`;

/**
 * Grid layout for organizing grow bags
 * Implements responsive grid sizing
 */
export const GrowBagGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};

  ${respondTo('tablet')} {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  ${respondTo('desktop')} {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
`;