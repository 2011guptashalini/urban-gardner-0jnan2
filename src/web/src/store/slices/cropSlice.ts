/**
 * @fileoverview Redux slice for managing crop state in the Urban Gardening Assistant
 * Implements requirements F-002-RQ-001 and F-002-RQ-002
 * @version 1.0.0
 */

import { createSlice, createAsyncThunk, createSelector, PayloadAction } from '@reduxjs/toolkit';
import { Crop, CreateCropRequest, YIELD_ACCURACY_THRESHOLD, SPACE_CAPACITY_WARNING_THRESHOLD } from '../../types/crops';
import { validateCropRequirements, ValidationResult } from '../../utils/validation';

// State interface for the crop slice
interface CropState {
  crops: Crop[];
  loading: boolean;
  error: string | null;
  selectedCrop: Crop | null;
  total: number;
  page: number;
  perPage: number;
  yieldAccuracy: number;
  spaceUtilization: number;
  spaceWarnings: string[];
  lastUpdate: Date | null;
  retryCount: number;
}

// Initial state with type safety
const initialState: CropState = {
  crops: [],
  loading: false,
  error: null,
  selectedCrop: null,
  total: 0,
  page: 1,
  perPage: 10,
  yieldAccuracy: 0,
  spaceUtilization: 0,
  spaceWarnings: [],
  lastUpdate: null,
  retryCount: 0
};

// Async thunk for fetching crops with pagination and error handling
export const fetchCrops = createAsyncThunk(
  'crops/fetchCrops',
  async ({ gardenId, page, perPage }: { gardenId: string; page: number; perPage: number }, { rejectWithValue, getState }) => {
    try {
      const response = await fetch(`/api/gardens/${gardenId}/crops?page=${page}&perPage=${perPage}`);
      if (!response.ok) throw new Error('Failed to fetch crops');
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async thunk for adding a new crop with yield validation
export const addCrop = createAsyncThunk(
  'crops/addCrop',
  async (cropData: CreateCropRequest, { rejectWithValue, getState }) => {
    try {
      // Validate crop requirements and space utilization
      const validationResult = validateCropRequirements(cropData, cropData.gardenId);
      
      if (!validationResult.isValid) {
        return rejectWithValue(validationResult.errors.join(', '));
      }

      const response = await fetch('/api/crops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cropData)
      });

      if (!response.ok) throw new Error('Failed to add crop');
      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Create the crop slice with reducers and actions
const cropSlice = createSlice({
  name: 'crops',
  initialState,
  reducers: {
    selectCrop: (state, action: PayloadAction<string>) => {
      state.selectedCrop = state.crops.find(crop => crop.id === action.payload) || null;
    },
    clearSelection: (state) => {
      state.selectedCrop = null;
    },
    updateYieldAccuracy: (state, action: PayloadAction<number>) => {
      state.yieldAccuracy = action.payload;
      if (Math.abs(action.payload) > YIELD_ACCURACY_THRESHOLD) {
        state.error = `Yield accuracy exceeds ${YIELD_ACCURACY_THRESHOLD * 100}% threshold`;
      }
    },
    updateSpaceUtilization: (state, action: PayloadAction<number>) => {
      state.spaceUtilization = action.payload;
      state.spaceWarnings = [];
      
      if (action.payload > SPACE_CAPACITY_WARNING_THRESHOLD) {
        state.spaceWarnings.push('Garden space utilization exceeds recommended threshold');
      }
    },
    clearErrors: (state) => {
      state.error = null;
      state.spaceWarnings = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchCrops states
      .addCase(fetchCrops.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCrops.fulfilled, (state, action) => {
        state.loading = false;
        state.crops = action.payload.crops;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.perPage = action.payload.perPage;
        state.lastUpdate = new Date();
        state.retryCount = 0;
      })
      .addCase(fetchCrops.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.retryCount += 1;
      })
      // Handle addCrop states
      .addCase(addCrop.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCrop.fulfilled, (state, action) => {
        state.loading = false;
        state.crops.push(action.payload);
        state.total += 1;
        state.lastUpdate = new Date();
      })
      .addCase(addCrop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

// Export actions and reducer
export const {
  selectCrop,
  clearSelection,
  updateYieldAccuracy,
  updateSpaceUtilization,
  clearErrors
} = cropSlice.actions;

export default cropSlice.reducer;

// Memoized selectors for performance optimization
export const selectCropMetrics = createSelector(
  [(state: { crops: CropState }) => state.crops],
  (cropState) => ({
    yieldAccuracy: cropState.yieldAccuracy,
    spaceUtilization: cropState.spaceUtilization,
    totalCrops: cropState.total
  })
);

export const selectSpaceWarnings = createSelector(
  [(state: { crops: CropState }) => state.crops],
  (cropState) => cropState.spaceWarnings
);

// Type-safe RootState accessor
export type RootState = {
  crops: CropState;
};