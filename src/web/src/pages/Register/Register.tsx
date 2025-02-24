import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import { useAuth } from '../../hooks/useAuth';
import { CreateUserRequest } from '../../types/user';
import { validatePassword } from '../../utils/validation';

// Form state interface with all required fields
interface FormState {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  termsAccepted: boolean;
  captchaToken: string | null;
}

// Validation errors interface
interface ValidationErrors {
  email: string | null;
  password: string | null;
  confirmPassword: string | null;
  firstName: string | null;
  lastName: string | null;
  terms: string | null;
  captcha: string | null;
}

// Initial form state
const initialFormState: FormState = {
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  termsAccepted: false,
  captchaToken: null
};

// Initial validation state
const initialValidationState: ValidationErrors = {
  email: null,
  password: null,
  confirmPassword: null,
  firstName: null,
  lastName: null,
  terms: null,
  captcha: null
};

/**
 * Registration page component with comprehensive validation and security measures
 */
const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, loading, error } = useAuth();
  
  // Form state management
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(initialValidationState);
  const [passwordStrength, setPasswordStrength] = useState<number>(0);

  // Clear external auth errors when form changes
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setValidationErrors(initialValidationState);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  /**
   * Validates email format using RFC 5322 standard
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  };

  /**
   * Validates name fields for proper format and length
   */
  const validateName = (name: string): boolean => {
    const nameRegex = /^[a-zA-Z\s-']{2,50}$/;
    return nameRegex.test(name.trim());
  };

  /**
   * Comprehensive form validation
   */
  const validateForm = (): boolean => {
    const errors: ValidationErrors = { ...initialValidationState };
    let isValid = true;

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.errors[0];
        isValid = false;
      }
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    // Name validation
    if (!formData.firstName || !validateName(formData.firstName)) {
      errors.firstName = 'Please enter a valid first name';
      isValid = false;
    }
    if (!formData.lastName || !validateName(formData.lastName)) {
      errors.lastName = 'Please enter a valid last name';
      isValid = false;
    }

    // Terms acceptance validation
    if (!formData.termsAccepted) {
      errors.terms = 'You must accept the terms and conditions';
      isValid = false;
    }

    // CAPTCHA validation
    if (!formData.captchaToken) {
      errors.captcha = 'Please complete the CAPTCHA verification';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  /**
   * Handles form input changes with real-time validation
   */
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    const inputValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: inputValue
    }));

    // Real-time field validation
    if (name === 'password') {
      const strength = validatePassword(value).strength || 0;
      setPasswordStrength(strength);
    }
  }, []);

  /**
   * Handles CAPTCHA completion
   */
  const handleCaptchaChange = useCallback((token: string | null) => {
    setFormData(prev => ({
      ...prev,
      captchaToken: token
    }));
  }, []);

  /**
   * Handles form submission with security measures
   */
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const registrationData: CreateUserRequest = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        acceptTerms: formData.termsAccepted
      };

      await register(registrationData);
      
      // Redirect to dashboard after successful registration
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Registration failed:', error);
    }
  }, [formData, register, navigate]);

  return (
    <div className="register-container">
      <h1>Create Account</h1>
      <form onSubmit={handleSubmit} noValidate>
        <Input
          id="email"
          name="email"
          type="email"
          label="Email Address"
          value={formData.email}
          error={validationErrors.email}
          onChange={handleInputChange}
          aria-invalid={Boolean(validationErrors.email)}
          required
        />

        <Input
          id="firstName"
          name="firstName"
          type="text"
          label="First Name"
          value={formData.firstName}
          error={validationErrors.firstName}
          onChange={handleInputChange}
          aria-invalid={Boolean(validationErrors.firstName)}
          required
        />

        <Input
          id="lastName"
          name="lastName"
          type="text"
          label="Last Name"
          value={formData.lastName}
          error={validationErrors.lastName}
          onChange={handleInputChange}
          aria-invalid={Boolean(validationErrors.lastName)}
          required
        />

        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          value={formData.password}
          error={validationErrors.password}
          onChange={handleInputChange}
          aria-invalid={Boolean(validationErrors.password)}
          required
        />

        {passwordStrength > 0 && (
          <div className="password-strength" role="progressbar" aria-valuenow={passwordStrength}>
            <div 
              className={`strength-indicator strength-${passwordStrength}`}
              style={{ width: `${passwordStrength}%` }}
            />
          </div>
        )}

        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirm Password"
          value={formData.confirmPassword}
          error={validationErrors.confirmPassword}
          onChange={handleInputChange}
          aria-invalid={Boolean(validationErrors.confirmPassword)}
          required
        />

        <div className="terms-container">
          <input
            type="checkbox"
            id="termsAccepted"
            name="termsAccepted"
            checked={formData.termsAccepted}
            onChange={handleInputChange}
            aria-invalid={Boolean(validationErrors.terms)}
          />
          <label htmlFor="termsAccepted">
            I accept the terms and conditions
          </label>
          {validationErrors.terms && (
            <span className="error-message" role="alert">{validationErrors.terms}</span>
          )}
        </div>

        <ReCAPTCHA
          sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY || ''}
          onChange={handleCaptchaChange}
        />
        {validationErrors.captcha && (
          <span className="error-message" role="alert">{validationErrors.captcha}</span>
        )}

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>
    </div>
  );
};

export default Register;