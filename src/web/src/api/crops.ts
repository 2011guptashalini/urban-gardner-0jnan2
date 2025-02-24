/**
 * API client module for crop management in Urban Gardening Assistant
 * Implements requirements F-002-RQ-001 (Crop yield calculation) and F-002-RQ-002 (Space capacity warning)
 * @version 1.0.0
 */

import axiosInstance from './axios';
import { API_ENDPOINTS } from '../constants/api';
import {
  Crop,
  CreateCropRequest,
  UpdateCropRequest,
  CropListResponse,
  YIELD_ACCURACY_THRESHOLD,
  SPACE_CAPACITY_WARNING_THRESHOLD
} from '../types/crops';

/**
 * Retrieves a paginated list of crops with space utilization metrics
 * @param gardenId - Garden identifier
 * @param page - Page number (1-based)
 * @param perPage - Items per page
 * @returns Promise resolving to paginated crop list with utilization data
 */
export const getCrops = async (
  gardenId: string,
  page: number = 1,
  perPage: number = 10
): Promise<CropListResponse> => {
  try {
    const response = await axiosInstance.get<CropListResponse>(API_ENDPOINTS.CROPS.GET_ALL, {
      params: {
        gardenId,
        page,
        perPage
      }
    });

    // Add space utilization warnings
    const cropsWithWarnings = response.crops.map(crop => ({
      ...crop,
      isOverCapacity: crop.spaceUtilization > SPACE_CAPACITY_WARNING_THRESHOLD
    }));

    return {
      ...response,
      crops: cropsWithWarnings
    };
  } catch (error) {
    console.error('Failed to fetch crops:', error);
    throw error;
  }
};

/**
 * Retrieves detailed crop information by ID with yield metrics
 * @param cropId - Crop identifier
 * @returns Promise resolving to crop details with yield accuracy
 */
export const getCropById = async (cropId: string): Promise<Crop> => {
  try {
    const crop = await axiosInstance.get<Crop>(
      API_ENDPOINTS.CROPS.GET_BY_ID.replace(':id', cropId)
    );

    // Calculate yield accuracy and add warning if needed
    const yieldAccuracy = Math.abs(
      (crop.actualYield - crop.estimatedYield) / crop.estimatedYield
    );

    return {
      ...crop,
      yieldAccuracy,
      isOverCapacity: crop.spaceUtilization > SPACE_CAPACITY_WARNING_THRESHOLD
    };
  } catch (error) {
    console.error('Failed to fetch crop details:', error);
    throw error;
  }
};

/**
 * Creates a new crop with space and yield validation
 * Implements F-002-RQ-001 and F-002-RQ-002 requirements
 * @param cropData - Crop creation request data
 * @returns Promise resolving to created crop with validation results
 */
export const createCrop = async (cropData: CreateCropRequest): Promise<Crop> => {
  try {
    // Validate minimum requirements
    if (cropData.growBags < 1 || cropData.quantityNeeded < 1) {
      throw new Error('Invalid grow bags or quantity needed values');
    }

    const response = await axiosInstance.post<Crop>(
      API_ENDPOINTS.CROPS.CREATE,
      cropData
    );

    // Validate yield accuracy
    const yieldAccuracy = Math.abs(
      (response.actualYield - response.estimatedYield) / response.estimatedYield
    );

    if (yieldAccuracy > YIELD_ACCURACY_THRESHOLD) {
      console.warn(`Yield accuracy (${yieldAccuracy}) exceeds 10% threshold`);
    }

    return {
      ...response,
      yieldAccuracy,
      isOverCapacity: response.spaceUtilization > SPACE_CAPACITY_WARNING_THRESHOLD
    };
  } catch (error) {
    console.error('Failed to create crop:', error);
    throw error;
  }
};

/**
 * Updates an existing crop with recalculated metrics
 * @param cropId - Crop identifier
 * @param cropData - Crop update request data
 * @returns Promise resolving to updated crop with new metrics
 */
export const updateCrop = async (
  cropId: string,
  cropData: UpdateCropRequest
): Promise<Crop> => {
  try {
    const response = await axiosInstance.put<Crop>(
      API_ENDPOINTS.CROPS.UPDATE.replace(':id', cropId),
      cropData
    );

    // Recalculate yield accuracy
    const yieldAccuracy = Math.abs(
      (response.actualYield - response.estimatedYield) / response.estimatedYield
    );

    return {
      ...response,
      yieldAccuracy,
      isOverCapacity: response.spaceUtilization > SPACE_CAPACITY_WARNING_THRESHOLD
    };
  } catch (error) {
    console.error('Failed to update crop:', error);
    throw error;
  }
};

/**
 * Deletes a crop and recalculates garden metrics
 * @param cropId - Crop identifier
 * @returns Promise resolving to void on successful deletion
 */
export const deleteCrop = async (cropId: string): Promise<void> => {
  try {
    await axiosInstance.delete(
      API_ENDPOINTS.CROPS.DELETE.replace(':id', cropId)
    );
  } catch (error) {
    console.error('Failed to delete crop:', error);
    throw error;
  }
};