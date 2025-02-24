import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { renderWithProviders } from '../../../utils/test-utils';
import Modal from './Modal';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock ResizeObserver
const mockResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
global.ResizeObserver = mockResizeObserver;

describe('Modal Component', () => {
  // Common test setup
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Modal',
    children: <div>Modal Content</div>,
    closeOnOverlayClick: true,
    ariaLabel: 'Test modal dialog',
  };

  const setupMatchMedia = (width: number) => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: width <= 768,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Rendering and Visibility', () => {
    it('renders modal when isOpen is true', () => {
      renderWithProviders(<Modal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      renderWithProviders(<Modal {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('applies correct animation classes', async () => {
      renderWithProviders(<Modal {...defaultProps} animation="fade" />);
      const container = screen.getByTestId('modal-overlay');
      expect(container).toHaveAttribute('data-animation', 'fade');
    });

    it('renders with correct ARIA attributes', () => {
      renderWithProviders(<Modal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
      expect(dialog).toHaveAttribute('aria-label', 'Test modal dialog');
    });
  });

  describe('User Interactions', () => {
    it('closes on close button click', async () => {
      renderWithProviders(<Modal {...defaultProps} />);
      const closeButton = screen.getByTestId('modal-close-button');
      await userEvent.click(closeButton);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('closes on overlay click when enabled', async () => {
      renderWithProviders(<Modal {...defaultProps} />);
      const overlay = screen.getByTestId('modal-overlay');
      await userEvent.click(overlay);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close on overlay click when disabled', async () => {
      renderWithProviders(<Modal {...defaultProps} closeOnOverlayClick={false} />);
      const overlay = screen.getByTestId('modal-overlay');
      await userEvent.click(overlay);
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('closes on Escape key press', async () => {
      renderWithProviders(<Modal {...defaultProps} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('maintains focus trap inside modal', async () => {
      renderWithProviders(
        <Modal {...defaultProps}>
          <button>First</button>
          <button>Second</button>
        </Modal>
      );

      const firstButton = screen.getByText('First');
      const secondButton = screen.getByText('Second');
      const closeButton = screen.getByTestId('modal-close-button');

      // Initial focus should be on modal container
      expect(document.activeElement).toHaveAttribute('role', 'dialog');

      // Tab navigation should cycle through focusable elements
      await userEvent.tab();
      expect(document.activeElement).toBe(closeButton);

      await userEvent.tab();
      expect(document.activeElement).toBe(firstButton);

      await userEvent.tab();
      expect(document.activeElement).toBe(secondButton);

      // Should cycle back to first focusable element
      await userEvent.tab();
      expect(document.activeElement).toBe(closeButton);
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderWithProviders(<Modal {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('sets correct focus management', async () => {
      const { rerender } = renderWithProviders(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');

      rerender(<Modal {...defaultProps} isOpen={false} />);
      expect(document.body.style.overflow).toBe('');
    });

    it('provides keyboard navigation', async () => {
      renderWithProviders(<Modal {...defaultProps} />);
      
      // Tab should move through focusable elements
      await userEvent.tab();
      expect(document.activeElement).toHaveAttribute('aria-label', 'Close modal');
      
      // Shift+Tab should move backwards
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toHaveAttribute('role', 'dialog');
    });
  });

  describe('Responsive Behavior', () => {
    it('applies mobile styles below 768px', () => {
      setupMatchMedia(767);
      renderWithProviders(<Modal {...defaultProps} />);
      const container = screen.getByRole('dialog');
      expect(window.getComputedStyle(container).width).toMatch(/90%/);
    });

    it('applies tablet styles 768-1024px', () => {
      setupMatchMedia(800);
      renderWithProviders(<Modal {...defaultProps} />);
      const container = screen.getByRole('dialog');
      expect(window.getComputedStyle(container).width).toMatch(/70%/);
    });

    it('applies desktop styles above 1024px', () => {
      setupMatchMedia(1200);
      renderWithProviders(<Modal {...defaultProps} />);
      const container = screen.getByRole('dialog');
      expect(window.getComputedStyle(container).width).toMatch(/50%/);
    });
  });

  describe('Error Handling', () => {
    it('handles missing title gracefully', () => {
      renderWithProviders(<Modal {...defaultProps} title="" />);
      const heading = screen.getByRole('heading');
      expect(heading).toBeInTheDocument();
      expect(heading).toBeEmptyDOMElement();
    });

    it('handles empty children', () => {
      renderWithProviders(<Modal {...defaultProps} children={null} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.queryByTestId('modal-content')).toBeEmptyDOMElement();
    });

    it('catches and logs render errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      expect(() => {
        renderWithProviders(
          <Modal {...defaultProps}>
            <ErrorComponent />
          </Modal>
        );
      }).toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});