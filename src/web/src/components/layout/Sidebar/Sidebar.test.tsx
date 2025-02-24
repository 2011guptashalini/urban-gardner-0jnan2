import React from 'react';
import { screen, waitFor, userEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { renderWithProviders } from '../../../utils/test-utils';
import Sidebar from './Sidebar';
import { ROUTES } from '../../../constants/routes';

// Mock useAuth hook
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    logout: vi.fn(),
    user: {
      id: '123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    }
  }))
}));

// Mock window.matchMedia for responsive testing
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

describe('Sidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMatchMedia(true); // Default to desktop view
  });

  describe('Rendering', () => {
    it('renders all navigation links when authenticated', () => {
      renderWithProviders(<Sidebar />);

      // Verify all main navigation links are present
      expect(screen.getByRole('link', { name: /navigate to dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /plan your garden space/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /manage your crops/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /schedule maintenance tasks/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /view your profile/i })).toBeInTheDocument();
    });

    it('applies active styles to current route', async () => {
      renderWithProviders(<Sidebar />, { route: ROUTES.DASHBOARD });

      const dashboardLink = screen.getByRole('link', { name: /navigate to dashboard/i });
      expect(dashboardLink).toHaveStyle({ backgroundColor: 'rgba(46, 125, 50, 0.12)' });
    });

    it('renders logout button when authenticated', () => {
      renderWithProviders(<Sidebar />);

      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      expect(logoutButton).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('renders full sidebar on desktop view', () => {
      mockMatchMedia(true); // Desktop view
      renderWithProviders(<Sidebar />);

      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toHaveStyle({ width: '280px' });
      expect(screen.getAllByRole('menuitem')).toHaveLength(6); // 5 nav items + logout
    });

    it('collapses to bottom navigation on mobile view', () => {
      mockMatchMedia(false); // Mobile view
      renderWithProviders(<Sidebar />);

      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toHaveStyle({ width: '100%', height: 'auto' });
    });

    it('adjusts icon and label layout on mobile view', () => {
      mockMatchMedia(false); // Mobile view
      renderWithProviders(<Sidebar />);

      const menuItems = screen.getAllByRole('menuitem');
      menuItems.forEach(item => {
        expect(item).toHaveStyle({ flexDirection: 'column' });
      });
    });
  });

  describe('Authentication State', () => {
    it('hides authenticated-only links when not authenticated', () => {
      vi.mocked(useAuth).mockImplementation(() => ({
        isAuthenticated: false,
        logout: vi.fn(),
        user: null
      }));

      renderWithProviders(<Sidebar />);

      expect(screen.queryByRole('link', { name: /manage your crops/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /logout from application/i })).not.toBeInTheDocument();
    });

    it('handles logout action', async () => {
      const mockLogout = vi.fn();
      vi.mocked(useAuth).mockImplementation(() => ({
        isAuthenticated: true,
        logout: mockLogout,
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User'
        }
      }));

      renderWithProviders(<Sidebar />);

      // Mock window.confirm to return true
      const mockConfirm = vi.spyOn(window, 'confirm');
      mockConfirm.mockImplementation(() => true);

      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      await userEvent.click(logoutButton);

      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to logout?');
      expect(mockLogout).toHaveBeenCalled();

      mockConfirm.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA attributes', async () => {
      const { checkAccessibility } = renderWithProviders(<Sidebar />);

      // Check navigation role and label
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');

      // Check menu items have correct roles
      const menuItems = screen.getAllByRole('menuitem');
      menuItems.forEach(item => {
        expect(item).toHaveAttribute('aria-label');
      });

      // Verify no accessibility violations
      await checkAccessibility();
    });

    it('supports keyboard navigation', async () => {
      renderWithProviders(<Sidebar />);

      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      logoutButton.focus();

      // Test keyboard interaction
      await userEvent.keyboard('{Enter}');
      expect(window.confirm).toHaveBeenCalled();

      await userEvent.keyboard(' ');
      expect(window.confirm).toHaveBeenCalled();
    });

    it('maintains focus management', async () => {
      renderWithProviders(<Sidebar />);

      const menuItems = screen.getAllByRole('menuitem');
      for (const item of menuItems) {
        await userEvent.tab();
        expect(item).toHaveFocus();
      }
    });
  });

  describe('Error Handling', () => {
    it('handles logout errors gracefully', async () => {
      const mockLogout = vi.fn().mockRejectedValue(new Error('Logout failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(useAuth).mockImplementation(() => ({
        isAuthenticated: true,
        logout: mockLogout,
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User'
        }
      }));

      renderWithProviders(<Sidebar />);

      // Mock window.confirm to return true
      vi.spyOn(window, 'confirm').mockImplementation(() => true);

      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      await userEvent.click(logoutButton);

      expect(consoleSpy).toHaveBeenCalledWith('Logout failed:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});