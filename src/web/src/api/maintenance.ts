/**
 * API client for garden maintenance operations
 * Implements CRUD operations, task scheduling, and AI recommendations with caching
 * @version 1.0.0
 */

import { debounce } from 'lodash'; // v4.17.21
import axiosInstance from './axios';
import { API_ENDPOINTS } from '../constants/api';
import { 
  MaintenanceTask, 
  MaintenanceTaskRequest, 
  MaintenanceTaskList,
  TaskType,
  Frequency,
  TimeOfDay,
  Unit 
} from '../types/maintenance';

// Cache configuration
const CACHE_KEYS = {
  TASKS: 'maintenance_tasks',
  AI_RECOMMENDATIONS: 'ai_recommendations'
} as const;

const CACHE_TTL = {
  TASKS: 5 * 60 * 1000, // 5 minutes
  AI_RECOMMENDATIONS: 30 * 60 * 1000 // 30 minutes
} as const;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Retrieves paginated list of maintenance tasks with caching
 * @param page - Page number (1-based)
 * @param pageSize - Number of items per page
 * @param filters - Optional filters for tasks
 * @returns Promise<MaintenanceTaskList>
 */
export const getAllMaintenanceTasks = async (
  page: number = 1,
  pageSize: number = 10,
  filters?: {
    cropId?: string;
    taskType?: TaskType;
    frequency?: Frequency;
    active?: boolean;
  }
): Promise<MaintenanceTaskList> => {
  try {
    // Validate input parameters
    if (page < 1 || pageSize < 1) {
      throw new Error('Invalid pagination parameters');
    }

    // Generate cache key based on parameters
    const cacheKey = `${CACHE_KEYS.TASKS}_${page}_${pageSize}_${JSON.stringify(filters)}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      const cached: CacheEntry<MaintenanceTaskList> = JSON.parse(cachedData);
      if (Date.now() - cached.timestamp < CACHE_TTL.TASKS) {
        return cached.data;
      }
    }

    // Construct query parameters
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...filters
    });

    const response = await axiosInstance.get<MaintenanceTaskList>(
      `${API_ENDPOINTS.MAINTENANCE.GET_ALL}?${params.toString()}`
    );

    // Cache the response
    const cacheEntry: CacheEntry<MaintenanceTaskList> = {
      data: response,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));

    return response;
  } catch (error) {
    console.error('Failed to fetch maintenance tasks:', error);
    throw error;
  }
};

/**
 * Creates a new maintenance task
 * @param task - Task creation request
 * @returns Promise<MaintenanceTask>
 */
export const createMaintenanceTask = async (
  task: MaintenanceTaskRequest
): Promise<MaintenanceTask> => {
  try {
    const response = await axiosInstance.post<MaintenanceTask>(
      API_ENDPOINTS.MAINTENANCE.CREATE,
      task
    );
    clearTasksCache();
    return response;
  } catch (error) {
    console.error('Failed to create maintenance task:', error);
    throw error;
  }
};

/**
 * Updates an existing maintenance task
 * @param taskId - Task identifier
 * @param updates - Task update data
 * @returns Promise<MaintenanceTask>
 */
export const updateMaintenanceTask = async (
  taskId: string,
  updates: Partial<MaintenanceTaskRequest>
): Promise<MaintenanceTask> => {
  try {
    const response = await axiosInstance.put<MaintenanceTask>(
      `${API_ENDPOINTS.MAINTENANCE.UPDATE.replace(':id', taskId)}`,
      updates
    );
    clearTasksCache();
    return response;
  } catch (error) {
    console.error('Failed to update maintenance task:', error);
    throw error;
  }
};

/**
 * Retrieves AI-powered maintenance recommendations with caching
 * Implements debouncing to prevent excessive API calls
 * @param plantId - Plant identifier
 * @param conditions - Growing conditions
 * @returns Promise<MaintenanceTask[]>
 */
export const getAIRecommendations = debounce(async (
  plantId: string,
  conditions: {
    soilType: string;
    sunlight: string;
    temperature: number;
    humidity: number;
  }
): Promise<MaintenanceTask[]> => {
  try {
    const cacheKey = `${CACHE_KEYS.AI_RECOMMENDATIONS}_${plantId}_${JSON.stringify(conditions)}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      const cached: CacheEntry<MaintenanceTask[]> = JSON.parse(cachedData);
      if (Date.now() - cached.timestamp < CACHE_TTL.AI_RECOMMENDATIONS) {
        return cached.data;
      }
    }

    const response = await axiosInstance.get<MaintenanceTask[]>(
      `${API_ENDPOINTS.MAINTENANCE.GET_RECOMMENDATIONS}`,
      {
        params: {
          plantId,
          ...conditions
        },
        timeout: 3000 // 3s SLA requirement
      }
    );

    // Cache the AI recommendations
    const cacheEntry: CacheEntry<MaintenanceTask[]> = {
      data: response,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));

    return response;
  } catch (error) {
    console.error('Failed to get AI recommendations:', error);
    throw error;
  }
}, 300); // 300ms debounce

/**
 * Performs bulk update of maintenance tasks
 * @param tasks - Array of task updates
 * @returns Promise<MaintenanceTask[]>
 */
export const bulkUpdateTasks = async (
  tasks: Array<{
    id: string;
    updates: Partial<MaintenanceTaskRequest>;
  }>
): Promise<MaintenanceTask[]> => {
  try {
    if (!tasks.length) {
      throw new Error('No tasks provided for bulk update');
    }

    const response = await axiosInstance.put<MaintenanceTask[]>(
      `${API_ENDPOINTS.MAINTENANCE.BASE}/bulk`,
      { tasks }
    );

    clearTasksCache();
    return response;
  } catch (error) {
    console.error('Failed to perform bulk task update:', error);
    throw error;
  }
};

/**
 * Marks a maintenance task as completed
 * @param taskId - Task identifier
 * @param completionNotes - Optional completion notes
 * @returns Promise<MaintenanceTask>
 */
export const completeTask = async (
  taskId: string,
  completionNotes?: string
): Promise<MaintenanceTask> => {
  try {
    const response = await axiosInstance.post<MaintenanceTask>(
      `${API_ENDPOINTS.MAINTENANCE.COMPLETE_TASK.replace(':id', taskId)}`,
      { completionNotes }
    );
    clearTasksCache();
    return response;
  } catch (error) {
    console.error('Failed to complete maintenance task:', error);
    throw error;
  }
};

/**
 * Clears all maintenance task related cache entries
 */
const clearTasksCache = (): void => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEYS.TASKS) || key.startsWith(CACHE_KEYS.AI_RECOMMENDATIONS)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Failed to clear tasks cache:', error);
  }
};