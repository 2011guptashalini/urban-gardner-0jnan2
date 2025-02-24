import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { ErrorBoundary } from 'react-error-boundary';
import * as Sentry from '@sentry/react';

// Internal imports
import App from './App';
import store from './store';
import GlobalStyles from './styles/global';

// Initialize Sentry for error monitoring in production
if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: process.env.REACT_APP_ENVIRONMENT || 'production',
    tracesSampleRate: 0.2,
    integrations: [
      new Sentry.BrowserTracing({
        tracingOrigins: ['localhost', process.env.REACT_APP_API_URL || ''],
      }),
    ],
  });
}

/**
 * Error Fallback component for the root error boundary
 */
const ErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({
  error,
  resetErrorBoundary
}) => (
  <div role="alert" style={{ padding: '20px', textAlign: 'center' }}>
    <h2>Something went wrong:</h2>
    <pre style={{ color: 'red', margin: '10px 0' }}>{error.message}</pre>
    <button
      onClick={resetErrorBoundary}
      style={{
        padding: '8px 16px',
        backgroundColor: '#2E7D32',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      Try again
    </button>
  </div>
);

/**
 * Root element initialization
 * Creates root element if it doesn't exist
 */
const rootElement = document.getElementById('root') || (() => {
  const element = document.createElement('div');
  element.id = 'root';
  document.body.appendChild(element);
  return element;
})();

/**
 * Create React root using new createRoot API
 */
const root = ReactDOM.createRoot(rootElement);

/**
 * Register service worker for PWA support in production
 */
if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        console.log('SW registered:', registration);
      })
      .catch(error => {
        console.error('SW registration failed:', error);
      });
  });
}

/**
 * Root application render with error boundary, Redux provider, and global styles
 * Implements strict mode in development for additional checks
 */
root.render(
  process.env.NODE_ENV === 'development' ? (
    <React.StrictMode>
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => window.location.reload()}
        onError={(error) => {
          console.error('Root error boundary caught error:', error);
          if (process.env.NODE_ENV === 'production') {
            Sentry.captureException(error);
          }
        }}
      >
        <Provider store={store}>
          <GlobalStyles />
          <App />
        </Provider>
      </ErrorBoundary>
    </React.StrictMode>
  ) : (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
      onError={(error) => {
        console.error('Root error boundary caught error:', error);
        Sentry.captureException(error);
      }}
    >
      <Provider store={store}>
        <GlobalStyles />
        <App />
      </Provider>
    </ErrorBoundary>
  )
);

// Enable hot module replacement in development
if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept('./App', () => {
    console.log('Hot reloading App component');
  });
}