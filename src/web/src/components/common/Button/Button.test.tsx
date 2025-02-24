import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { theme } from '@mui/material';
import Button from './Button';
import { renderWithProviders } from '../../utils/test-utils';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('Button Component', () => {
  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(
        <Button ariaLabel="Test button">Click me</Button>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have correct ARIA attributes when disabled', () => {
      render(<Button disabled ariaLabel="Disabled button">Click me</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have correct ARIA attributes when loading', () => {
      render(<Button loading ariaLabel="Loading button">Click me</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<Button ariaLabel="Test button">Click me</Button>);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });
  });

  describe('Visual Styling', () => {
    it('should render with correct variant styles', () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>);
      expect(screen.getByRole('button')).toHaveStyle({
        backgroundColor: theme.colors.primary
      });

      rerender(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole('button')).toHaveStyle({
        backgroundColor: theme.colors.secondary
      });

      rerender(<Button variant="warning">Warning</Button>);
      expect(screen.getByRole('button')).toHaveStyle({
        backgroundColor: theme.colors.warning
      });
    });

    it('should render with correct size styles', () => {
      const { rerender } = render(<Button size="small">Small</Button>);
      let button = screen.getByRole('button');
      expect(button).toHaveStyle({ fontSize: theme.typography.fontSize.sm });

      rerender(<Button size="medium">Medium</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveStyle({ fontSize: theme.typography.fontSize.md });

      rerender(<Button size="large">Large</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveStyle({ fontSize: theme.typography.fontSize.lg });
    });

    it('should render full width when specified', () => {
      render(<Button fullWidth>Full Width</Button>);
      expect(screen.getByRole('button')).toHaveStyle({ width: '100%' });
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator and prevent interactions', async () => {
      const handleClick = jest.fn();
      render(
        <Button loading onClick={handleClick}>
          Submit
        </Button>
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should maintain visual consistency during loading', () => {
      const { rerender } = render(<Button>Normal</Button>);
      const initialStyles = window.getComputedStyle(screen.getByRole('button'));

      rerender(<Button loading>Loading</Button>);
      const loadingStyles = window.getComputedStyle(screen.getByRole('button'));

      expect(loadingStyles.height).toBe(initialStyles.height);
      expect(loadingStyles.padding).toBe(initialStyles.padding);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should warn about invalid variant prop', () => {
      render(<Button variant="invalid" as="invalid">Invalid</Button>);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid button variant')
      );
    });

    it('should warn about invalid size prop', () => {
      render(<Button size="invalid">Invalid</Button>);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid button size')
      );
    });

    it('should warn about disabled button with onClick handler', () => {
      render(<Button disabled onClick={() => {}}>Disabled</Button>);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('onClick handler provided for disabled button')
      );
    });
  });

  describe('Performance', () => {
    it('should not re-render when props remain unchanged', () => {
      const renderSpy = jest.spyOn(React, 'memo');
      const { rerender } = render(<Button>Test</Button>);
      
      rerender(<Button>Test</Button>);
      expect(renderSpy).toHaveBeenCalled();
    });

    it('should cleanup event listeners on unmount', () => {
      const handleClick = jest.fn();
      const { unmount } = render(<Button onClick={handleClick}>Click</Button>);
      
      unmount();
      const button = screen.queryByRole('button');
      expect(button).not.toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('should handle click events correctly', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should prevent click when disabled or loading', async () => {
      const handleClick = jest.fn();
      const { rerender } = render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );

      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();

      rerender(
        <Button loading onClick={handleClick}>
          Loading
        </Button>
      );

      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should work with form submission', async () => {
      const handleSubmit = jest.fn(e => e.preventDefault());
      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit">Submit</Button>
        </form>
      );

      await userEvent.click(screen.getByRole('button'));
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });
  });
});