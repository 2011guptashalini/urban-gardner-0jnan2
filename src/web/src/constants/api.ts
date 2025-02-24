/**
 * API Constants
 * @description Defines comprehensive API-related constants for the Urban Gardening Assistant frontend
 * @version 1.0.0
 */

/**
 * Current API version identifier
 * @constant
 */
export const API_VERSION = 'v1' as const;

/**
 * Base URL for API requests with environment-based configuration
 * @constant
 */
export const API_BASE_URL = process.env.VITE_API_BASE_URL || `http://localhost:8080/api/${API_VERSION}` as const;

/**
 * Default timeout for API requests in milliseconds
 * @constant
 */
export const API_TIMEOUT = 30000 as const;

/**
 * Type definitions for API endpoints
 */
type EndpointConfig = {
  readonly BASE: string;
  readonly [key: string]: string;
};

type APIEndpoints = {
  readonly AUTH: EndpointConfig;
  readonly GARDEN: EndpointConfig;
  readonly CROPS: EndpointConfig;
  readonly MAINTENANCE: EndpointConfig;
  readonly USER: EndpointConfig;
};

/**
 * Comprehensive API endpoint paths for all application features
 * @constant
 */
export const API_ENDPOINTS: APIEndpoints = {
  AUTH: {
    BASE: '/auth',
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh',
    VERIFY_EMAIL: '/auth/verify',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password'
  },
  GARDEN: {
    BASE: '/gardens',
    GET_ALL: '/gardens',
    GET_BY_ID: '/gardens/:id',
    CREATE: '/gardens',
    UPDATE: '/gardens/:id',
    DELETE: '/gardens/:id',
    GET_METRICS: '/gardens/:id/metrics',
    GET_SPACE_ANALYSIS: '/gardens/:id/space-analysis',
    GET_YIELD_FORECAST: '/gardens/:id/yield-forecast'
  },
  CROPS: {
    BASE: '/crops',
    GET_ALL: '/crops',
    GET_BY_ID: '/crops/:id',
    CREATE: '/crops',
    UPDATE: '/crops/:id',
    DELETE: '/crops/:id',
    GET_COMPATIBILITY: '/crops/:id/compatibility',
    GET_GROWING_GUIDE: '/crops/:id/guide',
    GET_SEASONAL_TIPS: '/crops/:id/seasonal-tips'
  },
  MAINTENANCE: {
    BASE: '/maintenance',
    GET_ALL: '/maintenance',
    GET_BY_ID: '/maintenance/:id',
    CREATE: '/maintenance',
    UPDATE: '/maintenance/:id',
    DELETE: '/maintenance/:id',
    COMPLETE_TASK: '/maintenance/:id/complete',
    GET_SCHEDULE: '/maintenance/schedule',
    GET_RECOMMENDATIONS: '/maintenance/recommendations',
    GET_ALERTS: '/maintenance/alerts'
  },
  USER: {
    BASE: '/users',
    GET_PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    GET_PREFERENCES: '/users/preferences',
    UPDATE_PREFERENCES: '/users/preferences'
  }
} as const;

/**
 * HTTP status codes for proper error handling
 * @constant
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

/**
 * HTTP request methods for API calls
 * @constant
 */
export const REQUEST_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE'
} as const;

/**
 * Standard HTTP headers used in API requests
 * @constant
 */
export const REQUEST_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  ACCEPT: 'Accept',
  CACHE_CONTROL: 'Cache-Control'
} as const;

/**
 * Content type definitions for API requests and responses
 * @constant
 */
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  TEXT: 'text/plain'
} as const;

// Type exports for better type safety
export type HTTPStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];
export type RequestMethod = typeof REQUEST_METHODS[keyof typeof REQUEST_METHODS];
export type RequestHeader = typeof REQUEST_HEADERS[keyof typeof REQUEST_HEADERS];
export type ContentType = typeof CONTENT_TYPES[keyof typeof CONTENT_TYPES];