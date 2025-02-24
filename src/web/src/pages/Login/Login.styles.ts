import styled from 'styled-components';
import { flexCenter, flexColumn, respondTo } from '../../styles/mixins';
import { colors, spacing } from '../../styles/variables';

/**
 * Main container for the login page
 * Provides full-height centered layout with themed background
 */
export const LoginContainer = styled.div`
  ${flexCenter}
  min-height: 100vh;
  background-color: ${colors.background};
  padding: ${spacing.xl};

  ${respondTo('mobile')`
    padding: ${spacing.lg};
  `}
`;

/**
 * Card component containing the login form
 * Provides elevation and responsive width constraints
 */
export const LoginCard = styled.div`
  ${flexColumn}
  background: white;
  border-radius: 8px;
  padding: ${spacing.lg};
  width: 100%;
  max-width: 400px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  ${respondTo('mobile')`
    max-width: 100%;
  `}
`;

/**
 * Form element with vertical layout and consistent spacing
 * Contains input fields and submission button
 */
export const LoginForm = styled.form`
  ${flexColumn}
  gap: ${spacing.lg};
  width: 100%;
`;

/**
 * Header section of login card
 * Contains title and optional description
 */
export const LoginHeader = styled.div`
  text-align: center;
  margin-bottom: ${spacing.lg};
  color: ${colors.primary};
`;

/**
 * Footer section of login card
 * Contains additional links or information
 */
export const LoginFooter = styled.div`
  text-align: center;
  margin-top: ${spacing.lg};
  color: ${colors.primary};
`;