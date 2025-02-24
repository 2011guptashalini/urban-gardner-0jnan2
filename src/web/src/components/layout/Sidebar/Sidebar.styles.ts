import styled from 'styled-components';
import { colors, spacing, typography } from '../../styles/variables';
import { flexColumn, respondTo } from '../../styles/mixins';

/**
 * Main sidebar container with responsive behavior
 * Transforms between side and bottom navigation based on viewport size
 */
export const SidebarContainer = styled.aside`
  ${flexColumn}
  width: 280px;
  height: 100vh;
  position: fixed;
  background: ${colors.background};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: ${spacing.md};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  left: 0;
  top: 0;
  transform: translateX(0);
  will-change: transform;

  /* Tablet breakpoint */
  ${respondTo('tablet')} {
    &[data-collapsed="true"] {
      transform: translateX(-280px);
    }
  }

  /* Mobile breakpoint */
  ${respondTo('mobile')} {
    width: 100%;
    height: auto;
    bottom: 0;
    top: auto;
    left: 0;
    transform: translateY(0);
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    padding: ${spacing.sm} ${spacing.md};

    &[data-collapsed="true"] {
      transform: translateY(100%);
    }
  }
`;

/**
 * Navigation menu container with flexible layout
 * Adjusts between vertical and horizontal based on viewport
 */
export const SidebarNav = styled.nav`
  ${flexColumn}
  width: 100%;
  height: 100%;
  gap: ${spacing.md};

  /* Mobile breakpoint */
  ${respondTo('mobile')} {
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    height: 64px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

/**
 * Interactive navigation item with accessibility features
 * Includes hover states and touch feedback
 */
export const SidebarItem = styled.a`
  display: flex;
  align-items: center;
  gap: ${spacing.md};
  padding: ${spacing.md};
  color: ${colors.primary};
  font-size: ${typography.fontSize.md};
  text-decoration: none;
  border-radius: 8px;
  min-height: 48px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    background-color: rgba(46, 125, 50, 0.08);
  }

  &:active {
    background-color: rgba(46, 125, 50, 0.12);
  }

  &:focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: -2px;
  }

  &[aria-current="page"] {
    background-color: rgba(46, 125, 50, 0.12);
    font-weight: ${typography.fontWeight.medium};
  }

  /* Mobile breakpoint */
  ${respondTo('mobile')} {
    flex-direction: column;
    padding: ${spacing.sm};
    gap: ${spacing.xs};
    font-size: ${typography.fontSize.sm};
    min-width: 72px;
    justify-content: center;
    text-align: center;
  }
`;

/**
 * Icon container within sidebar items
 * Ensures consistent icon sizing and alignment
 */
export const SidebarIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;

  /* Mobile breakpoint */
  ${respondTo('mobile')} {
    width: 28px;
    height: 28px;
  }
`;

/**
 * Text label for sidebar items
 * Handles text truncation and responsive visibility
 */
export const SidebarLabel = styled.span`
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  /* Mobile breakpoint */
  ${respondTo('mobile')} {
    font-size: ${typography.fontSize.xs};
    max-width: 100%;
  }
`;