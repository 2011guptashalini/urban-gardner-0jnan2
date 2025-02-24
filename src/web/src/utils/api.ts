/**
 * Core API utility module for Urban Gardening Assistant
 * Provides standardized functions for making HTTP requests with error handling and type safety
 * @version 1.0.0
 * @package @urban-gardening-assistant/web
 */

import axiosInstance from '../api/axios'; // v1.4.0
import { API_ENDPOINTS, HTTP_STATUS } from '../constants/api';
import { AxiosError } from 'axios'; // v1.4.0

/**
 * Standard API error response structure
 */
interface ApiError {
  status: number;
  message: string;
  code?: string;
  context?: Record<string, unknown>;
  retryable: boolean;
  timestamp: number;
}

/**
 * Request configuration options
 */
interface RequestConfig<T> {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, string>;
  data?: unknown;
  transform?: (data: unknown) => T;
  timeout?: number;
  retries?: number;
}

/**
 * Processes API errors and transforms them into standardized error responses
 * @param error - Axios error object
 * @returns Standardized API error object
 */
export const handleApiError = (error: AxiosError): ApiError => {
  const baseError: ApiError = {
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: 'An unexpected error occurred',
    retryable: false,
    timestamp: Date.now()
  };

  if (!error.isAxiosError) {
    return {
      ...baseError,
      message: error.message,
      code: 'UNKNOWN_ERROR'
    };
  }

  // Network or timeout errors
  if (!error.response) {
    return {
      ...baseError,
      status: 0,
      message: 'Network error - please check your connection',
      code: 'NETWORK_ERROR',
      retryable: true,
      context: {
        request: error.config?.url,
        timeout: error.config?.timeout
      }
    };
  }

  // Server errors (500+)
  if (error.response.status >= 500) {
    return {
      ...baseError,
      status: error.response.status,
      message: 'Server error - please try again later',
      code: 'SERVER_ERROR',
      retryable: true,
      context: {
        endpoint: error.config?.url,
        response: error.response.data
      }
    };
  }

  // Client errors (400-499)
  const clientError: ApiError = {
    status: error.response.status,
    message: error.response.data?.message || error.message,
    code: error.response.data?.code || 'CLIENT_ERROR',
    retryable: false,
    timestamp: Date.now(),
    context: {
      data: error.response.data,
      endpoint: error.config?.url
    }
  };

  // Log error for monitoring (excluding sensitive data)
  console.error('API Error:', {
    status: clientError.status,
    code: clientError.code,
    endpoint: error.config?.url,
    timestamp: clientError.timestamp
  });

  return clientError;
};

/**
 * Makes type-safe API requests with comprehensive error handling
 * @param config - Request configuration object
 * @returns Promise resolving to the expected response type
 */
export const makeRequest = async <T>({
  endpoint,
  method,
  params,
  data,
  transform,
  timeout = 30000,
  retries = 2
}: RequestConfig<T>): Promise<T> => {
  let attempts = 0;

  const makeAttempt = async (): Promise<T> => {
    try {
      attempts++;
      const url = buildUrl(endpoint, params);

      const response = await axiosInstance({
        url,
        method,
        data,
        timeout,
        headers: {
          'X-Request-ID': `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          'X-Retry-Count': attempts.toString()
        }
      });

      // Transform response if transformer provided
      if (transform) {
        return transform(response);
      }

      return response as T;
    } catch (error) {
      const apiError = handleApiError(error as AxiosError);

      // Retry logic for retryable errors
      if (apiError.retryable && attempts < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempts), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return makeAttempt();
      }

      throw apiError;
    }
  };

  return makeAttempt();
};

/**
 * Constructs API URLs with path parameters and query string handling
 * @param endpoint - API endpoint path
 * @param params - URL parameters
 * @returns Constructed and encoded URL
 */
export const buildUrl = (
  endpoint: string,
  params?: Record<string, string>
): string => {
  if (!endpoint) {
    throw new Error('Endpoint is required');
  }

  let url = endpoint;

  // Replace path parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      const placeholder = `:${key}`;
      if (url.includes(placeholder)) {
        url = url.replace(
          placeholder,
          encodeURIComponent(value)
        );
      }
    });
  }

  // Add query parameters for remaining params
  const queryParams = params ? 
    Object.entries(params)
      .filter(([key]) => !endpoint.includes(`:${key}`))
      .map(([key, value]) => 
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join('&') 
    : '';

  if (queryParams) {
    url += `${url.includes('?') ? '&' : '?'}${queryParams}`;
  }

  return url;
};

/**
 * Type-safe request creators for each API endpoint category
 */
export const apiRequests = {
  auth: {
    login: <T>(data: unknown) => makeRequest<T>({
      endpoint: API_ENDPOINTS.AUTH.LOGIN,
      method: 'POST',
      data
    }),
    register: <T>(data: unknown) => makeRequest<T>({
      endpoint: API_ENDPOINTS.AUTH.REGISTER,
      method: 'POST',
      data
    })
  },
  garden: {
    getAll: <T>() => makeRequest<T>({
      endpoint: API_ENDPOINTS.GARDEN.GET_ALL,
      method: 'GET'
    }),
    getById: <T>(id: string) => makeRequest<T>({
      endpoint: API_ENDPOINTS.GARDEN.GET_BY_ID,
      method: 'GET',
      params: { id }
    }),
    create: <T>(data: unknown) => makeRequest<T>({
      endpoint: API_ENDPOINTS.GARDEN.CREATE,
      method: 'POST',
      data
    })
  },
  crops: {
    getAll: <T>() => makeRequest<T>({
      endpoint: API_ENDPOINTS.CROPS.GET_ALL,
      method: 'GET'
    }),
    getById: <T>(id: string) => makeRequest<T>({
      endpoint: API_ENDPOINTS.CROPS.GET_BY_ID,
      method: 'GET',
      params: { id }
    })
  },
  maintenance: {
    getSchedule: <T>() => makeRequest<T>({
      endpoint: API_ENDPOINTS.MAINTENANCE.GET_SCHEDULE,
      method: 'GET'
    }),
    completeTask: <T>(id: string) => makeRequest<T>({
      endpoint: API_ENDPOINTS.MAINTENANCE.COMPLETE_TASK,
      method: 'POST',
      params: { id }
    })
  }
};