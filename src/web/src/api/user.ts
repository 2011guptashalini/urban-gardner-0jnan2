/**
 * User API client module for Urban Gardening Assistant
 * Implements secure user authentication and profile management
 * @version 1.0.0
 * @package @urban-gardening-assistant/web
 */

import { AxiosError } from 'axios'; // ^1.4.0
import { TokenManager } from '@auth/token-manager'; // ^1.0.0
import axiosInstance from './axios';
import { API_ENDPOINTS, HTTP_STATUS } from '../constants/api';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  LoginRequest,
  AuthResponse
} from '../types/user';
import { handleAuthResponse, logout } from '../utils/auth';
import { setUserData, getUserData } from '../utils/storage';

// Rate limiting configuration
const RATE_LIMIT = {
  LOGIN_ATTEMPTS: 5,
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
};

// Cache configuration
const CACHE_CONFIG = {
  USER_PROFILE_TTL: 5 * 60 * 1000, // 5 minutes
};

// Error messages
const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  RATE_LIMITED: 'Too many login attempts. Please try again later',
  REGISTRATION_FAILED: 'Failed to create account',
  PROFILE_UPDATE_FAILED: 'Failed to update profile',
  NETWORK_ERROR: 'Network error occurred',
  INVALID_TOKEN: 'Invalid or expired token',
} as const;

/**
 * Authenticates user with email and password
 * @param credentials - Login credentials
 * @returns Authentication response with tokens and user data
 * @throws AxiosError with specific error message
 */
export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  try {
    // Validate input format
    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password are required');
    }

    const response = await axiosInstance.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );

    // Handle successful authentication
    await handleAuthResponse(response);

    // Cache user data
    if (response.user) {
      await setUserData(response.user);
    }

    return response;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response?.status === HTTP_STATUS.TOO_MANY_REQUESTS) {
        throw new Error(ERROR_MESSAGES.RATE_LIMITED);
      }
      if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
        throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }
    }
    throw error;
  }
};

/**
 * Registers new user account
 * @param userData - User registration data
 * @returns Authentication response for new user
 * @throws AxiosError with specific error message
 */
export const register = async (userData: CreateUserRequest): Promise<AuthResponse> => {
  try {
    // Validate required fields
    if (!userData.email || !userData.password || !userData.acceptTerms) {
      throw new Error('Missing required registration fields');
    }

    const response = await axiosInstance.post<AuthResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      userData
    );

    // Automatically authenticate new user
    await handleAuthResponse(response);

    return response;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response?.status === HTTP_STATUS.CONFLICT) {
        throw new Error('Email already registered');
      }
    }
    throw new Error(ERROR_MESSAGES.REGISTRATION_FAILED);
  }
};

/**
 * Refreshes access token
 * @param refreshToken - Current refresh token
 * @returns New authentication tokens
 * @throws Error if token refresh fails
 */
export const refreshToken = async (refreshToken: string): Promise<AuthResponse> => {
  try {
    const response = await axiosInstance.post<AuthResponse>(
      API_ENDPOINTS.AUTH.REFRESH_TOKEN,
      { refreshToken }
    );

    await handleAuthResponse(response);
    return response;
  } catch (error) {
    await logout();
    throw new Error(ERROR_MESSAGES.INVALID_TOKEN);
  }
};

/**
 * Retrieves current user profile with caching
 * @returns Current user data
 * @throws Error if profile retrieval fails
 */
export const getCurrentUser = async (): Promise<User> => {
  try {
    // Check cache first
    const cachedUser = await getUserData();
    if (cachedUser) {
      return cachedUser;
    }

    const response = await axiosInstance.get<User>(
      API_ENDPOINTS.USER.GET_PROFILE
    );

    // Cache the fresh user data
    await setUserData(response);

    return response;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
      await logout();
      throw new Error('Session expired. Please login again');
    }
    throw error;
  }
};

/**
 * Updates user profile with optimistic updates
 * @param updateData - Profile update data
 * @returns Updated user data
 * @throws Error if update fails
 */
export const updateProfile = async (updateData: UpdateUserRequest): Promise<User> => {
  // Store current user data for rollback
  const previousData = await getUserData();

  try {
    // Validate update data
    if (updateData.email && !updateData.currentPassword) {
      throw new Error('Current password required for email update');
    }

    // Optimistically update cache
    if (previousData) {
      await setUserData({
        ...previousData,
        ...updateData,
        updatedAt: new Date()
      });
    }

    const response = await axiosInstance.patch<User>(
      API_ENDPOINTS.USER.UPDATE_PROFILE,
      updateData
    );

    // Update cache with server response
    await setUserData(response);

    return response;
  } catch (error) {
    // Rollback on failure
    if (previousData) {
      await setUserData(previousData);
    }
    throw new Error(ERROR_MESSAGES.PROFILE_UPDATE_FAILED);
  }
};