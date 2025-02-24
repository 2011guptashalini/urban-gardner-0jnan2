/**
 * @fileoverview Custom React hook for managing crop operations with enhanced validation
 * Implements requirements F-002-RQ-001 and F-002-RQ-002
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Result } from 'typescript-result';
import { 
  Crop, 
  CreateCropRequest, 
  UpdateCropRequest,
  YIELD_ACCURACY_THRESHOLD,
  SPACE_CAPACITY_WARNING_THRESHOLD 
} from '../types/crops';
import { cropActions, cropSelectors } from '../store/slices/cropSlice';
import { validateCropRequirements } from '../utils/validation';

interface UseCropsOptions {
  pageSize?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  retryAttempts?: number;
}

const DEFAULT_OPTIONS: Required<UseCropsOptions> = {
  pageSize: 10,
  autoRefresh: true,
  refreshInterval: 30000, // 30 seconds
  retryAttempts: 3
};

/**
 * Custom hook for managing crops with enhanced validation and monitoring
 * @param gardenId - ID of the garden to manage crops for
 * @param options - Configuration options for the hook
 */
export function useCrops(gardenId: string, options: UseCropsOptions = {}) {
  const dispatch = useDispatch();
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  // Local state
  const [page, setPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Redux selectors
  const crops = useSelector(cropSelectors.selectCrops);
  const loading = useSelector(cropSelectors.selectLoading);
  const error = useSelector(cropSelectors.selectError);
  const spaceUtilization = useSelector(cropSelectors.selectSpaceUtilization);

  // Memoized pagination data
  const pagination = useMemo(() => ({
    page,
    pageSize: mergedOptions.pageSize,
    total: crops.length,
    hasNextPage: crops.length === mergedOptions.pageSize,
    hasPreviousPage: page > 1
  }), [crops.length, page, mergedOptions.pageSize]);

  /**
   * Fetches crops with pagination and error handling
   */
  const fetchCrops = useCallback(async () => {
    try {
      await dispatch(cropActions.fetchCrops({
        gardenId,
        page,
        perPage: mergedOptions.pageSize
      })).unwrap();
      setLastRefresh(new Date());
      setRetryCount(0);
    } catch (error) {
      if (retryCount < mergedOptions.retryAttempts) {
        setRetryCount(prev => prev + 1);
        setTimeout(fetchCrops, 1000 * Math.pow(2, retryCount));
      }
    }
  }, [dispatch, gardenId, page, mergedOptions.pageSize, retryCount]);

  /**
   * Creates a new crop with space validation
   * Implements requirement F-002-RQ-002
   */
  const createCrop = useCallback(async (cropData: CreateCropRequest): Promise<Result<Crop, Error>> => {
    try {
      const validationResult = validateCropRequirements(cropData, gardenId);
      
      if (!validationResult.isValid) {
        return Result.err(new Error(validationResult.errors.join(', ')));
      }

      if (validationResult.data?.spaceUtilization > SPACE_CAPACITY_WARNING_THRESHOLD) {
        return Result.err(new Error('Garden space capacity exceeded'));
      }

      const newCrop = await dispatch(cropActions.addCrop(cropData)).unwrap();
      return Result.ok(newCrop);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error('Failed to create crop'));
    }
  }, [dispatch, gardenId]);

  /**
   * Updates an existing crop with yield accuracy validation
   * Implements requirement F-002-RQ-001
   */
  const updateCrop = useCallback(async (
    cropId: string, 
    cropData: UpdateCropRequest
  ): Promise<Result<Crop, Error>> => {
    try {
      const validationResult = validateCropRequirements({
        ...crops.find(c => c.id === cropId),
        ...cropData
      }, gardenId);

      if (!validationResult.isValid) {
        return Result.err(new Error(validationResult.errors.join(', ')));
      }

      const updatedCrop = await dispatch(cropActions.updateCropDetails({
        cropId,
        ...cropData
      })).unwrap();

      // Validate yield accuracy
      if (Math.abs(updatedCrop.yieldAccuracy) > YIELD_ACCURACY_THRESHOLD) {
        dispatch(cropActions.updateYieldAccuracy(updatedCrop.yieldAccuracy));
      }

      return Result.ok(updatedCrop);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error('Failed to update crop'));
    }
  }, [dispatch, crops, gardenId]);

  /**
   * Deletes a crop and updates space utilization
   */
  const deleteCrop = useCallback(async (cropId: string): Promise<Result<void, Error>> => {
    try {
      await dispatch(cropActions.removeCrop(cropId)).unwrap();
      return Result.ok(void 0);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error('Failed to delete crop'));
    }
  }, [dispatch]);

  /**
   * Calculates crop yield with accuracy monitoring
   * Implements requirement F-002-RQ-001
   */
  const calculateYield = useCallback(async (cropId: string): Promise<Result<number, Error>> => {
    try {
      const yield_ = await dispatch(cropActions.calculateCropYields(cropId)).unwrap();
      const accuracy = Math.abs((yield_ - crops.find(c => c.id === cropId)?.estimatedYield!) / yield_);
      
      dispatch(cropActions.updateYieldAccuracy(accuracy));
      return Result.ok(yield_);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error('Failed to calculate yield'));
    }
  }, [dispatch, crops]);

  // Set up auto-refresh
  useEffect(() => {
    if (!mergedOptions.autoRefresh) return;

    const intervalId = setInterval(fetchCrops, mergedOptions.refreshInterval);
    return () => clearInterval(intervalId);
  }, [fetchCrops, mergedOptions.autoRefresh, mergedOptions.refreshInterval]);

  // Initial fetch
  useEffect(() => {
    fetchCrops();
  }, [fetchCrops]);

  return {
    // State
    crops,
    loading,
    error,
    spaceUtilization,
    pagination,
    lastRefresh,

    // Actions
    createCrop,
    updateCrop,
    deleteCrop,
    calculateYield,
    refreshCrops: fetchCrops,
    setPage,

    // Helpers
    hasWarning: spaceUtilization > SPACE_CAPACITY_WARNING_THRESHOLD,
    isRetrying: retryCount > 0,
    retryAttempts: mergedOptions.retryAttempts - retryCount
  };
}