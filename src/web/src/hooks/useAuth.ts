/**
 * Custom React hook for managing authentication state and operations
 * Implements JWT token handling, automatic refresh, and comprehensive error management
 * @version 1.0.0
 */

import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import {
  loginUser,
  registerUser,
  logoutUser,
  refreshToken,
  selectUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError
} from '../store/slices/authSlice';
import type { LoginRequest, CreateUserRequest } from '../types/user';

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_ATTEMPTS: 5,
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  attempts: 0,
  windowStart: 0
};

// Token refresh configuration
const TOKEN_REFRESH_INTERVAL = 55 * 60 * 1000; // 55 minutes
let refreshTimer: NodeJS.Timeout | null = null;

/**
 * Custom hook for managing authentication state and operations
 * @returns Authentication state and operations object
 */
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Select auth state from Redux store
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);

  /**
   * Handles user login with rate limiting and error handling
   * @param credentials - Login credentials
   */
  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      // Check rate limiting
      const now = Date.now();
      if (now - RATE_LIMIT.windowStart > RATE_LIMIT.WINDOW_MS) {
        RATE_LIMIT.attempts = 0;
        RATE_LIMIT.windowStart = now;
      }

      if (RATE_LIMIT.attempts >= RATE_LIMIT.MAX_ATTEMPTS) {
        throw new Error('Too many login attempts. Please try again later.');
      }

      RATE_LIMIT.attempts++;

      // Dispatch login action
      const result = await dispatch(loginUser(credentials)).unwrap();

      // Setup token refresh on successful login
      if (result) {
        setupTokenRefresh();
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, [dispatch, navigate]);

  /**
   * Handles user registration with validation
   * @param userData - User registration data
   */
  const register = useCallback(async (userData: CreateUserRequest) => {
    try {
      // Validate required fields
      if (!userData.email || !userData.password || !userData.acceptTerms) {
        throw new Error('Missing required registration fields');
      }

      // Dispatch register action
      const result = await dispatch(registerUser(userData)).unwrap();

      // Setup token refresh on successful registration
      if (result) {
        setupTokenRefresh();
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }, [dispatch, navigate]);

  /**
   * Handles user logout with cleanup
   */
  const logout = useCallback(() => {
    try {
      // Clear refresh timer
      if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
      }

      // Dispatch logout action
      dispatch(logoutUser());

      // Clear rate limiting
      RATE_LIMIT.attempts = 0;
      RATE_LIMIT.windowStart = 0;

      // Navigate to login
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [dispatch, navigate]);

  /**
   * Sets up automatic token refresh
   */
  const setupTokenRefresh = useCallback(() => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }

    refreshTimer = setInterval(() => {
      if (isAuthenticated) {
        dispatch(refreshToken())
          .unwrap()
          .catch((error) => {
            console.error('Token refresh failed:', error);
            logout();
          });
      }
    }, TOKEN_REFRESH_INTERVAL);
  }, [dispatch, isAuthenticated, logout]);

  // Setup token refresh on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setupTokenRefresh();
    }

    // Cleanup on unmount
    return () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
      }
    };
  }, [isAuthenticated, setupTokenRefresh]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout
  };
};