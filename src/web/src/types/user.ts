/**
 * Type definitions for user-related data structures in the Urban Gardening Assistant
 * @version 1.0.0
 * @package @urban-gardening-assistant/web
 */

/**
 * Interface representing a user in the system with strict typing and immutable properties
 * Implements core user data model with role-based access control
 */
export interface User {
  /** Unique identifier for the user - immutable */
  readonly id: string;
  
  /** User's email address - immutable once verified */
  readonly email: string;
  
  /** User's first name */
  firstName: string;
  
  /** User's last name */
  lastName: string;
  
  /** Timestamp of user account creation - immutable */
  readonly createdAt: Date;
  
  /** Timestamp of last user profile update */
  updatedAt: Date;
  
  /** Flag indicating if user account is active */
  isActive: boolean;
  
  /** Array of role identifiers for RBAC */
  roles: string[];
}

/**
 * Interface for user registration request data with required fields and validation constraints
 * Used when creating new user accounts
 */
export interface CreateUserRequest {
  /** User's email address - must be unique */
  email: string;
  
  /** User's password - must meet security requirements */
  password: string;
  
  /** User's first name */
  firstName: string;
  
  /** User's last name */
  lastName: string;
  
  /** User's acceptance of terms and conditions */
  acceptTerms: boolean;
}

/**
 * Interface for user profile update request data with optional fields
 * Allows partial updates to user profile information
 */
export interface UpdateUserRequest {
  /** Optional updated first name */
  firstName?: string;
  
  /** Optional updated last name */
  lastName?: string;
  
  /** Optional new password */
  password?: string;
  
  /** Current password required for sensitive updates */
  currentPassword?: string;
  
  /** Optional new email address */
  email?: string;
}

/**
 * Interface for user login request data with required authentication fields
 * Used for user authentication endpoints
 */
export interface LoginRequest {
  /** User's email address */
  email: string;
  
  /** User's password */
  password: string;
  
  /** Optional flag for extended session duration */
  rememberMe?: boolean;
}

/**
 * Interface for authentication response data including JWT tokens and user information
 * Returned after successful authentication
 */
export interface AuthResponse {
  /** JWT access token */
  token: string;
  
  /** JWT refresh token for token renewal */
  refreshToken: string;
  
  /** Authenticated user information */
  user: User;
  
  /** Token expiration timestamp */
  expiresAt: Date;
  
  /** Token type (e.g., "Bearer") */
  tokenType: string;
}

/**
 * Interface for decoded JWT token payload
 * Represents the structure of decoded JWT claims
 */
export interface TokenPayload {
  /** Subject identifier (user ID) */
  sub: string;
  
  /** User's email address */
  email: string;
  
  /** Token issued at timestamp */
  iat: number;
  
  /** Token expiration timestamp */
  exp: number;
  
  /** User's roles for authorization */
  roles: string[];
}