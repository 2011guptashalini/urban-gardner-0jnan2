/**
 * Garden API client implementation for Urban Gardening Assistant
 * Implements secure garden-related API operations with validation and error handling
 * @version 1.0.0
 * @package @urban-gardening-assistant/web
 */

import { debounce } from 'lodash';
import retry from 'axios-retry';
import axiosInstance from './axios';
import { API_ENDPOINTS } from '../constants/api';
import { Garden, CreateGardenRequest, UpdateGardenRequest, validateGardenDimensions } from '../types/garden';

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const gardenCache = new Map<string, { data: Garden; timestamp: number }>();

// Configure retry logic for failed requests
retry(axiosInstance, {
  retries: 3,
  retryDelay: retry.exponentialDelay,
  retryCondition: (error) => {
    return retry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429;
  }
});

/**
 * Validates and retrieves all gardens for the authenticated user
 * Implements caching for improved performance
 * @returns Promise<Garden[]> List of user's gardens
 */
export const getAllGardens = async (): Promise<Garden[]> => {
  try {
    // Check cache first
    const now = Date.now();
    const cachedGardens = Array.from(gardenCache.values())
      .filter(entry => now - entry.timestamp < CACHE_TTL)
      .map(entry => entry.data);

    if (cachedGardens.length > 0) {
      return cachedGardens;
    }

    const response = await axiosInstance.get<Garden[]>(API_ENDPOINTS.GARDEN.GET_ALL);
    const gardens = response.data;

    // Update cache
    gardens.forEach(garden => {
      gardenCache.set(garden.id, { data: garden, timestamp: now });
    });

    return gardens;
  } catch (error) {
    console.error('Failed to fetch gardens:', error);
    throw error;
  }
};

/**
 * Retrieves a specific garden by ID with validation
 * @param id Garden identifier
 * @returns Promise<Garden> Garden details
 */
export const getGardenById = async (id: string): Promise<Garden> => {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid garden ID');
  }

  try {
    // Check cache first
    const cached = gardenCache.get(id);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const response = await axiosInstance.get<Garden>(
      API_ENDPOINTS.GARDEN.GET_BY_ID.replace(':id', id)
    );
    const garden = response.data;

    // Update cache
    gardenCache.set(id, { data: garden, timestamp: Date.now() });

    return garden;
  } catch (error) {
    console.error(`Failed to fetch garden ${id}:`, error);
    throw error;
  }
};

/**
 * Creates a new garden with comprehensive validation
 * Implements requirement F-001-RQ-001 for dimension validation
 * @param data Garden creation request data
 * @returns Promise<Garden> Created garden details
 */
export const createGarden = async (data: CreateGardenRequest): Promise<Garden> => {
  try {
    // Validate dimensions
    const dimensionValidation = validateGardenDimensions(
      data.dimensions,
      data.dimensions.unit
    );

    if (!dimensionValidation.isValid) {
      throw new Error(`Invalid garden dimensions: ${dimensionValidation.errors.join(', ')}`);
    }

    const response = await axiosInstance.post<Garden>(
      API_ENDPOINTS.GARDEN.CREATE,
      data
    );
    const garden = response.data;

    // Update cache
    gardenCache.set(garden.id, { data: garden, timestamp: Date.now() });

    return garden;
  } catch (error) {
    console.error('Failed to create garden:', error);
    throw error;
  }
};

/**
 * Updates an existing garden with validation
 * Implements space planning requirements with dimension validation
 * @param id Garden identifier
 * @param data Garden update request data
 * @returns Promise<Garden> Updated garden details
 */
export const updateGarden = async (
  id: string,
  data: UpdateGardenRequest
): Promise<Garden> => {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid garden ID');
  }

  try {
    // Validate dimensions if included in update
    if (data.dimensions) {
      const dimensionValidation = validateGardenDimensions(
        data.dimensions,
        data.dimensions.unit
      );

      if (!dimensionValidation.isValid) {
        throw new Error(`Invalid garden dimensions: ${dimensionValidation.errors.join(', ')}`);
      }
    }

    const response = await axiosInstance.put<Garden>(
      API_ENDPOINTS.GARDEN.UPDATE.replace(':id', id),
      data
    );
    const garden = response.data;

    // Update cache
    gardenCache.set(garden.id, { data: garden, timestamp: Date.now() });

    return garden;
  } catch (error) {
    console.error(`Failed to update garden ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a garden by ID with cleanup
 * @param id Garden identifier
 * @returns Promise<void>
 */
export const deleteGarden = async (id: string): Promise<void> => {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid garden ID');
  }

  try {
    await axiosInstance.delete(API_ENDPOINTS.GARDEN.DELETE.replace(':id', id));
    
    // Remove from cache
    gardenCache.delete(id);
  } catch (error) {
    console.error(`Failed to delete garden ${id}:`, error);
    throw error;
  }
};

/**
 * Retrieves garden space analysis with debounced requests
 * Implements requirement F-001-RQ-001 for space optimization
 * @param id Garden identifier
 * @returns Promise<SpaceAnalysis> Garden space analysis
 */
export const getGardenSpaceAnalysis = debounce(async (id: string) => {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid garden ID');
  }

  try {
    const response = await axiosInstance.get(
      API_ENDPOINTS.GARDEN.GET_SPACE_ANALYSIS.replace(':id', id)
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to get space analysis for garden ${id}:`, error);
    throw error;
  }
}, 500); // Debounce for 500ms to prevent excessive API calls

/**
 * Retrieves garden yield forecast
 * Implements requirement F-002-RQ-001 for yield calculations
 * @param id Garden identifier
 * @returns Promise<YieldForecast> Garden yield forecast
 */
export const getGardenYieldForecast = async (id: string) => {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid garden ID');
  }

  try {
    const response = await axiosInstance.get(
      API_ENDPOINTS.GARDEN.GET_YIELD_FORECAST.replace(':id', id)
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to get yield forecast for garden ${id}:`, error);
    throw error;
  }
};