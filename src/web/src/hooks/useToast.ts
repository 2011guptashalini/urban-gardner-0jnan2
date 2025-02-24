import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { uiActions } from '../../store/slices/uiSlice';
import type { AppDispatch } from '../../store';

/**
 * Valid toast notification types with semantic meaning
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Configuration options for toast notifications
 */
export interface ToastOptions {
  /** Message to display in the toast */
  message: string;
  /** Type of toast notification */
  type: ToastType;
  /** Duration in milliseconds before auto-dismissal */
  duration?: number;
  /** ARIA live region setting for accessibility */
  ariaLive?: 'polite' | 'assertive';
}

/**
 * Custom hook for managing toast notifications with type safety and accessibility
 * Implements UI feedback requirements from technical specification
 * @returns Object containing show and hide toast functions
 */
export const useToast = () => {
  const dispatch = useDispatch<AppDispatch>();

  /**
   * Shows a toast notification with the specified options
   * Implements auto-dismissal and accessibility support
   */
  const showToast = useCallback((options: ToastOptions) => {
    const {
      message,
      type,
      duration = 5000, // Default duration: 5 seconds
      ariaLive = type === 'error' ? 'assertive' : 'polite'
    } = options;

    // Validate required parameters
    if (!message || !type) {
      console.error('Toast requires message and type');
      return;
    }

    // Generate unique ID for the toast
    const id = `toast-${Date.now()}`;

    // Dispatch toast show action
    dispatch(uiActions.addNotification({
      id,
      type,
      message,
      duration,
      dismissible: true,
      ariaLive
    }));

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        dispatch(uiActions.removeNotification(id));
      }, duration);
    }
  }, [dispatch]);

  /**
   * Manually hides a specific toast notification
   * @param id - Identifier of the toast to hide
   */
  const hideToast = useCallback((id: string) => {
    if (!id) {
      console.error('Toast ID required for hiding');
      return;
    }
    dispatch(uiActions.removeNotification(id));
  }, [dispatch]);

  return {
    /**
     * Shows a toast notification with the specified options
     * @param options - Toast configuration options
     */
    showToast,

    /**
     * Hides a specific toast notification
     * @param id - Toast identifier
     */
    hideToast
  };
};

export default useToast;