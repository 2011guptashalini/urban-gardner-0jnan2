/**
 * Authentication Redux Slice for Urban Gardening Assistant
 * Manages authentication state, JWT token handling, and user session management
 * @version 1.0.0
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'; // ^1.9.0
import { User, LoginRequest, CreateUserRequest, AuthResponse } from '../../types/user';
import { login, register, refreshToken } from '../../api/user';
import { handleAuthResponse } from '../../utils/auth';

// Constants for authentication management
const AUTH_CONSTANTS = {
  MAX_AUTH_ATTEMPTS: 5,
  ATTEMPT_RESET_TIME: 15 * 60 * 1000, // 15 minutes
  TOKEN_REFRESH_INTERVAL: 55 * 60 * 1000, // 55 minutes
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
} as const;

// Interface for authentication state
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastTokenRefresh: number | null;
  authAttempts: number;
  isRefreshing: boolean;
}

// Initial state definition
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  lastTokenRefresh: null,
  authAttempts: 0,
  isRefreshing: false,
};

/**
 * Async thunk for user login with rate limiting and retry logic
 */
export const loginUser = createAsyncThunk<User, LoginRequest>(
  'auth/login',
  async (credentials, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as { auth: AuthState };

      // Check rate limiting
      if (auth.authAttempts >= AUTH_CONSTANTS.MAX_AUTH_ATTEMPTS) {
        throw new Error('Too many login attempts. Please try again later.');
      }

      const response = await login(credentials);
      await handleAuthResponse(response);

      // Schedule token refresh
      setTimeout(() => {
        refreshUserToken(response.refreshToken);
      }, AUTH_CONSTANTS.TOKEN_REFRESH_INTERVAL);

      return response.user;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Async thunk for user registration with validation
 */
export const registerUser = createAsyncThunk<User, CreateUserRequest>(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await register(userData);
      await handleAuthResponse(response);

      // Schedule initial token refresh
      setTimeout(() => {
        refreshUserToken(response.refreshToken);
      }, AUTH_CONSTANTS.TOKEN_REFRESH_INTERVAL);

      return response.user;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Async thunk for token refresh with concurrency control
 */
export const refreshUserToken = createAsyncThunk<void, string>(
  'auth/refresh',
  async (refreshTokenStr, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as { auth: AuthState };

      // Prevent concurrent refresh attempts
      if (auth.isRefreshing) {
        return;
      }

      const response = await refreshToken(refreshTokenStr);
      await handleAuthResponse(response);

      // Schedule next refresh
      setTimeout(() => {
        refreshUserToken(response.refreshToken);
      }, AUTH_CONSTANTS.TOKEN_REFRESH_INTERVAL);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Authentication slice with reducers and actions
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    resetAuthAttempts: (state) => {
      state.authAttempts = 0;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      return { ...initialState };
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Login reducers
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.authAttempts += 1;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
        state.authAttempts = 0;
        state.lastTokenRefresh = Date.now();
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Registration reducers
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
        state.lastTokenRefresh = Date.now();
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Token refresh reducers
    builder
      .addCase(refreshUserToken.pending, (state) => {
        state.isRefreshing = true;
      })
      .addCase(refreshUserToken.fulfilled, (state) => {
        state.isRefreshing = false;
        state.lastTokenRefresh = Date.now();
      })
      .addCase(refreshUserToken.rejected, (state, action) => {
        state.isRefreshing = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload as string;
      });
  },
});

// Export actions and reducer
export const { resetAuthAttempts, clearAuthError, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;