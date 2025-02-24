/**
 * Comprehensive testing utilities for React components with Redux integration
 * Provides enterprise-grade test setup, accessibility testing, and enhanced type safety
 * @version 1.0.0
 */

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { configureAxe, toHaveNoViolations } from 'jest-axe';
import { faker } from '@faker-js/faker';
import { Store, configureStore } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Import reducers
import uiReducer from '../store/slices/uiSlice';
import gardenReducer from '../store/slices/gardenSlice';
import cropReducer from '../store/slices/cropSlice';
import maintenanceReducer from '../store/slices/maintenanceSlice';
import authReducer from '../store/slices/authSlice';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Configure axe for accessibility testing
const axe = configureAxe({
  rules: {
    'color-contrast': { enabled: true },
    'aria-roles': { enabled: true },
    'button-name': { enabled: true },
    'image-alt': { enabled: true }
  }
});

/**
 * Interface for test wrapper options
 */
interface TestWrapperOptions {
  initialState?: Partial<RootState>;
  store?: Store;
  route?: string;
  theme?: any; // Material-UI theme
}

/**
 * Error boundary component for test environment
 */
class TestErrorBoundary extends React.Component<{ children: ReactNode, onError: (error: Error) => void }> {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Test Error Boundary caught error:', error, errorInfo);
    this.props.onError(error);
  }

  render() {
    return this.props.children;
  }
}

/**
 * Creates a configured test store with middleware and monitoring
 * @param preloadedState - Initial state for testing
 * @returns Configured Redux store
 */
export const createTestStore = (preloadedState?: Partial<RootState>) => {
  return configureStore({
    reducer: {
      ui: uiReducer,
      garden: gardenReducer,
      crops: cropReducer,
      maintenance: maintenanceReducer,
      auth: authReducer
    },
    preloadedState: preloadedState as any,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: true
      })
  });
};

/**
 * Enhanced render function with Redux Provider, Router, and Theme
 * @param ui - Component to render
 * @param options - Test wrapper options
 * @returns Enhanced render result with additional utilities
 */
export const renderWithProviders = (
  ui: ReactElement,
  {
    initialState = {},
    store = createTestStore(initialState),
    route = '/',
    theme = {},
    ...renderOptions
  }: TestWrapperOptions & Omit<RenderOptions, 'wrapper'> = {}
): RenderResult & { store: Store } => {
  window.history.pushState({}, 'Test page', route);

  const Wrapper = ({ children }: { children: ReactNode }) => {
    return (
      <TestErrorBoundary onError={(error) => console.error('Test Error:', error)}>
        <Provider store={store}>
          <BrowserRouter>
            <ThemeProvider theme={theme}>
              {children}
            </ThemeProvider>
          </BrowserRouter>
        </Provider>
      </TestErrorBoundary>
    );
  };

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    // Additional test utilities
    async findByDataTestId(testId: string) {
      return screen.findByTestId(testId);
    },
    async waitForLoadingToFinish() {
      await waitFor(() => {
        const loadingElements = screen.queryAllByRole('progressbar');
        expect(loadingElements).toHaveLength(0);
      });
    },
    async checkAccessibility() {
      const results = await axe(document.body);
      expect(results).toHaveNoViolations();
    }
  };
};

/**
 * Generates realistic test data using faker
 * @param options - Data generation options
 * @returns Generated test data
 */
export const generateTestData = {
  garden: () => ({
    id: faker.string.uuid(),
    name: faker.lorem.words(2),
    dimensions: {
      length: faker.number.float({ min: 2, max: 100 }),
      width: faker.number.float({ min: 2, max: 100 }),
      unit: faker.helpers.arrayElement(['feet', 'meters'])
    },
    soilType: faker.helpers.arrayElement(['red_soil', 'sandy_soil', 'loamy_soil', 'clay_soil', 'black_soil']),
    sunlight: faker.helpers.arrayElement(['full_sun', 'partial_shade', 'full_shade'])
  }),
  crop: () => ({
    id: faker.string.uuid(),
    name: faker.lorem.word(),
    quantityNeeded: faker.number.int({ min: 1, max: 1000 }),
    growBags: faker.number.int({ min: 1, max: 20 }),
    bagSize: faker.helpers.arrayElement(['8"', '10"', '12"', '14"'])
  }),
  maintenanceTask: () => ({
    id: faker.string.uuid(),
    taskType: faker.helpers.arrayElement(['Fertilizer', 'Water', 'Composting']),
    frequency: faker.helpers.arrayElement(['Daily', 'Weekly', 'BiWeekly', 'Monthly']),
    amount: faker.number.float({ min: 1, max: 1000 }),
    unit: faker.helpers.arrayElement(['g', 'ml', 'L', 'kg']),
    preferredTime: faker.helpers.arrayElement(['Morning', 'Afternoon', 'Evening', 'Night'])
  }),
  user: () => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent()
  })
};

/**
 * Configures accessibility testing environment
 * @param options - Accessibility testing options
 */
export const setupAccessibilityTest = (options = {}) => {
  const axeConfig = {
    rules: {
      'color-contrast': { enabled: true },
      'aria-roles': { enabled: true },
      ...options
    }
  };
  return configureAxe(axeConfig);
};

// Export commonly used testing utilities
export { screen, waitFor, within, userEvent };