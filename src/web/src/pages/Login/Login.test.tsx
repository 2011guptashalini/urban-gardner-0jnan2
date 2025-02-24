import { screen, waitFor, userEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { axe } from '@axe-core/react';
import { Login } from './Login';
import { renderWithProviders } from '../../utils/test-utils';

describe('Login Component', () => {
  // Mock auth hook
  const mockLogin = vi.fn();
  const mockNavigate = vi.fn();

  // Test credentials
  const validCredentials = {
    email: 'test@example.com',
    password: 'ValidP@ssw0rd',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock auth hook implementation
    vi.mock('../../hooks/useAuth', () => ({
      useAuth: () => ({
        login: mockLogin,
        loading: false,
        error: null,
      }),
    }));
    // Mock router
    vi.mock('react-router-dom', () => ({
      useNavigate: () => mockNavigate,
    }));
  });

  describe('Rendering and Accessibility', () => {
    it('should render login form with all required elements', () => {
      renderWithProviders(<Login />);

      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /remember me/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
    });

    it('should meet accessibility standards', async () => {
      const { container } = renderWithProviders(<Login />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation', async () => {
      renderWithProviders(<Login />);
      const user = userEvent.setup();

      // Tab through all interactive elements
      await user.tab();
      expect(screen.getByLabelText(/email address/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/password/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('checkbox', { name: /remember me/i })).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('link', { name: /forgot password/i })).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('button', { name: /sign in/i })).toHaveFocus();
    });
  });

  describe('Form Validation', () => {
    it('should validate email format', async () => {
      renderWithProviders(<Login />);
      const user = userEvent.setup();
      const emailInput = screen.getByLabelText(/email address/i);

      await user.type(emailInput, 'invalid-email');
      await user.tab(); // Trigger blur validation

      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });

    it('should validate password requirements', async () => {
      renderWithProviders(<Login />);
      const user = userEvent.setup();
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(passwordInput, 'short');
      await user.tab(); // Trigger blur validation

      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });

    it('should disable submit button when form is invalid', async () => {
      renderWithProviders(<Login />);
      const user = userEvent.setup();
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'short');

      expect(submitButton).toBeDisabled();
    });
  });

  describe('Authentication Flow', () => {
    it('should handle successful login', async () => {
      renderWithProviders(<Login />);
      const user = userEvent.setup();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const rememberMeCheckbox = screen.getByRole('checkbox', { name: /remember me/i });
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, validCredentials.email);
      await user.type(passwordInput, validCredentials.password);
      await user.click(rememberMeCheckbox);
      await user.click(submitButton);

      expect(mockLogin).toHaveBeenCalledWith({
        email: validCredentials.email,
        password: validCredentials.password,
        rememberMe: true,
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should display loading state during authentication', async () => {
      vi.mock('../../hooks/useAuth', () => ({
        useAuth: () => ({
          login: () => new Promise((resolve) => setTimeout(resolve, 1000)),
          loading: true,
          error: null,
        }),
      }));

      renderWithProviders(<Login />);
      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/email address/i), validCredentials.email);
      await user.type(screen.getByLabelText(/password/i), validCredentials.password);
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
    });

    it('should handle authentication errors', async () => {
      const errorMessage = 'Invalid credentials';
      vi.mock('../../hooks/useAuth', () => ({
        useAuth: () => ({
          login: () => Promise.reject(new Error(errorMessage)),
          loading: false,
          error: errorMessage,
        }),
      }));

      renderWithProviders(<Login />);
      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/email address/i), validCredentials.email);
      await user.type(screen.getByLabelText(/password/i), validCredentials.password);
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
      });
    });
  });

  describe('Security Features', () => {
    it('should clear sensitive form data on unmount', () => {
      const { unmount } = renderWithProviders(<Login />);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      userEvent.type(emailInput, validCredentials.email);
      userEvent.type(passwordInput, validCredentials.password);

      unmount();

      // Re-render and check if fields are cleared
      renderWithProviders(<Login />);
      expect(screen.getByLabelText(/email address/i)).toHaveValue('');
      expect(screen.getByLabelText(/password/i)).toHaveValue('');
    });

    it('should prevent multiple rapid login attempts', async () => {
      renderWithProviders(<Login />);
      const user = userEvent.setup();
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(screen.getByLabelText(/email address/i), validCredentials.email);
      await user.type(screen.getByLabelText(/password/i), validCredentials.password);

      // Attempt multiple rapid clicks
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      // Should only call login once due to debouncing
      expect(mockLogin).toHaveBeenCalledTimes(1);
    });
  });

  describe('Navigation', () => {
    it('should navigate to registration page', async () => {
      renderWithProviders(<Login />);
      const user = userEvent.setup();
      
      await user.click(screen.getByRole('link', { name: /sign up/i }));
      expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/register');
    });

    it('should navigate to forgot password page', async () => {
      renderWithProviders(<Login />);
      const user = userEvent.setup();
      
      await user.click(screen.getByRole('link', { name: /forgot password/i }));
      expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute('href', '/forgot-password');
    });
  });
});