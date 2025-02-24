import React from 'react';
import { screen, waitFor, within, userEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { axe } from '@axe-core/react';
import { renderWithProviders } from '../../utils/test-utils';
import Profile from './Profile';

// Mock useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  default: vi.fn(() => ({
    user: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com'
    },
    loading: false,
    error: null,
    updateProfile: vi.fn()
  }))
}));

describe('Profile Component', () => {
  // Setup and teardown
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test initial rendering
  it('renders profile form correctly', async () => {
    const { findByDataTestId } = renderWithProviders(<Profile />);

    // Verify all form fields are present
    expect(await findByDataTestId('profile-firstName')).toBeInTheDocument();
    expect(await findByDataTestId('profile-lastName')).toBeInTheDocument();
    expect(await findByDataTestId('profile-email')).toBeInTheDocument();
    expect(await findByDataTestId('profile-submit')).toBeInTheDocument();

    // Verify initial values are populated
    expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
    expect(screen.getByDisplayValue('User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
  });

  // Test accessibility
  it('meets accessibility standards', async () => {
    const { container } = renderWithProviders(<Profile />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // Test form validation
  describe('form validation', () => {
    it('validates required fields', async () => {
      renderWithProviders(<Profile />);
      
      // Clear required fields
      const firstNameInput = screen.getByTestId('profile-firstName');
      const lastNameInput = screen.getByTestId('profile-lastName');
      const emailInput = screen.getByTestId('profile-email');

      await userEvent.clear(firstNameInput);
      await userEvent.clear(lastNameInput);
      await userEvent.clear(emailInput);

      // Try to submit
      const submitButton = screen.getByTestId('profile-submit');
      await userEvent.click(submitButton);

      // Verify error messages
      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    it('validates email format', async () => {
      renderWithProviders(<Profile />);
      
      const emailInput = screen.getByTestId('profile-email');
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'invalid-email');

      // Verify error message
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('validates password requirements', async () => {
      renderWithProviders(<Profile />);
      
      const newPasswordInput = screen.getByTestId('profile-newPassword');
      await userEvent.type(newPasswordInput, 'weak');

      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      
      await userEvent.clear(newPasswordInput);
      await userEvent.type(newPasswordInput, 'password123');

      expect(screen.getByText('Password must include uppercase, lowercase, number and special character')).toBeInTheDocument();
    });
  });

  // Test form interactions
  describe('form interactions', () => {
    it('handles profile update correctly', async () => {
      const mockUpdateProfile = vi.fn().mockResolvedValue({});
      vi.mocked(useAuth).mockImplementation(() => ({
        user: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com'
        },
        loading: false,
        error: null,
        updateProfile: mockUpdateProfile
      }));

      renderWithProviders(<Profile />);

      // Update form fields
      const firstNameInput = screen.getByTestId('profile-firstName');
      await userEvent.clear(firstNameInput);
      await userEvent.type(firstNameInput, 'Updated');

      const lastNameInput = screen.getByTestId('profile-lastName');
      await userEvent.clear(lastNameInput);
      await userEvent.type(lastNameInput, 'Name');

      // Submit form
      const submitButton = screen.getByTestId('profile-submit');
      await userEvent.click(submitButton);

      // Verify update was called with correct data
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        firstName: 'Updated',
        lastName: 'Name'
      });
    });

    it('handles password update correctly', async () => {
      const mockUpdateProfile = vi.fn().mockResolvedValue({});
      vi.mocked(useAuth).mockImplementation(() => ({
        user: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com'
        },
        loading: false,
        error: null,
        updateProfile: mockUpdateProfile
      }));

      renderWithProviders(<Profile />);

      // Enter new password
      const currentPasswordInput = screen.getByTestId('profile-currentPassword');
      const newPasswordInput = screen.getByTestId('profile-newPassword');
      const confirmPasswordInput = screen.getByTestId('profile-confirmPassword');

      await userEvent.type(currentPasswordInput, 'CurrentPass123!');
      await userEvent.type(newPasswordInput, 'NewPass123!');
      await userEvent.type(confirmPasswordInput, 'NewPass123!');

      // Submit form
      const submitButton = screen.getByTestId('profile-submit');
      await userEvent.click(submitButton);

      // Verify update was called with correct data
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        currentPassword: 'CurrentPass123!',
        password: 'NewPass123!'
      });
    });
  });

  // Test loading states
  it('displays loading state correctly', () => {
    vi.mocked(useAuth).mockImplementation(() => ({
      user: null,
      loading: true,
      error: null,
      updateProfile: vi.fn()
    }));

    renderWithProviders(<Profile />);
    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  });

  // Test error handling
  it('displays error messages correctly', async () => {
    const mockError = 'Failed to update profile';
    vi.mocked(useAuth).mockImplementation(() => ({
      user: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com'
      },
      loading: false,
      error: mockError,
      updateProfile: vi.fn().mockRejectedValue(new Error(mockError))
    }));

    renderWithProviders(<Profile />);
    expect(screen.getByText(mockError)).toBeInTheDocument();
  });

  // Test security features
  describe('security features', () => {
    it('requires current password for sensitive updates', async () => {
      renderWithProviders(<Profile />);

      // Try to update email
      const emailInput = screen.getByTestId('profile-email');
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'new@example.com');

      // Verify current password field appears
      expect(screen.getByTestId('profile-currentPassword')).toBeInTheDocument();
    });

    it('handles session expiry', async () => {
      const mockUpdateProfile = vi.fn().mockRejectedValue(new Error('Unauthorized'));
      vi.mocked(useAuth).mockImplementation(() => ({
        user: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com'
        },
        loading: false,
        error: null,
        updateProfile: mockUpdateProfile
      }));

      renderWithProviders(<Profile />);

      // Submit form
      const submitButton = screen.getByTestId('profile-submit');
      await userEvent.click(submitButton);

      // Verify error handling
      expect(screen.getByText('Failed to update profile. Please try again.')).toBeInTheDocument();
    });
  });
});