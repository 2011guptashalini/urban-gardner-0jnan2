/**
 * Root Redux store configuration for Urban Gardening Assistant
 * Combines all feature slices and configures middleware with performance optimizations
 * @version 1.0.0
 */

import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';

// Import feature slices
import uiReducer from './slices/uiSlice';
import gardenReducer from './slices/gardenSlice';
import cropReducer from './slices/cropSlice';
import maintenanceReducer from './slices/maintenanceSlice';
import authReducer from './slices/authSlice';

// Custom error handling middleware
const errorMiddleware = () => (next: any) => (action: any) => {
  try {
    return next(action);
  } catch (error) {
    console.error('Redux Error:', error);
    throw error;
  }
};

// Configure Redux store with all reducers and middleware
const store = configureStore({
  reducer: {
    ui: uiReducer,
    garden: gardenReducer,
    crops: cropReducer,
    maintenance: maintenanceReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) => {
    const middleware = getDefaultMiddleware({
      // Middleware configuration
      serializableCheck: {
        // Ignore these action types in serialization checks
        ignoredActions: ['auth/login/fulfilled', 'auth/register/fulfilled'],
        // Ignore these paths in serialization checks
        ignoredPaths: ['auth.user.createdAt', 'auth.user.updatedAt'],
      },
      immutableCheck: true,
      thunk: {
        extraArgument: undefined,
      },
    }).concat(errorMiddleware);

    // Add logger middleware in development only
    if (process.env.NODE_ENV === 'development') {
      middleware.push(
        createLogger({
          collapsed: true,
          duration: true,
          timestamp: false,
          colors: {
            title: () => '#139BFE',
            prevState: () => '#9E9E9E',
            action: () => '#149945',
            nextState: () => '#A47104',
            error: () => '#FF0000',
          },
        })
      );
    }

    return middleware;
  },
  devTools: {
    // Redux DevTools configuration
    name: 'Urban Gardening Assistant',
    maxAge: 25,
    latency: 500,
    trace: true,
    traceLimit: 25,
  },
  // Performance optimizations
  preloadedState: undefined,
  enhancers: undefined,
});

// Export type-safe hooks and store instance
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export default store;