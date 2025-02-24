/**
 * Axios configuration module for Urban Gardening Assistant
 * Configures and exports an Axios instance with interceptors for API requests
 * @version 1.0.0
 * @package @urban-gardening-assistant/web
 */

import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { API_BASE_URL, API_TIMEOUT, HTTP_STATUS } from '../constants/api';
import { getAccessToken, logout } from '../utils/auth';

/**
 * Type definition for API error response structure
 */
interface APIErrorResponse {
  status: number;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Creates and configures the Axios instance with base settings
 */
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // Enable sending cookies in cross-origin requests
});

/**
 * Handles API request errors and formats them consistently
 * @param error - The error object from Axios
 * @returns Rejected promise with formatted error details
 */
const handleRequestError = async (error: AxiosError): Promise<never> => {
  let errorResponse: APIErrorResponse = {
    status: error.response?.status || 500,
    message: 'An unexpected error occurred',
    details: {}
  };

  if (error.response) {
    // Server responded with error status
    const responseData = error.response.data as Record<string, unknown>;
    errorResponse = {
      status: error.response.status,
      message: (responseData.message as string) || error.message,
      details: responseData
    };
  } else if (error.request) {
    // Request made but no response received
    errorResponse = {
      status: 503,
      message: 'Service unavailable. Please try again later.',
      details: { request: error.request }
    };
  }

  // Log error for monitoring but exclude sensitive data
  console.error('API Request Error:', {
    status: errorResponse.status,
    message: errorResponse.message,
    url: error.config?.url
  });

  return Promise.reject(errorResponse);
};

/**
 * Configures request and response interceptors for the Axios instance
 */
const setupInterceptors = (): void => {
  // Request interceptor for adding authentication and headers
  axiosInstance.interceptors.request.use(
    async (config) => {
      try {
        const token = await getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      } catch (error) {
        return Promise.reject(error);
      }
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for handling common response scenarios
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      // Return only the response data for successful requests
      return response.data;
    },
    async (error: AxiosError) => {
      // Handle authentication errors
      if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
        try {
          // Attempt to logout user on authentication failure
          await logout();
          // Redirect to login page
          window.location.href = '/login';
        } catch (logoutError) {
          console.error('Logout failed during unauthorized response:', logoutError);
        }
      }
      
      return handleRequestError(error);
    }
  );
};

// Initialize interceptors
setupInterceptors();

/**
 * Export the configured Axios instance for use throughout the application
 */
export default axiosInstance;