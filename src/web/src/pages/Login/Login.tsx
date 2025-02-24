import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword } from '../../utils/validation';
import { flexColumn, flexCenter } from '../../styles/mixins';
import styled from 'styled-components';

// Styled components for login page layout
const LoginContainer = styled.div`
  ${flexColumn}
  min-height: 100vh;
  padding: ${({ theme }) => theme.spacing.xl};
  background-color: ${({ theme }) => theme.colors.background};
`;

const LoginForm = styled.form`
  ${flexColumn}
  max-width: 400px;
  width: 100%;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
  background-color: white;
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

const FormHeader = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize.h2};
  color: ${({ theme }) => theme.colors.primary};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const RememberMeContainer = styled.div`
  ${flexCenter}
  justify-content: space-between;
  margin: ${({ theme }) => theme.spacing.md} 0;
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.warning};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
  text-align: center;
`;

/**
 * Login page component for user authentication
 * Implements secure login with validation and error handling
 */
const Login: React.FC = () => {
  // State management
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Hooks
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  // Debounced validation functions
  const validateEmailDebounced = useCallback(
    debounce((value: string) => {
      const result = validateEmail(value);
      setEmailError(result.isValid ? '' : result.errors[0]);
    }, 300),
    []
  );

  const validatePasswordDebounced = useCallback(
    debounce((value: string) => {
      const result = validatePassword(value);
      setPasswordError(result.isValid ? '' : result.errors[0]);
    }, 300),
    []
  );

  // Input change handlers
  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    validateEmailDebounced(value);
  }, [validateEmailDebounced]);

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
    validatePasswordDebounced(value);
  }, [validatePasswordDebounced]);

  const handleRememberMeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRememberMe(event.target.checked);
  }, []);

  // Form submission handler
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();

    // Validate inputs before submission
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    if (!emailValidation.isValid) {
      setEmailError(emailValidation.errors[0]);
      return;
    }

    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.errors[0]);
      return;
    }

    try {
      await login({ email, password, rememberMe });
      navigate('/dashboard');
    } catch (error) {
      // Error handling is managed by useAuth hook
      console.error('Login failed:', error);
    }
  }, [email, password, rememberMe, login, navigate]);

  // Clear validation errors on unmount
  useEffect(() => {
    return () => {
      validateEmailDebounced.cancel();
      validatePasswordDebounced.cancel();
    };
  }, [validateEmailDebounced, validatePasswordDebounced]);

  return (
    <LoginContainer>
      <LoginForm onSubmit={handleSubmit} noValidate>
        <FormHeader>Welcome Back</FormHeader>

        <Input
          id="email"
          name="email"
          type="email"
          label="Email Address"
          value={email}
          onChange={handleEmailChange}
          error={emailError}
          required
          aria-label="Email Address"
          data-testid="email-input"
        />

        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          value={password}
          onChange={handlePasswordChange}
          error={passwordError}
          required
          aria-label="Password"
          data-testid="password-input"
        />

        <RememberMeContainer>
          <label>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={handleRememberMeChange}
              aria-label="Remember me"
            />
            Remember me
          </label>
          <a href="/forgot-password" tabIndex={0}>
            Forgot password?
          </a>
        </RememberMeContainer>

        {error && (
          <ErrorMessage role="alert" aria-live="polite">
            {error}
          </ErrorMessage>
        )}

        <Button
          variant="primary"
          size="large"
          fullWidth
          disabled={loading || !!emailError || !!passwordError}
          isLoading={loading}
          aria-label="Sign in"
          data-testid="login-button"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          Don't have an account?{' '}
          <a href="/register" tabIndex={0}>
            Sign up
          </a>
        </div>
      </LoginForm>
    </LoginContainer>
  );
};

export default Login;