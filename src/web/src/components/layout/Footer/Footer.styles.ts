import styled from 'styled-components';
import { colors, typography, spacing } from '../../styles/variables';
import { flexCenter, respondTo } from '../../styles/mixins';

/**
 * Main footer container component
 * Implements responsive layout and consistent styling
 */
export const FooterContainer = styled.footer`
  width: 100%;
  background-color: ${colors.background};
  padding: ${spacing.lg} 0;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  margin-top: auto;
  
  ${respondTo('tablet')} {
    padding: ${spacing.xl} 0;
  }
`;

/**
 * Content wrapper for footer elements
 * Centers content and maintains consistent max-width
 */
export const FooterContent = styled.div`
  ${flexCenter};
  flex-direction: column;
  max-width: ${spacing.container.lg};
  margin: 0 auto;
  padding: 0 ${spacing.md};
  
  ${respondTo('tablet')} {
    flex-direction: row;
    justify-content: space-between;
    padding: 0 ${spacing.lg};
  }
`;

/**
 * Navigation links container
 * Implements responsive layout and hover interactions
 */
export const FooterLinks = styled.nav`
  ${flexCenter};
  flex-wrap: wrap;
  gap: ${spacing.md};
  margin-bottom: ${spacing.md};

  a {
    color: ${colors.text};
    font-family: ${typography.fontFamily};
    font-size: ${typography.fontSize.sm};
    text-decoration: none;
    transition: color 0.2s ease-in-out;

    &:hover {
      color: ${colors.primary};
    }
  }

  ${respondTo('tablet')} {
    margin-bottom: 0;
    gap: ${spacing.lg};

    a {
      font-size: ${typography.fontSize.md};
    }
  }
`;

/**
 * Copyright text component
 * Implements responsive typography and proper contrast
 */
export const Copyright = styled.p`
  color: ${colors.textMuted};
  font-family: ${typography.fontFamily};
  font-size: ${typography.fontSize.xs};
  line-height: ${typography.lineHeight.normal};
  text-align: center;
  margin: 0;

  ${respondTo('tablet')} {
    text-align: right;
    font-size: ${typography.fontSize.sm};
  }
`;

/**
 * Social media links container
 * Implements consistent spacing and hover effects
 */
export const SocialLinks = styled.div`
  ${flexCenter};
  gap: ${spacing.md};

  a {
    color: ${colors.text};
    transition: color 0.2s ease-in-out;

    &:hover {
      color: ${colors.primary};
    }
  }
`;

/**
 * Logo container within footer
 * Maintains consistent sizing and spacing
 */
export const FooterLogo = styled.div`
  img {
    height: 40px;
    width: auto;
  }

  ${respondTo('tablet')} {
    margin-right: ${spacing.xl};
  }
`;