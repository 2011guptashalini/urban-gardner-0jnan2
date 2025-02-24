import styled from 'styled-components';
import { flexCenter, flexColumn, respondTo } from '../../../styles/mixins';

// Constants for card transitions and shadows
const CARD_TRANSITION = 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out';
const CARD_SHADOW = '0 2px 8px rgba(0, 0, 0, 0.08)';
const CARD_SHADOW_HOVER = '0 4px 12px rgba(0, 0, 0, 0.12)';

export const CardContainer = styled.div`
  ${flexColumn}
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.text}20;
  border-radius: 8px;
  box-shadow: ${CARD_SHADOW};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.md};
  transition: ${CARD_TRANSITION};
  will-change: transform, box-shadow;
  width: 100%;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${CARD_SHADOW_HOVER};
  }

  ${respondTo('mobile')} {
    width: calc(50% - ${({ theme }) => theme.spacing.md});
  }

  ${respondTo('tablet')} {
    width: calc(33.33% - ${({ theme }) => theme.spacing.md});
  }

  ${respondTo('desktop')} {
    width: calc(25% - ${({ theme }) => theme.spacing.md});
  }
`;

export const CardHeader = styled.div`
  ${flexCenter}
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  padding-bottom: ${({ theme }) => theme.spacing.sm};
  border-bottom: 1px solid ${({ theme }) => theme.colors.text}10;

  h3 {
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
    font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
    margin: 0;
  }

  ${respondTo('mobile')} {
    h3 {
      font-size: ${({ theme }) => theme.typography.fontSize.xl};
    }
  }
`;

export const CardContent = styled.div`
  ${flexColumn}
  gap: ${({ theme }) => theme.spacing.xs};
  flex-grow: 1;

  p {
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.fontSize.md};
    line-height: ${({ theme }) => theme.typography.lineHeight.normal};
    margin: 0;
  }

  .dimension-text {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }

  .crop-count {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  }

  ${respondTo('tablet')} {
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

export const CardFooter = styled.div`
  ${flexCenter}
  justify-content: space-between;
  margin-top: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.sm};
  border-top: 1px solid ${({ theme }) => theme.colors.text}10;

  button {
    background: transparent;
    border: none;
    color: ${({ theme }) => theme.colors.primary};
    cursor: pointer;
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
    padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
    transition: color 0.2s ease-in-out;

    &:hover {
      color: ${({ theme }) => theme.colors.primaryDark};
    }

    &.warning {
      color: ${({ theme }) => theme.colors.warning};

      &:hover {
        color: ${({ theme }) => theme.colors.warning};
        opacity: 0.8;
      }
    }
  }
`;