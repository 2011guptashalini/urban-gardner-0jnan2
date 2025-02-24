import React, { Suspense } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { ErrorBoundary } from 'react-error-boundary';

// Store and theme configuration
import store from './store';
import theme from './styles/theme';

// Layout components
import Header from './components/layout/Header/Header';
import Footer from './components/layout/Footer/Footer';

// Lazy-loaded page components
const Dashboard = React.lazy(() => import('./pages/Dashboard/Dashboard'));
const GardenPlanner = React.lazy(() => import('./pages/GardenPlanner/GardenPlanner'));
const CropManager = React.lazy(() => import('./pages/CropManager/CropManager'));
const MaintenanceScheduler = React.lazy(() => import('./pages/MaintenanceScheduler/MaintenanceScheduler'));
const Profile = React.lazy(() => import('./pages/Profile/Profile'));
const Settings = React.lazy(() => import('./pages/Settings/Settings'));
const Login = React.lazy(() => import('./pages/Auth/Login'));
const Register = React.lazy(() => import('./pages/Auth/Register'));

// Styled components
import { GlobalStyle, SkipLink, MainContent } from './App.styles';

/**
 * Error fallback component for the error boundary
 */
const ErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({
  error,
  resetErrorBoundary
}) => (
  <div role="alert" className="error-container">
    <h2>Something went wrong:</h2>
    <pre>{error.message}</pre>
    <button onClick={resetErrorBoundary}>Try again</button>
  </div>
);

/**
 * Root application component that sets up providers, routing, and main layout
 */
const App: React.FC = React.memo(() => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <GlobalStyle />
          <BrowserRouter>
            <SkipLink href="#main-content">
              Skip to main content
            </SkipLink>

            <Header />

            <MainContent id="main-content" role="main">
              <Suspense fallback={
                <div className="loading-spinner" role="status">
                  Loading...
                </div>
              }>
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Protected routes */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/garden-planner" element={<GardenPlanner />} />
                  <Route path="/crop-manager" element={<CropManager />} />
                  <Route path="/maintenance-scheduler" element={<MaintenanceScheduler />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />

                  {/* Redirect root to dashboard */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />

                  {/* 404 catch-all */}
                  <Route path="*" element={
                    <div className="not-found" role="alert">
                      <h1>404 - Page Not Found</h1>
                      <p>The requested page does not exist.</p>
                    </div>
                  } />
                </Routes>
              </Suspense>
            </MainContent>

            <Footer />
          </BrowserRouter>
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  );
});

// Display name for debugging
App.displayName = 'App';

export default App;