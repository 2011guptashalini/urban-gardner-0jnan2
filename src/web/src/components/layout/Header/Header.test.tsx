import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { screen, within, userEvent } from '@testing-library/react';
import axe from '@axe-core/react';
import { renderWithProviders } from '../../../utils/test-utils';
import Header from './Header';
import { useAuth } from '../../../hooks/useAuth';

// Mock useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock useAuth hook
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

// Mock useMediaQuery hook
jest.mock('@mui/material', () => ({
  useMediaQuery: jest.fn()
}));

describe('Header Component', () => {
  // Common test setup
  const mockUser = {
    id: '123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    profileImage: '/profile.jpg'
  };

  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      logout: mockLogout,
      isLoading: false
    });
  });

  describe('Basic Rendering', () => {
    it('should render logo and navigation elements correctly', () => {
      renderWithProviders(<Header />);
      
      // Check logo
      const logo = screen.getByAltText('Urban Gardening Assistant');
      expect(logo).toBeInTheDocument();
      expect(logo.closest('div')).toHaveStyle({ cursor: 'pointer' });

      // Check navigation links
      expect(screen.getByRole('button', { name: /gardens/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /crops/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /maintenance/i })).toBeInTheDocument();
    });

    it('should match color scheme specifications', () => {
      renderWithProviders(<Header />);
      const header = screen.getByRole('banner');
      
      expect(header).toHaveStyle({
        backgroundColor: '#2E7D32', // Primary color from variables
        color: '#FFFFFF' // Text light color from variables
      });
    });

    it('should pass accessibility audit', async () => {
      const { container } = renderWithProviders(<Header />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Authentication States', () => {
    it('should render unauthenticated state correctly', () => {
      renderWithProviders(<Header />);
      
      expect(screen.queryByRole('button', { name: /profile/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
    });

    it('should render authenticated state with user profile', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        logout: mockLogout,
        isLoading: false
      });

      renderWithProviders(<Header />);
      
      const profileButton = screen.getByRole('button', { name: /open profile/i });
      expect(profileButton).toBeInTheDocument();
      expect(within(profileButton).getByText(`${mockUser.firstName} ${mockUser.lastName}`)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });

    it('should handle loading state correctly', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        logout: mockLogout,
        isLoading: true
      });

      renderWithProviders(<Header />);
      
      const profileButton = screen.getByRole('button', { name: /open profile/i });
      expect(profileButton).toBeDisabled();
      expect(screen.getByRole('button', { name: /logout/i })).toBeDisabled();
    });
  });

  describe('Navigation Functionality', () => {
    it('should handle logo click navigation', async () => {
      renderWithProviders(<Header />);
      
      const logo = screen.getByAltText('Urban Gardening Assistant');
      await userEvent.click(logo);
      
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should handle profile navigation', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        logout: mockLogout,
        isLoading: false
      });

      renderWithProviders(<Header />);
      
      const profileButton = screen.getByRole('button', { name: /open profile/i });
      await userEvent.click(profileButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });

    it('should handle settings navigation', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        logout: mockLogout,
        isLoading: false
      });

      renderWithProviders(<Header />);
      
      const settingsButton = screen.getByRole('button', { name: /open settings/i });
      await userEvent.click(settingsButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/settings');
    });

    it('should handle logout correctly', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        logout: mockLogout,
        isLoading: false
      });

      renderWithProviders(<Header />);
      
      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await userEvent.click(logoutButton);
      
      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Responsive Design', () => {
    it('should render desktop layout correctly', () => {
      (useMediaQuery as jest.Mock).mockReturnValue(false); // Not mobile
      renderWithProviders(<Header />);
      
      expect(screen.queryByRole('button', { name: /menu/i })).not.toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeVisible();
    });

    it('should render mobile layout correctly', () => {
      (useMediaQuery as jest.Mock).mockReturnValue(true); // Is mobile
      renderWithProviders(<Header />);
      
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      expect(menuButton).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-expanded', 'false');
    });

    it('should handle mobile menu toggle', async () => {
      (useMediaQuery as jest.Mock).mockReturnValue(true); // Is mobile
      renderWithProviders(<Header />);
      
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      await userEvent.click(menuButton);
      
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-expanded', 'true');
      expect(menuButton).toHaveAccessibleName('Close Menu');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithProviders(<Header />);
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getAllByRole('button')).toHaveLength(3); // Navigation buttons
    });

    it('should handle keyboard navigation', async () => {
      renderWithProviders(<Header />);
      
      const buttons = screen.getAllByRole('button');
      await userEvent.tab();
      expect(buttons[0]).toHaveFocus();
      
      await userEvent.tab();
      expect(buttons[1]).toHaveFocus();
      
      await userEvent.tab();
      expect(buttons[2]).toHaveFocus();
    });

    it('should maintain focus management during mobile menu interaction', async () => {
      (useMediaQuery as jest.Mock).mockReturnValue(true);
      renderWithProviders(<Header />);
      
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      await userEvent.click(menuButton);
      
      expect(document.activeElement).toBe(menuButton);
    });
  });
});