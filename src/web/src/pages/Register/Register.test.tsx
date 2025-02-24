import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from '@axe-core/react';
import Register from './Register';
import { renderWithProviders, generateTestData } from '../../utils/test-utils';
import type { CreateUserRequest } from '../../types/user';

// Mock hooks and dependencies
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    register: jest.fn(),
    loading: false,
    error: null
  })
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

describe('Register Component', () => {
  // Test data
  const validUserData: CreateUserRequest = {
    email: 'test@example.com',
    password: 'Test123!@#',
    firstName: 'Test',
    lastName: 'User',
    acceptTerms: true
  };

  const mockRegister = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    jest.spyOn(require('../../hooks/useAuth'), 'useAuth').mockImplementation(() => ({
      register: mockRegister,
      loading: false,
      error: null
    }));
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockImplementation(() => mockNavigate);
  });

  it('renders registration form with all required fields', () => {
    renderWithProviders(<Register />);

    // Verify all form elements are present
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/terms and conditions/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('performs accessibility validation', async () => {
    const { container } = renderWithProviders(<Register />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('validates email format', async () => {
    renderWithProviders(<Register />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    await userEvent.type(emailInput, 'invalid-email');
    fireEvent.blur(emailInput);

    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
  });

  it('validates password strength', async () => {
    renderWithProviders(<Register />);
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    await userEvent.type(passwordInput, 'weak');
    fireEvent.blur(passwordInput);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(await screen.findByText(/password must be at least 8 characters/i)).toBeInTheDocument();
  });

  it('validates password confirmation match', async () => {
    renderWithProviders(<Register />);
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await userEvent.type(passwordInput, 'Test123!@#');
    await userEvent.type(confirmPasswordInput, 'Test123!@#Different');
    fireEvent.blur(confirmPasswordInput);

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('validates terms acceptance', async () => {
    renderWithProviders(<Register />);
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await userEvent.click(submitButton);

    expect(await screen.findByText(/you must accept the terms and conditions/i)).toBeInTheDocument();
  });

  it('handles form submission with loading state', async () => {
    const { rerender } = renderWithProviders(<Register />);

    // Fill form with valid data
    await userEvent.type(screen.getByLabelText(/email address/i), validUserData.email);
    await userEvent.type(screen.getByLabelText(/first name/i), validUserData.firstName);
    await userEvent.type(screen.getByLabelText(/last name/i), validUserData.lastName);
    await userEvent.type(screen.getByLabelText(/^password$/i), validUserData.password);
    await userEvent.type(screen.getByLabelText(/confirm password/i), validUserData.password);
    await userEvent.click(screen.getByLabelText(/terms and conditions/i));

    // Mock loading state
    jest.spyOn(require('../../hooks/useAuth'), 'useAuth').mockImplementation(() => ({
      register: mockRegister,
      loading: true,
      error: null
    }));
    rerender(<Register />);

    const submitButton = screen.getByRole('button', { name: /creating account/i });
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveAttribute('aria-busy', 'true');
  });

  it('handles registration success', async () => {
    renderWithProviders(<Register />);

    // Fill form with valid data
    await userEvent.type(screen.getByLabelText(/email address/i), validUserData.email);
    await userEvent.type(screen.getByLabelText(/first name/i), validUserData.firstName);
    await userEvent.type(screen.getByLabelText(/last name/i), validUserData.lastName);
    await userEvent.type(screen.getByLabelText(/^password$/i), validUserData.password);
    await userEvent.type(screen.getByLabelText(/confirm password/i), validUserData.password);
    await userEvent.click(screen.getByLabelText(/terms and conditions/i));

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: validUserData.email,
        password: validUserData.password,
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
        acceptTerms: true
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles registration error', async () => {
    const errorMessage = 'Registration failed';
    jest.spyOn(require('../../hooks/useAuth'), 'useAuth').mockImplementation(() => ({
      register: jest.fn().mockRejectedValue(new Error(errorMessage)),
      loading: false,
      error: errorMessage
    }));

    renderWithProviders(<Register />);

    // Fill form with valid data
    await userEvent.type(screen.getByLabelText(/email address/i), validUserData.email);
    await userEvent.type(screen.getByLabelText(/first name/i), validUserData.firstName);
    await userEvent.type(screen.getByLabelText(/last name/i), validUserData.lastName);
    await userEvent.type(screen.getByLabelText(/^password$/i), validUserData.password);
    await userEvent.type(screen.getByLabelText(/confirm password/i), validUserData.password);
    await userEvent.click(screen.getByLabelText(/terms and conditions/i));

    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  });

  it('clears error messages on input change', async () => {
    const errorMessage = 'Registration failed';
    jest.spyOn(require('../../hooks/useAuth'), 'useAuth').mockImplementation(() => ({
      register: jest.fn().mockRejectedValue(new Error(errorMessage)),
      loading: false,
      error: errorMessage
    }));

    renderWithProviders(<Register />);

    // Trigger error state
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();

    // Change input to clear error
    await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await waitFor(() => {
      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    });
  });

  it('validates name fields for proper format', async () => {
    renderWithProviders(<Register />);
    
    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);

    await userEvent.type(firstNameInput, '123');
    await userEvent.type(lastNameInput, '456');
    fireEvent.blur(firstNameInput);
    fireEvent.blur(lastNameInput);

    expect(await screen.findByText(/please enter a valid first name/i)).toBeInTheDocument();
    expect(await screen.findByText(/please enter a valid last name/i)).toBeInTheDocument();
  });
});