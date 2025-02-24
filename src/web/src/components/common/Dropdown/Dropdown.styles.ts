import styled from 'styled-components';
import { colors, typography, spacing, zIndex } from '../../styles/variables';
import { flexColumn, transition } from '../../styles/mixins';

// Animation keyframes for dropdown menu
const dropdownAnimation = css`
  opacity: 0;
  transform: translateY(-10px);
  will-change: opacity, transform;
  ${transition('all', '300ms')}

  &.open {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Main container for the dropdown component
export const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
  width: fit-content;
`;

// Styled button that triggers the dropdown
export const DropdownTrigger = styled.button`
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
  padding: ${spacing.sm} ${spacing.md};
  background: ${colors.background};
  border: 1px solid ${colors.text}20;
  border-radius: 4px;
  color: ${colors.text};
  font-size: ${typography.fontSize.md};
  font-weight: ${typography.fontWeight.regular};
  cursor: pointer;
  ${transition('all')}

  &:hover {
    background: ${colors.background}E6;
    border-color: ${colors.text}40;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${colors.primary}40;
  }

  &[aria-expanded="true"] {
    background: ${colors.background}E6;
    border-color: ${colors.primary};
  }

  svg {
    width: 16px;
    height: 16px;
    transition: transform 0.2s ease;

    &.open {
      transform: rotate(180deg);
    }
  }
`;

// Dropdown menu container
export const DropdownMenu = styled.ul`
  ${flexColumn}
  position: absolute;
  top: calc(100% + ${spacing.xs});
  left: 0;
  min-width: 200px;
  padding: ${spacing.xs} 0;
  margin: 0;
  list-style: none;
  background: ${colors.background};
  border: 1px solid ${colors.text}20;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: ${zIndex.dropdown};
  ${dropdownAnimation}

  &:focus {
    outline: none;
  }

  /* Ensure the dropdown is contained within the viewport */
  &.right-aligned {
    left: auto;
    right: 0;
  }

  /* Add a subtle arrow at the top of the dropdown */
  &::before {
    content: '';
    position: absolute;
    top: -5px;
    left: 20px;
    width: 10px;
    height: 10px;
    background: ${colors.background};
    border-left: 1px solid ${colors.text}20;
    border-top: 1px solid ${colors.text}20;
    transform: rotate(45deg);
  }

  &.right-aligned::before {
    left: auto;
    right: 20px;
  }
`;

// Individual dropdown menu items
export const DropdownItem = styled.li`
  padding: ${spacing.sm} ${spacing.md};
  color: ${colors.text};
  font-size: ${typography.fontSize.sm};
  cursor: pointer;
  ${transition('background')}

  &:hover {
    background: ${colors.text}0A;
  }

  &:focus {
    outline: none;
    background: ${colors.text}14;
  }

  &.active {
    background: ${colors.primary}14;
    color: ${colors.primary};
    font-weight: ${typography.fontWeight.medium};
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  /* Add divider between groups of items */
  &.divider {
    height: 1px;
    margin: ${spacing.xs} 0;
    padding: 0;
    background: ${colors.text}14;
    pointer-events: none;
  }
`;