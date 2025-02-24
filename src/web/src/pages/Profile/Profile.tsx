import React, { useState, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';
import { ErrorBoundary } from 'react-error-boundary';
import useAuth from '../../hooks/useAuth';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import { UpdateUserRequest } from '../../types/user';

// Validation constants
const NAME_MAX_LENGTH = 50;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

interface ProfileFormState {
  firstName: string;
  lastName: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  isSubmitting: boolean;
  hasChanges: boolean;
}

/**
 * Profile management component with secure form handling and validation
 */
const Profile: React.FC = () => {
  const { user, loading, error: authError, updateProfile } = useAuth();
  const [formState, setFormState] = useState<ProfileFormState>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    isSubmitting: false,
    hasChanges: false
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ProfileFormState, string>>>({});

  // Reset form when user data changes
  useEffect(() => {
    if (user) {
      setFormState(prev => ({
        ...prev,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }));
    }
  }, [user]);

  // Validate form input with debouncing
  const validateField = useCallback(debounce((field: keyof ProfileFormState, value: string) => {
    const errors: Partial<Record<keyof ProfileFormState, string>> = {};

    switch (field) {
      case 'firstName':
        if (!value.trim()) {
          errors.firstName = 'First name is required';
        } else if (value.length > NAME_MAX_LENGTH) {
          errors.firstName = `First name cannot exceed ${NAME_MAX_LENGTH} characters`;
        }
        break;

      case 'lastName':
        if (!value.trim()) {
          errors.lastName = 'Last name is required';
        } else if (value.length > NAME_MAX_LENGTH) {
          errors.lastName = `Last name cannot exceed ${NAME_MAX_LENGTH} characters`;
        }
        break;

      case 'email':
        if (!value.trim()) {
          errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = 'Please enter a valid email address';
        }
        break;

      case 'newPassword':
        if (value) {
          if (value.length < PASSWORD_MIN_LENGTH) {
            errors.newPassword = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
          } else if (!PASSWORD_PATTERN.test(value)) {
            errors.newPassword = 'Password must include uppercase, lowercase, number and special character';
          }
        }
        break;

      case 'confirmPassword':
        if (value !== formState.newPassword) {
          errors.confirmPassword = 'Passwords do not match';
        }
        break;
    }

    setFormErrors(prev => ({ ...prev, ...errors }));
  }, 300), [formState.newPassword]);

  // Handle input changes
  const handleInputChange = useCallback((field: keyof ProfileFormState) => (value: string) => {
    setFormState(prev => ({
      ...prev,
      [field]: value,
      hasChanges: true
    }));
    validateField(field, value);
  }, [validateField]);

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Validate all fields before submission
    const allFields: (keyof ProfileFormState)[] = ['firstName', 'lastName', 'email', 'newPassword', 'confirmPassword'];
    allFields.forEach(field => validateField.flush());

    if (Object.keys(formErrors).length > 0) {
      return;
    }

    setFormState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const updateData: UpdateUserRequest = {
        firstName: formState.firstName,
        lastName: formState.lastName
      };

      // Only include password update if new password is provided
      if (formState.newPassword) {
        updateData.password = formState.newPassword;
        updateData.currentPassword = formState.currentPassword;
      }

      // Only include email update if it has changed
      if (formState.email !== user?.email) {
        updateData.email = formState.email;
        updateData.currentPassword = formState.currentPassword;
      }

      await updateProfile(updateData);

      setFormState(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        isSubmitting: false,
        hasChanges: false
      }));
    } catch (error) {
      console.error('Profile update failed:', error);
      setFormErrors(prev => ({
        ...prev,
        submit: 'Failed to update profile. Please try again.'
      }));
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  if (loading) {
    return <div aria-live="polite">Loading profile...</div>;
  }

  return (
    <ErrorBoundary fallback={<div>Error loading profile. Please refresh the page.</div>}>
      <form onSubmit={handleSubmit} aria-label="Profile Update Form">
        <div role="alert" aria-live="polite">
          {authError && <p className="error-message">{authError}</p>}
          {formErrors.submit && <p className="error-message">{formErrors.submit}</p>}
        </div>

        <Input
          id="firstName"
          name="firstName"
          label="First Name"
          value={formState.firstName}
          error={formErrors.firstName}
          onChange={handleInputChange('firstName')}
          required
          aria-label="First Name"
          data-testid="profile-firstName"
        />

        <Input
          id="lastName"
          name="lastName"
          label="Last Name"
          value={formState.lastName}
          error={formErrors.lastName}
          onChange={handleInputChange('lastName')}
          required
          aria-label="Last Name"
          data-testid="profile-lastName"
        />

        <Input
          id="email"
          name="email"
          type="email"
          label="Email Address"
          value={formState.email}
          error={formErrors.email}
          onChange={handleInputChange('email')}
          required
          aria-label="Email Address"
          data-testid="profile-email"
        />

        {(formState.email !== user?.email || formState.newPassword) && (
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            label="Current Password"
            value={formState.currentPassword}
            error={formErrors.currentPassword}
            onChange={handleInputChange('currentPassword')}
            required
            aria-label="Current Password"
            data-testid="profile-currentPassword"
          />
        )}

        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          label="New Password (Optional)"
          value={formState.newPassword}
          error={formErrors.newPassword}
          onChange={handleInputChange('newPassword')}
          aria-label="New Password"
          data-testid="profile-newPassword"
        />

        {formState.newPassword && (
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="Confirm New Password"
            value={formState.confirmPassword}
            error={formErrors.confirmPassword}
            onChange={handleInputChange('confirmPassword')}
            required
            aria-label="Confirm New Password"
            data-testid="profile-confirmPassword"
          />
        )}

        <Button
          variant="primary"
          type="submit"
          disabled={!formState.hasChanges || formState.isSubmitting || Object.keys(formErrors).length > 0}
          isLoading={formState.isSubmitting}
          aria-label="Update Profile"
          data-testid="profile-submit"
        >
          {formState.isSubmitting ? 'Updating...' : 'Update Profile'}
        </Button>
      </form>
    </ErrorBoundary>
  );
};

export default Profile;