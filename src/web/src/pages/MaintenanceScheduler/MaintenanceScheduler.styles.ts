import styled from 'styled-components';
import { flexColumn, respondTo } from '../../styles/mixins';
import { colors, spacing, breakpoints } from '../../styles/theme';

export const Container = styled.div`
  ${flexColumn}
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.background};
  min-height: 100vh;
  width: 100%;
  max-width: ${({ theme }) => theme.spacing.container.lg};
  margin: 0 auto;

  ${respondTo('mobile')} {
    padding: ${({ theme }) => theme.spacing.md};
  }
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  h1 {
    font-size: ${({ theme }) => theme.typography.fontSize.h2};
    color: ${({ theme }) => theme.colors.text};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }

  .help-icon {
    color: ${({ theme }) => theme.colors.primary};
    cursor: pointer;
    transition: transform 0.2s ease-in-out;

    &:hover {
      transform: scale(1.1);
    }
  }
`;

export const Content = styled.div`
  ${flexColumn}
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 8px;
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

export const ScheduleTypeContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  label {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.sm};
    cursor: pointer;
    padding: ${({ theme }) => theme.spacing.sm};
    border-radius: 4px;
    transition: background-color 0.2s ease-in-out;

    &:hover {
      background-color: ${({ theme }) => theme.colors.secondary}20;
    }

    input[type="radio"] {
      appearance: none;
      width: 20px;
      height: 20px;
      border: 2px solid ${({ theme }) => theme.colors.primary};
      border-radius: 50%;
      margin: 0;
      position: relative;

      &:checked::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 12px;
        height: 12px;
        background-color: ${({ theme }) => theme.colors.primary};
        border-radius: 50%;
      }
    }
  }

  ${respondTo('mobile')} {
    flex-direction: column;
  }
`;

export const TaskGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};

  ${respondTo('tablet')} {
    grid-template-columns: repeat(2, 1fr);
  }

  ${respondTo('mobile')} {
    grid-template-columns: 1fr;
  }
`;

export const TaskItem = styled.div`
  ${flexColumn}
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.text}20;
  border-radius: 4px;
  transition: all 0.2s ease-in-out;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }

  .task-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${({ theme }) => theme.spacing.sm};

    h3 {
      font-size: ${({ theme }) => theme.typography.fontSize.lg};
      color: ${({ theme }) => theme.colors.text};
      margin: 0;
    }
  }

  .task-details {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: ${({ theme }) => theme.spacing.sm};
    align-items: center;

    span {
      color: ${({ theme }) => theme.colors.textMuted};
    }
  }
`;

export const ValidationMessage = styled.div<{ type: 'error' | 'success' }>`
  color: ${({ theme, type }) => 
    type === 'error' ? theme.colors.warning : theme.colors.success};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.xl};
  gap: ${({ theme }) => theme.spacing.md};

  button {
    min-width: 120px;
  }

  ${respondTo('mobile')} {
    flex-direction: column;
    width: 100%;

    button {
      width: 100%;
    }
  }
`;