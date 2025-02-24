import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../utils/test-utils';
import Footer from './Footer';
import { ROUTES } from '../../../constants/routes';

describe('Footer component', () => {
  // Mock window.matchMedia for responsive tests
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  // Mock current date for copyright tests
  const mockDate = new Date('2024-01-01');
  const originalDate = global.Date;
  beforeEach(() => {
    global.Date = class extends Date {
      constructor() {
        super();
        return mockDate;
      }
    } as DateConstructor;
  });

  afterEach(() => {
    global.Date = originalDate;
  });

  it('renders correctly with all required elements', async () => {
    const { container } = renderWithProviders(<Footer />);

    // Verify footer is present with correct role
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();

    // Verify navigation section
    const navigation = screen.getByRole('navigation', { name: /footer navigation/i });
    expect(navigation).toBeInTheDocument();

    // Verify copyright text
    const copyright = screen.getByText(/urban gardening assistant/i);
    expect(copyright).toBeInTheDocument();
    expect(copyright).toHaveTextContent('2024');

    // Check accessibility
    await waitFor(() => {
      expect(container).toBeAccessible();
    });
  });

  it('displays all navigation links with correct routes', () => {
    renderWithProviders(<Footer />);

    // Verify all navigation links are present with correct routes
    const links = [
      { text: 'Home', route: ROUTES.HOME },
      { text: 'Garden Planner', route: ROUTES.GARDEN_PLANNER },
      { text: 'Crop Manager', route: ROUTES.CROP_MANAGER },
      { text: 'Maintenance Scheduler', route: ROUTES.MAINTENANCE_SCHEDULER }
    ];

    links.forEach(({ text, route }) => {
      const link = screen.getByRole('link', { name: text });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', route);
    });
  });

  it('handles responsive layouts correctly', async () => {
    // Test desktop layout (>1024px)
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(min-width: 1024px)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    const { rerender } = renderWithProviders(<Footer />);
    expect(screen.getByRole('contentinfo')).toHaveStyle({
      padding: '32px 0'
    });

    // Test tablet layout (768-1024px)
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(min-width: 768px)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    rerender(<Footer />);
    expect(screen.getByRole('contentinfo')).toHaveStyle({
      padding: '24px 0'
    });

    // Test mobile layout (<768px)
    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    rerender(<Footer />);
    expect(screen.getByRole('contentinfo')).toHaveStyle({
      padding: '16px 0'
    });
  });

  it('supports keyboard navigation', async () => {
    renderWithProviders(<Footer />);
    const user = userEvent.setup();

    // Get all interactive elements
    const links = screen.getAllByRole('link');
    
    // Focus first link
    await user.tab();
    expect(links[0]).toHaveFocus();

    // Navigate through all links
    for (let i = 1; i < links.length; i++) {
      await user.tab();
      expect(links[i]).toHaveFocus();
    }
  });

  it('indicates current page in navigation', () => {
    // Mock current location to Home
    window.location.pathname = ROUTES.HOME;
    const { rerender } = renderWithProviders(<Footer />);

    // Verify Home link shows as current page
    expect(screen.getByRole('link', { name: 'Home' }))
      .toHaveAttribute('aria-current', 'page');

    // Change location to Garden Planner
    window.location.pathname = ROUTES.GARDEN_PLANNER;
    rerender(<Footer />);

    // Verify Garden Planner link shows as current page
    expect(screen.getByRole('link', { name: 'Garden Planner' }))
      .toHaveAttribute('aria-current', 'page');
  });

  it('displays copyright information with current year', () => {
    renderWithProviders(<Footer />);

    const copyright = screen.getByText(/© 2024 Urban Gardening Assistant\. All rights reserved\./i);
    expect(copyright).toBeInTheDocument();

    // Verify aria-label includes the full copyright text
    const copyrightContainer = screen.getByLabelText(/Copyright 2024 Urban Gardening Assistant\. All rights reserved\./i);
    expect(copyrightContainer).toBeInTheDocument();
  });

  it('maintains accessibility standards', async () => {
    const { container } = renderWithProviders(<Footer />);

    // Verify semantic HTML structure
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();

    // Verify navigation landmarks
    expect(screen.getByLabelText(/footer navigation/i)).toBeInTheDocument();

    // Verify link accessibility
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveAttribute('href');
      expect(link).not.toHaveAttribute('tabindex', '-1');
    });

    // Run full accessibility audit
    await waitFor(() => {
      expect(container).toHaveNoViolations();
    });
  });
});