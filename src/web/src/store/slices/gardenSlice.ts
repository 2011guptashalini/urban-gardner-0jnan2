/**
 * Redux slice for garden state management in Urban Gardening Assistant
 * Implements requirements F-001-RQ-001, F-001-RQ-002, F-001-RQ-003
 * @version 1.0.0
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Garden, MeasurementUnit, SoilType, SunlightCondition } from '../../types/garden';
import * as GardenAPI from '../../api/garden';
import { validateGardenDimensions } from '../../utils/validation';

// State interface with loading, error, and validation tracking
interface GardenState {
  gardens: Garden[];
  selectedGarden: Garden | null;
  loading: boolean;
  error: string | null;
  validationErrors: Record<string, string[]>;
  spaceUtilization: number;
  lastUpdated: number;
  cache: {
    timestamp: number;
    data: Garden[];
  };
}

// Initial state with type safety
const initialState: GardenState = {
  gardens: [],
  selectedGarden: null,
  loading: false,
  error: null,
  validationErrors: {},
  spaceUtilization: 0,
  lastUpdated: 0,
  cache: {
    timestamp: 0,
    data: []
  }
};

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Async thunk for fetching all gardens with caching
 */
export const fetchGardens = createAsyncThunk(
  'garden/fetchGardens',
  async (_, { rejectWithValue }) => {
    try {
      const gardens = await GardenAPI.getAllGardens();
      return gardens;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Async thunk for creating a new garden with validation
 */
export const createGarden = createAsyncThunk(
  'garden/createGarden',
  async (garden: Omit<Garden, 'id'>, { rejectWithValue }) => {
    try {
      // Validate dimensions before API call
      const validationResult = validateGardenDimensions(
        garden.dimensions,
        garden.dimensions.unit
      );

      if (!validationResult.isValid) {
        return rejectWithValue(validationResult.errors);
      }

      const createdGarden = await GardenAPI.createGarden(garden);
      return createdGarden;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Async thunk for updating garden details
 */
export const updateGarden = createAsyncThunk(
  'garden/updateGarden',
  async ({ id, garden }: { id: string; garden: Partial<Garden> }, { rejectWithValue }) => {
    try {
      if (garden.dimensions) {
        const validationResult = validateGardenDimensions(
          garden.dimensions,
          garden.dimensions.unit
        );

        if (!validationResult.isValid) {
          return rejectWithValue(validationResult.errors);
        }
      }

      const updatedGarden = await GardenAPI.updateGarden(id, garden);
      return updatedGarden;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Async thunk for deleting a garden
 */
export const deleteGarden = createAsyncThunk(
  'garden/deleteGarden',
  async (id: string, { rejectWithValue }) => {
    try {
      await GardenAPI.deleteGarden(id);
      return id;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Garden slice with comprehensive state management
 */
const gardenSlice = createSlice({
  name: 'garden',
  initialState,
  reducers: {
    setSelectedGarden: (state, action: PayloadAction<Garden | null>) => {
      state.selectedGarden = action.payload;
    },
    clearErrors: (state) => {
      state.error = null;
      state.validationErrors = {};
    },
    updateSpaceUtilization: (state, action: PayloadAction<number>) => {
      state.spaceUtilization = action.payload;
    },
    invalidateCache: (state) => {
      state.cache = {
        timestamp: 0,
        data: []
      };
    }
  },
  extraReducers: (builder) => {
    // Fetch gardens
    builder.addCase(fetchGardens.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchGardens.fulfilled, (state, action) => {
      state.loading = false;
      state.gardens = action.payload;
      state.cache = {
        timestamp: Date.now(),
        data: action.payload
      };
      state.lastUpdated = Date.now();
    });
    builder.addCase(fetchGardens.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create garden
    builder.addCase(createGarden.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createGarden.fulfilled, (state, action) => {
      state.loading = false;
      state.gardens.push(action.payload);
      state.lastUpdated = Date.now();
    });
    builder.addCase(createGarden.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update garden
    builder.addCase(updateGarden.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateGarden.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.gardens.findIndex(g => g.id === action.payload.id);
      if (index !== -1) {
        state.gardens[index] = action.payload;
      }
      if (state.selectedGarden?.id === action.payload.id) {
        state.selectedGarden = action.payload;
      }
      state.lastUpdated = Date.now();
    });
    builder.addCase(updateGarden.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Delete garden
    builder.addCase(deleteGarden.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteGarden.fulfilled, (state, action) => {
      state.loading = false;
      state.gardens = state.gardens.filter(g => g.id !== action.payload);
      if (state.selectedGarden?.id === action.payload) {
        state.selectedGarden = null;
      }
      state.lastUpdated = Date.now();
    });
    builder.addCase(deleteGarden.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  }
});

// Export actions
export const {
  setSelectedGarden,
  clearErrors,
  updateSpaceUtilization,
  invalidateCache
} = gardenSlice.actions;

// Memoized selectors
export const selectAllGardens = (state: { garden: GardenState }) => state.garden.gardens;
export const selectSelectedGarden = (state: { garden: GardenState }) => state.garden.selectedGarden;
export const selectGardenLoading = (state: { garden: GardenState }) => state.garden.loading;
export const selectGardenError = (state: { garden: GardenState }) => state.garden.error;
export const selectSpaceUtilization = (state: { garden: GardenState }) => state.garden.spaceUtilization;
export const selectGardenValidationErrors = (state: { garden: GardenState }) => state.garden.validationErrors;

// Export reducer
export default gardenSlice.reducer;