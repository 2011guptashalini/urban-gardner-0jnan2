/**
 * Redux slice for garden maintenance state management
 * Handles tasks, schedules, AI recommendations, and optimistic updates
 * @version 1.0.0
 */

import { createSlice, createAsyncThunk, createSelector, PayloadAction } from '@reduxjs/toolkit';
import {
  MaintenanceTask,
  MaintenanceTaskRequest,
  MaintenanceTaskList
} from '../../types/maintenance';
import {
  getAllMaintenanceTasks,
  createMaintenanceTask,
  updateMaintenanceTask,
  deleteMaintenanceTask,
  completeMaintenanceTask
} from '../../api/maintenance';

// State interface
interface MaintenanceState {
  tasks: MaintenanceTask[];
  taskLoadingStates: Record<string, boolean>;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  pageSize: number;
  lastUpdated: number;
  aiRecommendationsLoading: boolean;
}

// Initial state
const initialState: MaintenanceState = {
  tasks: [],
  taskLoadingStates: {},
  loading: false,
  error: null,
  total: 0,
  page: 1,
  pageSize: 10,
  lastUpdated: 0,
  aiRecommendationsLoading: false
};

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Async thunks
export const fetchMaintenanceTasks = createAsyncThunk(
  'maintenance/fetchTasks',
  async ({ page, pageSize, debounceMs = 300 }: { 
    page: number; 
    pageSize: number; 
    debounceMs?: number; 
  }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { maintenance: MaintenanceState };
      const now = Date.now();

      // Return cached data if still valid
      if (now - state.maintenance.lastUpdated < CACHE_DURATION) {
        return {
          tasks: state.maintenance.tasks,
          total: state.maintenance.total,
          page: state.maintenance.page,
          pageSize: state.maintenance.pageSize
        };
      }

      // Add debounce delay
      if (debounceMs > 0) {
        await new Promise(resolve => setTimeout(resolve, debounceMs));
      }

      const response = await getAllMaintenanceTasks(page, pageSize);
      return response;
    } catch (error) {
      console.error('Failed to fetch maintenance tasks:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const createTask = createAsyncThunk(
  'maintenance/createTask',
  async (taskData: MaintenanceTaskRequest, { rejectWithValue }) => {
    try {
      const response = await createMaintenanceTask(taskData);
      return response;
    } catch (error) {
      console.error('Failed to create maintenance task:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const updateTask = createAsyncThunk(
  'maintenance/updateTask',
  async ({ taskId, taskData }: { 
    taskId: string; 
    taskData: MaintenanceTaskRequest; 
  }, { rejectWithValue }) => {
    try {
      const response = await updateMaintenanceTask(taskId, taskData);
      return response;
    } catch (error) {
      console.error('Failed to update maintenance task:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const deleteTask = createAsyncThunk(
  'maintenance/deleteTask',
  async (taskId: string, { rejectWithValue }) => {
    try {
      await deleteMaintenanceTask(taskId);
      return taskId;
    } catch (error) {
      console.error('Failed to delete maintenance task:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const completeTask = createAsyncThunk(
  'maintenance/completeTask',
  async (taskId: string, { rejectWithValue }) => {
    try {
      const response = await completeMaintenanceTask(taskId);
      return response;
    } catch (error) {
      console.error('Failed to complete maintenance task:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Create the slice
const maintenanceSlice = createSlice({
  name: 'maintenance',
  initialState,
  reducers: {
    setTaskLoadingState: (state, action: PayloadAction<{ taskId: string; loading: boolean }>) => {
      state.taskLoadingStates[action.payload.taskId] = action.payload.loading;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetState: () => initialState
  },
  extraReducers: (builder) => {
    builder
      // Fetch tasks
      .addCase(fetchMaintenanceTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMaintenanceTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload.tasks;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pageSize = action.payload.pageSize;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchMaintenanceTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create task
      .addCase(createTask.pending, (state) => {
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.push(action.payload);
        state.total += 1;
        state.lastUpdated = Date.now();
      })
      .addCase(createTask.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Update task
      .addCase(updateTask.pending, (state) => {
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        state.lastUpdated = Date.now();
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Delete task
      .addCase(deleteTask.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(task => task.id !== action.payload);
        state.total -= 1;
        state.lastUpdated = Date.now();
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Complete task
      .addCase(completeTask.pending, (state, action) => {
        state.taskLoadingStates[action.meta.arg] = true;
        state.error = null;
      })
      .addCase(completeTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        state.taskLoadingStates[action.payload.id] = false;
        state.lastUpdated = Date.now();
      })
      .addCase(completeTask.rejected, (state, action) => {
        state.taskLoadingStates[action.meta.arg] = false;
        state.error = action.payload as string;
      });
  }
});

// Selectors
export const selectMaintenanceTasks = createSelector(
  [(state: { maintenance: MaintenanceState }) => state.maintenance],
  (maintenance) => maintenance.tasks
);

export const selectMaintenanceLoading = (state: { maintenance: MaintenanceState }) => 
  state.maintenance.loading;

export const selectTaskLoadingState = (state: { maintenance: MaintenanceState }, taskId: string) => 
  state.maintenance.taskLoadingStates[taskId] || false;

export const selectMaintenanceError = (state: { maintenance: MaintenanceState }) => 
  state.maintenance.error;

export const selectMaintenancePagination = createSelector(
  [(state: { maintenance: MaintenanceState }) => state.maintenance],
  (maintenance) => ({
    total: maintenance.total,
    page: maintenance.page,
    pageSize: maintenance.pageSize
  })
);

export const selectLastUpdated = (state: { maintenance: MaintenanceState }) => 
  state.maintenance.lastUpdated;

// Export actions and reducer
export const { setTaskLoadingState, clearError, resetState } = maintenanceSlice.actions;
export default maintenanceSlice.reducer;