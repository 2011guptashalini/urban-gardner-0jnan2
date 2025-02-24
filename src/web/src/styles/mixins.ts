import { css } from 'styled-components';
import { breakpoints } from './variables';

/**
 * Type definitions for mixins
 */
type Breakpoint = keyof typeof breakpoints;
type TransitionProperty = 'all' | 'opacity' | 'transform' | 'background' | 'color';
type TransitionDuration = '150ms' | '300ms' | '500ms';

/**
 * Centers content using flexbox with consistent spacing
 * @returns Centered flexbox layout styles
 */
export const flexCenter = css`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

/**
 * Creates vertical flexbox layout with consistent spacing
 * @returns Vertical flexbox layout styles
 */
export const flexColumn = css`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  flex: 0 1 auto;
`;

/**
 * Responsive design mixin using predefined breakpoints
 * @param breakpoint - Target breakpoint (mobile | tablet | desktop)
 * @returns Media query styles for specified breakpoint
 */
export const respondTo = (breakpoint: Breakpoint) => css`
  @media (min-width: ${breakpoints[breakpoint]}px) {
    ${css`
      ${({ children }: { children: any }) => children}
    `}
  }
`;

/**
 * Text truncation with ellipsis
 * @returns Text truncation styles
 */
export const ellipsis = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
`;

/**
 * Smooth transitions with standardized timing
 * @param property - CSS property to transition
 * @param duration - Transition duration (default: 300ms)
 * @returns Transition styles
 */
export const transition = (
  property: TransitionProperty,
  duration: TransitionDuration = '300ms'
) => css`
  transition: ${property} ${duration} cubic-bezier(0.4, 0, 0.2, 1);
  -webkit-transition: ${property} ${duration} cubic-bezier(0.4, 0, 0.2, 1);
  -moz-transition: ${property} ${duration} cubic-bezier(0.4, 0, 0.2, 1);
`;

/**
 * Grid layout with responsive columns
 * @returns Responsive grid layout styles
 */
export const responsiveGrid = css`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.md};

  ${respondTo('mobile')} {
    grid-template-columns: repeat(2, 1fr);
  }

  ${respondTo('tablet')} {
    grid-template-columns: repeat(3, 1fr);
  }

  ${respondTo('desktop')} {
    grid-template-columns: repeat(4, 1fr);
  }
`;

/**
 * Card container with consistent elevation
 * @returns Card container styles
 */
export const cardContainer = css`
  background: ${({ theme }) => theme.colors.background};
  border-radius: 8px;
  padding: ${({ theme }) => theme.spacing.md};
  box-shadow: ${({ theme }) => theme.shadows.md};
  ${transition('transform')}

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

/**
 * Interactive element focus styles
 * @returns Focus state styles
 */
export const focusStyles = css`
  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  &:focus:not(:focus-visible) {
    outline: none;
  }
`;

/**
 * Hide element visually while keeping it accessible
 * @returns Visually hidden styles
 */
export const visuallyHidden = css`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;