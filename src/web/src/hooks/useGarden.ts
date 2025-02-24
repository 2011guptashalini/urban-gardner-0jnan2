/**
 * Custom React hook for managing garden state and operations
 * Implements requirements F-001-RQ-001, F-001-RQ-002, and F-002-RQ-002
 * @version 1.0.0
 */

import { useCallback, useEffect } from 'react'; // ^18.2.0
import { useDispatch, useSelector } from 'react-redux'; // ^8.0.5
import { Garden, CreateGardenRequest, UpdateGardenRequest } from '../types/garden';
import {
  fetchGardens,
  fetchGardenById,
  createNewGarden,
  updateExistingGarden,
  removeGarden,
  calculateSpace,
  selectGardens,
  selectSelectedGarden,
  selectGardenLoading,
  selectGardenError,
  selectSpaceCalculation
} from '../store/slices/gardenSlice';

/**
 * Hook return type definition for better type safety
 */
interface UseGardenReturn {
  // State
  gardens: Garden[];
  selectedGarden: Garden | null;
  loading: boolean;
  error: string | null;
  spaceCalculation: {
    totalArea: number;
    usableArea: number;
    capacityPercentage: number;
  } | null;

  // Operations
  fetchAllGardens: () => Promise<void>;
  fetchGarden: (id: string) => Promise<void>;
  createGarden: (data: CreateGardenRequest) => Promise<void>;
  updateGarden: (id: string, data: UpdateGardenRequest) => Promise<void>;
  deleteGarden: (id: string) => Promise<void>;
  calculateGardenSpace: (id: string) => Promise<void>;
}

/**
 * Custom hook for managing garden state and operations
 * Provides comprehensive garden management functionality with error handling
 */
export const useGarden = (): UseGardenReturn => {
  const dispatch = useDispatch();

  // Select garden state from Redux store
  const gardens = useSelector(selectGardens);
  const selectedGarden = useSelector(selectSelectedGarden);
  const loading = useSelector(selectGardenLoading);
  const error = useSelector(selectGardenError);
  const spaceCalculation = useSelector(selectSpaceCalculation);

  /**
   * Fetches all gardens for the current user
   * Implements error handling and loading state management
   */
  const fetchAllGardens = useCallback(async () => {
    try {
      await dispatch(fetchGardens()).unwrap();
    } catch (error) {
      console.error('Failed to fetch gardens:', error);
      throw error;
    }
  }, [dispatch]);

  /**
   * Fetches a specific garden by ID
   * @param id - Garden identifier
   */
  const fetchGarden = useCallback(async (id: string) => {
    if (!id) {
      throw new Error('Garden ID is required');
    }

    try {
      await dispatch(fetchGardenById(id)).unwrap();
    } catch (error) {
      console.error(`Failed to fetch garden ${id}:`, error);
      throw error;
    }
  }, [dispatch]);

  /**
   * Creates a new garden with validation
   * Implements requirement F-001-RQ-001 for dimension validation
   * @param data - Garden creation request data
   */
  const createGarden = useCallback(async (data: CreateGardenRequest) => {
    try {
      await dispatch(createNewGarden(data)).unwrap();
      await fetchAllGardens(); // Refresh garden list
    } catch (error) {
      console.error('Failed to create garden:', error);
      throw error;
    }
  }, [dispatch, fetchAllGardens]);

  /**
   * Updates an existing garden with validation
   * @param id - Garden identifier
   * @param data - Garden update request data
   */
  const updateGarden = useCallback(async (id: string, data: UpdateGardenRequest) => {
    if (!id) {
      throw new Error('Garden ID is required');
    }

    try {
      await dispatch(updateExistingGarden({ id, data })).unwrap();
      await fetchAllGardens(); // Refresh garden list
    } catch (error) {
      console.error(`Failed to update garden ${id}:`, error);
      throw error;
    }
  }, [dispatch, fetchAllGardens]);

  /**
   * Deletes a garden with confirmation
   * @param id - Garden identifier
   */
  const deleteGarden = useCallback(async (id: string) => {
    if (!id) {
      throw new Error('Garden ID is required');
    }

    try {
      await dispatch(removeGarden(id)).unwrap();
      await fetchAllGardens(); // Refresh garden list
    } catch (error) {
      console.error(`Failed to delete garden ${id}:`, error);
      throw error;
    }
  }, [dispatch, fetchAllGardens]);

  /**
   * Calculates garden space utilization
   * Implements requirement F-002-RQ-002 for space capacity warnings
   * @param id - Garden identifier
   */
  const calculateGardenSpace = useCallback(async (id: string) => {
    if (!id) {
      throw new Error('Garden ID is required');
    }

    try {
      await dispatch(calculateSpace(id)).unwrap();
    } catch (error) {
      console.error(`Failed to calculate garden space for ${id}:`, error);
      throw error;
    }
  }, [dispatch]);

  /**
   * Effect to fetch gardens on mount
   * Implements automatic data refresh
   */
  useEffect(() => {
    fetchAllGardens().catch(error => {
      console.error('Initial garden fetch failed:', error);
    });
  }, [fetchAllGardens]);

  return {
    // State
    gardens,
    selectedGarden,
    loading,
    error,
    spaceCalculation,

    // Operations
    fetchAllGardens,
    fetchGarden,
    createGarden,
    updateGarden,
    deleteGarden,
    calculateGardenSpace
  };
};