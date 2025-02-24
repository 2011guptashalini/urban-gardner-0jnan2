/**
 * Authentication utility module for Urban Gardening Assistant
 * Provides JWT token management and authentication state functions
 * @version 1.0.0
 * @package @urban-gardening-assistant/web
 */

import jwtDecode from 'jwt-decode'; // v3.1.2
import { User, AuthResponse, TokenPayload } from '../types/user';
import { setAuthTokens, getAuthTokens, clearAuthTokens } from './storage';

// Buffer time before token expiry to trigger refresh (5 minutes)
const TOKEN_EXPIRY_BUFFER = 300000;

/**
 * Checks if the current user is authenticated by validating access token
 * @returns {boolean} True if user is authenticated, false otherwise
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const tokens = await getAuthTokens();
    if (!tokens?.accessToken) {
      return false;
    }
    return !isTokenExpired(tokens.accessToken);
  } catch (error) {
    console.error('Authentication check failed:', error);
    return false;
  }
};

/**
 * Retrieves the current access token if valid
 * @returns {string | null} Access token if exists and valid, null otherwise
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    const tokens = await getAuthTokens();
    if (!tokens?.accessToken || isTokenExpired(tokens.accessToken)) {
      return null;
    }
    return tokens.accessToken;
  } catch (error) {
    console.error('Failed to get access token:', error);
    return null;
  }
};

/**
 * Checks if a JWT token is expired, accounting for expiry buffer
 * @param {string} token - JWT token to check
 * @returns {boolean} True if token is expired or will expire soon, false otherwise
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    const currentTime = Date.now();
    // Convert exp to milliseconds and subtract buffer time
    return decoded.exp * 1000 - TOKEN_EXPIRY_BUFFER <= currentTime;
  } catch (error) {
    console.error('Token expiration check failed:', error);
    return true;
  }
};

/**
 * Processes successful authentication response and stores tokens
 * @param {AuthResponse} response - Authentication response containing tokens and user data
 */
export const handleAuthResponse = async (response: AuthResponse): Promise<void> => {
  try {
    if (!response.token || !response.refreshToken || !response.user) {
      throw new Error('Invalid authentication response');
    }

    // Validate token format and expiration
    if (isTokenExpired(response.token)) {
      throw new Error('Received expired access token');
    }

    // Store authentication tokens
    await setAuthTokens(response.token, response.refreshToken);

    // Store user data in local storage
    const userData: User = {
      id: response.user.id,
      email: response.user.email,
      firstName: response.user.firstName,
      lastName: response.user.lastName,
      createdAt: response.user.createdAt,
      updatedAt: response.user.updatedAt,
      isActive: response.user.isActive,
      roles: response.user.roles
    };

    localStorage.setItem('userData', JSON.stringify(userData));
  } catch (error) {
    console.error('Failed to handle authentication response:', error);
    throw error;
  }
};

/**
 * Logs out the current user by clearing authentication state
 * Removes all tokens and user data from storage
 */
export const logout = async (): Promise<void> => {
  try {
    await clearAuthTokens();
    localStorage.removeItem('userData');
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
};

/**
 * Decodes and validates a JWT token
 * @param {string} token - JWT token to decode
 * @returns {TokenPayload} Decoded token payload
 * @throws {Error} If token is invalid or malformed
 */
const decodeToken = (token: string): TokenPayload => {
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    if (!decoded.sub || !decoded.email || !decoded.exp) {
      throw new Error('Invalid token payload structure');
    }
    return decoded;
  } catch (error) {
    console.error('Token decode failed:', error);
    throw error;
  }
};