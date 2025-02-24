import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axe from '@axe-core/react';
import Tooltip from './Tooltip';
import { renderWithProviders } from '../../../utils/test-utils';

// Mock ResizeObserver
const mockResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock ReactDOM portal
const mockCreatePortal = jest.fn((element, container) => {
  return element;
});

// Setup mocks
beforeEach(() => {
  window.ResizeObserver = mockResizeObserver;
  jest.spyOn(React, 'createPortal').mockImplementation(mockCreatePortal);
  
  // Mock viewport dimensions
  Object.defineProperty(window, 'innerWidth', { value: 1024 });
  Object.defineProperty(window, 'innerHeight', { value: 768 });
});

// Cleanup mocks
afterEach(() => {
  jest.clearAllMocks();
});

describe('Tooltip Component', () => {
  // Basic Rendering Tests
  describe('Rendering', () => {
    it('renders tooltip trigger element correctly', () => {
      renderWithProviders(
        <Tooltip content="Test tooltip" placement="top">
          <button>Hover me</button>
        </Tooltip>
      );
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('applies custom className to tooltip container', () => {
      renderWithProviders(
        <Tooltip content="Test tooltip" placement="top" className="custom-tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      
      const tooltipPortal = screen.getByTestId('tooltip-portal');
      expect(tooltipPortal.firstChild).toHaveClass('custom-tooltip');
    });

    it('generates unique tooltip ID if not provided', () => {
      renderWithProviders(
        <Tooltip content="Test tooltip" placement="top">
          <button>Hover me</button>
        </Tooltip>
      );
      
      const trigger = screen.getByRole('button');
      expect(trigger.getAttribute('aria-describedby')).toMatch(/tooltip-[a-z0-9]+/);
    });
  });

  // Interaction Tests
  describe('Interactions', () => {
    it('shows tooltip on hover', async () => {
      renderWithProviders(
        <Tooltip content="Test tooltip" placement="top">
          <button>Hover me</button>
        </Tooltip>
      );
      
      const trigger = screen.getByRole('button');
      fireEvent.mouseEnter(trigger);
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeVisible();
        expect(screen.getByText('Test tooltip')).toBeInTheDocument();
      });
    });

    it('hides tooltip on mouse leave', async () => {
      renderWithProviders(
        <Tooltip content="Test tooltip" placement="top">
          <button>Hover me</button>
        </Tooltip>
      );
      
      const trigger = screen.getByRole('button');
      fireEvent.mouseEnter(trigger);
      fireEvent.mouseLeave(trigger);
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).not.toBeVisible();
      });
    });

    it('shows tooltip on focus', async () => {
      renderWithProviders(
        <Tooltip content="Test tooltip" placement="top">
          <button>Focus me</button>
        </Tooltip>
      );
      
      const trigger = screen.getByRole('button');
      fireEvent.focus(trigger);
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeVisible();
      });
    });

    it('maintains visibility when isPersistent is true', async () => {
      renderWithProviders(
        <Tooltip content="Test tooltip" placement="top" isPersistent>
          <button>Hover me</button>
        </Tooltip>
      );
      
      const trigger = screen.getByRole('button');
      fireEvent.mouseEnter(trigger);
      fireEvent.mouseLeave(trigger);
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeVisible();
      });
    });
  });

  // Positioning Tests
  describe('Positioning', () => {
    it('positions tooltip based on placement prop', async () => {
      const { rerender } = renderWithProviders(
        <Tooltip content="Test tooltip" placement="top">
          <button>Hover me</button>
        </Tooltip>
      );

      const placements = ['top', 'bottom', 'left', 'right'] as const;
      
      for (const placement of placements) {
        rerender(
          <Tooltip content="Test tooltip" placement={placement}>
            <button>Hover me</button>
          </Tooltip>
        );
        
        const trigger = screen.getByRole('button');
        fireEvent.mouseEnter(trigger);
        
        await waitFor(() => {
          const tooltip = screen.getByRole('tooltip');
          expect(tooltip).toHaveAttribute('data-placement', placement);
        });
      }
    });

    it('repositions tooltip when near viewport edges', async () => {
      // Mock viewport edge position
      const trigger = document.createElement('button');
      Object.defineProperty(trigger, 'getBoundingClientRect', {
        value: () => ({
          top: 0,
          left: 0,
          right: 100,
          bottom: 30,
          width: 100,
          height: 30
        })
      });

      renderWithProviders(
        <Tooltip content="Test tooltip" placement="top">
          {trigger}
        </Tooltip>
      );

      fireEvent.mouseEnter(trigger);
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveAttribute('data-placement', 'bottom');
      });
    });
  });

  // RTL Support Tests
  describe('RTL Support', () => {
    it('adjusts positioning in RTL mode', async () => {
      renderWithProviders(
        <Tooltip content="Test tooltip" placement="left" isRTL>
          <button>RTL Tooltip</button>
        </Tooltip>
      );

      const trigger = screen.getByRole('button');
      fireEvent.mouseEnter(trigger);
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveStyle({ direction: 'rtl' });
      });
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('meets WCAG accessibility guidelines', async () => {
      const { container } = renderWithProviders(
        <Tooltip content="Test tooltip" placement="top">
          <button>Accessible Tooltip</button>
        </Tooltip>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides correct ARIA attributes', () => {
      renderWithProviders(
        <Tooltip content="Test tooltip" placement="top" id="test-tooltip">
          <button>ARIA Tooltip</button>
        </Tooltip>
      );

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-describedby', 'test-tooltip');
    });

    it('supports keyboard navigation', async () => {
      renderWithProviders(
        <Tooltip content="Test tooltip" placement="top">
          <button>Keyboard Tooltip</button>
        </Tooltip>
      );

      const trigger = screen.getByRole('button');
      await userEvent.tab();
      
      expect(trigger).toHaveFocus();
      expect(screen.getByRole('tooltip')).toBeVisible();
    });
  });

  // Performance Tests
  describe('Performance', () => {
    it('uses ResizeObserver for efficient updates', () => {
      renderWithProviders(
        <Tooltip content="Test tooltip" placement="top">
          <button>Performance Test</button>
        </Tooltip>
      );

      expect(mockResizeObserver).toHaveBeenCalled();
    });

    it('cleans up observers on unmount', () => {
      const { unmount } = renderWithProviders(
        <Tooltip content="Test tooltip" placement="top">
          <button>Cleanup Test</button>
        </Tooltip>
      );

      const disconnect = mockResizeObserver().disconnect;
      unmount();
      expect(disconnect).toHaveBeenCalled();
    });
  });
});