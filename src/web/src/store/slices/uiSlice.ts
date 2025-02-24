import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';

// Interface definitions for UI state management
interface ModalState {
  visible: boolean;
  ariaLabel: string;
  focusAfterClose: string;
  preventScroll: boolean;
}

interface TooltipState {
  visible: boolean;
  position: {
    x: number;
    y: number;
  };
  content: string;
}

interface LoadingState {
  isLoading: boolean;
  progress: number;
  message: string;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration: number;
  dismissible: boolean;
  ariaLive: 'polite' | 'assertive';
}

interface ErrorState {
  message: string;
  code: string;
  field: string;
}

interface UIState {
  modals: Record<string, ModalState>;
  tooltips: Record<string, TooltipState>;
  loading: Record<string, LoadingState>;
  notifications: Notification[];
  errors: Record<string, ErrorState>;
}

// Initial state with type safety
const initialState: UIState = {
  modals: {},
  tooltips: {},
  loading: {},
  notifications: [],
  errors: {}
};

// Create the UI slice with reducers and actions
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showModal: (state, action: PayloadAction<{
      modalId: string;
      ariaLabel: string;
      focusAfterClose?: string;
      preventScroll?: boolean;
    }>) => {
      const { modalId, ariaLabel, focusAfterClose, preventScroll } = action.payload;
      state.modals[modalId] = {
        visible: true,
        ariaLabel,
        focusAfterClose: focusAfterClose || 'body',
        preventScroll: preventScroll || false
      };
    },

    hideModal: (state, action: PayloadAction<string>) => {
      const modalId = action.payload;
      if (state.modals[modalId]) {
        state.modals[modalId].visible = false;
      }
    },

    showTooltip: (state, action: PayloadAction<{
      tooltipId: string;
      content: string;
      position: { x: number; y: number };
    }>) => {
      const { tooltipId, content, position } = action.payload;
      state.tooltips[tooltipId] = {
        visible: true,
        content,
        position
      };
    },

    hideTooltip: (state, action: PayloadAction<string>) => {
      const tooltipId = action.payload;
      if (state.tooltips[tooltipId]) {
        state.tooltips[tooltipId].visible = false;
      }
    },

    setLoading: (state, action: PayloadAction<{
      key: string;
      isLoading: boolean;
      progress?: number;
      message?: string;
    }>) => {
      const { key, isLoading, progress, message } = action.payload;
      state.loading[key] = {
        isLoading,
        progress: progress || 0,
        message: message || ''
      };
    },

    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const id = `notification-${Date.now()}`;
      state.notifications.push({
        ...action.payload,
        id,
        ariaLive: action.payload.type === 'error' ? 'assertive' : 'polite'
      });
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },

    setError: (state, action: PayloadAction<{
      key: string;
      error: ErrorState;
    }>) => {
      const { key, error } = action.payload;
      state.errors[key] = error;
    },

    clearError: (state, action: PayloadAction<string>) => {
      const key = action.payload;
      delete state.errors[key];
    }
  }
});

// Memoized selectors for efficient state access
export const selectModal = (modalId: string) => createSelector(
  (state: { ui: UIState }) => state.ui.modals,
  (modals) => modals[modalId] || { visible: false, ariaLabel: '', focusAfterClose: 'body', preventScroll: false }
);

export const selectTooltip = (tooltipId: string) => createSelector(
  (state: { ui: UIState }) => state.ui.tooltips,
  (tooltips) => tooltips[tooltipId] || { visible: false, content: '', position: { x: 0, y: 0 } }
);

export const selectLoading = (key: string) => createSelector(
  (state: { ui: UIState }) => state.ui.loading,
  (loading) => loading[key] || { isLoading: false, progress: 0, message: '' }
);

export const selectNotifications = createSelector(
  (state: { ui: UIState }) => state.ui.notifications,
  (notifications) => notifications
);

export const selectError = (key: string) => createSelector(
  (state: { ui: UIState }) => state.ui.errors,
  (errors) => errors[key]
);

// Export actions and reducer
export const uiActions = uiSlice.actions;
export default uiSlice.reducer;