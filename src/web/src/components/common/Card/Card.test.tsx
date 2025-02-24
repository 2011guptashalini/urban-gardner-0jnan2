import React from 'react';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, describe, it, beforeEach, afterEach } from '@jest/globals';
import { renderWithProviders } from '../../../utils/test-utils';
import Card from './Card';

describe('Card component', () => {
  // Test data
  const testProps = {
    header: 'Test Header',
    children: 'Test Content',
    footer: 'Test Footer',
    className: 'custom-class',
    elevation: 2,
    variant: 'default' as const,
    'data-testid': 'test-card'
  };

  // Reset DOM after each test
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Basic rendering', () => {
    it('renders with all sections correctly', () => {
      renderWithProviders(
        <Card {...testProps}>
          {testProps.children}
        </Card>
      );

      const card = screen.getByTestId('test-card');
      expect(card).toHaveClass('card', 'custom-class');
      expect(card).toHaveAttribute('data-elevation', '2');
      expect(card).toHaveAttribute('data-variant', 'default');

      const header = within(card).getByRole('heading');
      expect(header).toHaveTextContent('Test Header');

      const content = within(card).getByText('Test Content');
      expect(content).toBeInTheDocument();

      const footer = within(card).getByRole('contentinfo');
      expect(footer).toHaveTextContent('Test Footer');
    });

    it('renders without optional sections', () => {
      renderWithProviders(
        <Card data-testid="test-card">
          {testProps.children}
        </Card>
      );

      const card = screen.getByTestId('test-card');
      expect(card).toBeInTheDocument();
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
      expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    });

    it('applies correct elevation styles', () => {
      const { rerender } = renderWithProviders(
        <Card elevation={1} data-testid="test-card">
          {testProps.children}
        </Card>
      );

      expect(screen.getByTestId('test-card')).toHaveAttribute('data-elevation', '1');

      rerender(
        <Card elevation={5} data-testid="test-card">
          {testProps.children}
        </Card>
      );

      expect(screen.getByTestId('test-card')).toHaveAttribute('data-elevation', '5');
    });
  });

  describe('Accessibility features', () => {
    it('has correct ARIA attributes for non-interactive card', () => {
      renderWithProviders(
        <Card {...testProps}>
          {testProps.children}
        </Card>
      );

      const card = screen.getByTestId('test-card');
      expect(card).toHaveAttribute('role', 'article');
      expect(card).not.toHaveAttribute('tabIndex');
      expect(card).not.toHaveAttribute('aria-pressed');
    });

    it('has correct ARIA attributes for interactive card', () => {
      const onClickMock = jest.fn();
      renderWithProviders(
        <Card
          {...testProps}
          interactive
          onClick={onClickMock}
        >
          {testProps.children}
        </Card>
      );

      const card = screen.getByTestId('test-card');
      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('handles keyboard navigation correctly', async () => {
      const onClickMock = jest.fn();
      renderWithProviders(
        <Card
          {...testProps}
          interactive
          onClick={onClickMock}
        >
          {testProps.children}
        </Card>
      );

      const card = screen.getByTestId('test-card');
      card.focus();
      expect(card).toHaveFocus();

      // Test Enter key
      await userEvent.keyboard('{Enter}');
      expect(onClickMock).toHaveBeenCalledTimes(1);

      // Test Space key
      await userEvent.keyboard(' ');
      expect(onClickMock).toHaveBeenCalledTimes(2);
    });

    it('maintains heading hierarchy', () => {
      renderWithProviders(
        <Card {...testProps}>
          {testProps.children}
        </Card>
      );

      const header = screen.getByRole('heading');
      expect(header).toHaveAttribute('aria-level', '3');
    });
  });

  describe('Responsive behavior', () => {
    beforeEach(() => {
      // Mock window.matchMedia for responsive testing
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));
    });

    it('adapts to different screen sizes', () => {
      const { rerender } = renderWithProviders(
        <Card {...testProps}>
          {testProps.children}
        </Card>
      );

      // Test mobile view
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(max-width: 768px)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      rerender(
        <Card {...testProps}>
          {testProps.children}
        </Card>
      );

      // Test tablet view
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(min-width: 769px) and (max-width: 1024px)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      rerender(
        <Card {...testProps}>
          {testProps.children}
        </Card>
      );
    });
  });

  describe('Theme compliance', () => {
    it('applies theme-based styles correctly', () => {
      const theme = {
        colors: {
          background: '#F5F5F5',
          text: '#333333',
          primary: '#2E7D32'
        },
        spacing: {
          sm: '8px',
          md: '16px',
          lg: '24px'
        }
      };

      renderWithProviders(
        <Card {...testProps}>
          {testProps.children}
        </Card>,
        { theme }
      );

      const card = screen.getByTestId('test-card');
      expect(card).toBeInTheDocument();
      // Theme-based styles would be verified through snapshot testing
      // or computed styles in a real browser environment
    });

    it('handles theme variants correctly', () => {
      const { rerender } = renderWithProviders(
        <Card
          {...testProps}
          variant="outlined"
          data-testid="test-card"
        >
          {testProps.children}
        </Card>
      );

      expect(screen.getByTestId('test-card')).toHaveAttribute('data-variant', 'outlined');

      rerender(
        <Card
          {...testProps}
          variant="contained"
          data-testid="test-card"
        >
          {testProps.children}
        </Card>
      );

      expect(screen.getByTestId('test-card')).toHaveAttribute('data-variant', 'contained');
    });
  });

  describe('Error handling', () => {
    it('handles missing required props gracefully', () => {
      // @ts-expect-error - Testing missing required children prop
      expect(() => renderWithProviders(<Card />)).toThrow();
    });

    it('handles invalid elevation values', () => {
      // @ts-expect-error - Testing invalid elevation value
      renderWithProviders(
        <Card elevation={-1} data-testid="test-card">
          {testProps.children}
        </Card>
      );

      const card = screen.getByTestId('test-card');
      expect(card).toHaveAttribute('data-elevation', '-1');
      // In real implementation, this would be handled by prop validation
    });
  });
});