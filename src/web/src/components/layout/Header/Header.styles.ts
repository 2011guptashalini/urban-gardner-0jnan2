import styled from '@emotion/styled';
import { colors, spacing, typography, zIndex } from '../../styles/variables';
import { flexCenter, respondTo } from '../../styles/mixins';

/**
 * Main header container with enhanced sticky positioning and responsive layout
 * @version 1.0.0
 */
export const HeaderContainer = styled.header`
  position: sticky;
  top: 0;
  width: 100%;
  height: 64px;
  background-color: ${colors.primary};
  color: ${colors.textLight};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: ${zIndex.header};
  padding: 0 ${spacing.md};
  will-change: transform;
  contain: layout style paint;
  
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  transition: background-color 300ms ease-in-out,
              box-shadow 300ms ease-in-out;

  ${respondTo('mobile')} {
    padding: 0 ${spacing.lg};
    height: 72px;
  }

  ${respondTo('tablet')} {
    padding: 0 ${spacing.xl};
    height: 80px;
  }
`;

/**
 * Logo container with responsive sizing and hover effects
 */
export const Logo = styled.div`
  ${flexCenter};
  font-size: ${typography.fontSize.lg};
  font-weight: ${typography.fontWeight.bold};
  cursor: pointer;
  
  img {
    height: 32px;
    margin-right: ${spacing.sm};
    
    ${respondTo('tablet')} {
      height: 40px;
    }
  }

  span {
    display: none;
    
    ${respondTo('tablet')} {
      display: inline;
      white-space: nowrap;
    }
  }

  transition: transform 200ms ease-in-out;
  
  &:hover {
    transform: scale(1.02);
  }
`;

/**
 * Navigation container with responsive layout and mobile menu support
 */
export const Navigation = styled.nav`
  display: none;
  
  ${respondTo('tablet')} {
    ${flexCenter};
    gap: ${spacing.lg};
  }

  a {
    color: ${colors.textLight};
    text-decoration: none;
    font-size: ${typography.fontSize.md};
    font-weight: ${typography.fontWeight.medium};
    padding: ${spacing.xs} ${spacing.sm};
    border-radius: 4px;
    transition: background-color 200ms ease-in-out,
                transform 200ms ease-in-out;

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
      transform: translateY(-1px);
    }

    &.active {
      background-color: rgba(255, 255, 255, 0.2);
    }
  }
`;

/**
 * Profile section with enhanced interactivity and responsive layout
 */
export const ProfileSection = styled.div`
  ${flexCenter};
  gap: ${spacing.md};

  .profile-button {
    ${flexCenter};
    background: transparent;
    border: none;
    color: ${colors.textLight};
    cursor: pointer;
    padding: ${spacing.xs} ${spacing.sm};
    border-radius: 4px;
    transition: background-color 200ms ease-in-out;

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    img {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      margin-right: ${spacing.xs};
    }

    span {
      display: none;
      
      ${respondTo('tablet')} {
        display: inline;
        font-size: ${typography.fontSize.md};
        font-weight: ${typography.fontWeight.medium};
      }
    }
  }

  .settings-button {
    ${flexCenter};
    background: transparent;
    border: none;
    color: ${colors.textLight};
    cursor: pointer;
    padding: ${spacing.xs};
    border-radius: 50%;
    transition: background-color 200ms ease-in-out,
                transform 200ms ease-in-out;

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
      transform: scale(1.05);
    }

    svg {
      width: 24px;
      height: 24px;
    }
  }
`;

/**
 * Mobile menu button for responsive navigation
 */
export const MobileMenuButton = styled.button`
  ${flexCenter};
  display: block;
  background: transparent;
  border: none;
  color: ${colors.textLight};
  cursor: pointer;
  padding: ${spacing.xs};
  margin-left: ${spacing.sm};
  border-radius: 4px;
  transition: background-color 200ms ease-in-out;

  ${respondTo('tablet')} {
    display: none;
  }

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;