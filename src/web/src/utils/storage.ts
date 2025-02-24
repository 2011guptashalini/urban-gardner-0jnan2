/**
 * Advanced utility module for secure browser storage operations
 * @version 1.0.0
 * @package @urban-gardening-assistant/web
 */

import CryptoJS from 'crypto-js';
import { User } from '../types/user';

// Storage keys for consistent access
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'uga_access_token',
  REFRESH_TOKEN: 'uga_refresh_token',
  USER_DATA: 'uga_user_data',
  STORAGE_VERSION: 'uga_storage_version',
  LAST_CLEANUP: 'uga_last_cleanup'
} as const;

// Current storage version for compatibility checks
const STORAGE_VERSION = '1.0';

// Encryption key from environment variables
const ENCRYPTION_KEY = process.env.REACT_APP_STORAGE_ENCRYPTION_KEY;

// Storage quota threshold (90% of available space)
const QUOTA_THRESHOLD = 0.9;

/**
 * Validates storage availability and quota
 * @throws Error if storage is unavailable or quota exceeded
 */
const validateStorage = (): void => {
  try {
    if (!localStorage) {
      throw new Error('Local storage is not available');
    }

    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(({ usage, quota }) => {
        if (quota && usage && (usage / quota) > QUOTA_THRESHOLD) {
          console.warn('Storage quota usage high, cleanup recommended');
        }
      });
    }
  } catch (error) {
    throw new Error(`Storage validation failed: ${error.message}`);
  }
};

/**
 * Encrypts data using AES encryption
 * @param data - Data to encrypt
 * @returns Encrypted data string
 */
const encryptData = (data: string): string => {
  if (!ENCRYPTION_KEY) {
    throw new Error('Encryption key not configured');
  }
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
};

/**
 * Decrypts encrypted data
 * @param encryptedData - Encrypted data string
 * @returns Decrypted data string
 */
const decryptData = (encryptedData: string): string => {
  if (!ENCRYPTION_KEY) {
    throw new Error('Encryption key not configured');
  }
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * Stores authentication tokens securely in local storage
 * @param accessToken - JWT access token
 * @param refreshToken - JWT refresh token
 */
export const setAuthTokens = async (
  accessToken: string,
  refreshToken: string
): Promise<void> => {
  try {
    validateStorage();

    if (!accessToken || !refreshToken) {
      throw new Error('Invalid token data');
    }

    const tokenData = {
      accessToken,
      refreshToken,
      timestamp: Date.now()
    };

    localStorage.setItem(
      STORAGE_KEYS.ACCESS_TOKEN,
      encryptData(JSON.stringify(tokenData))
    );
    localStorage.setItem(STORAGE_KEYS.STORAGE_VERSION, STORAGE_VERSION);
  } catch (error) {
    console.error('Failed to store auth tokens:', error);
    throw error;
  }
};

/**
 * Retrieves and validates authentication tokens
 * @returns Object containing tokens or null if invalid
 */
export const getAuthTokens = async (): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> => {
  try {
    validateStorage();

    const encryptedData = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const version = localStorage.getItem(STORAGE_KEYS.STORAGE_VERSION);

    if (!encryptedData || version !== STORAGE_VERSION) {
      return null;
    }

    const decryptedData = decryptData(encryptedData);
    const tokenData = JSON.parse(decryptedData);

    // Check token age (24 hours)
    if (Date.now() - tokenData.timestamp > 24 * 60 * 60 * 1000) {
      await clearAllData();
      return null;
    }

    return {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken
    };
  } catch (error) {
    console.error('Failed to retrieve auth tokens:', error);
    return null;
  }
};

/**
 * Stores user data securely with encryption
 * @param userData - User data object
 */
export const setUserData = async (userData: User): Promise<void> => {
  try {
    validateStorage();

    if (!userData.id || !userData.email) {
      throw new Error('Invalid user data');
    }

    const userDataWithTimestamp = {
      ...userData,
      lastModified: Date.now()
    };

    localStorage.setItem(
      STORAGE_KEYS.USER_DATA,
      encryptData(JSON.stringify(userDataWithTimestamp))
    );
  } catch (error) {
    console.error('Failed to store user data:', error);
    throw error;
  }
};

/**
 * Retrieves and validates user data
 * @returns User object or null if invalid
 */
export const getUserData = async (): Promise<User | null> => {
  try {
    validateStorage();

    const encryptedData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (!encryptedData) {
      return null;
    }

    const decryptedData = decryptData(encryptedData);
    const userData = JSON.parse(decryptedData);

    // Validate user data structure
    if (!userData.id || !userData.email) {
      return null;
    }

    // Check data freshness (7 days)
    if (Date.now() - userData.lastModified > 7 * 24 * 60 * 60 * 1000) {
      console.warn('User data outdated, refresh recommended');
    }

    return userData;
  } catch (error) {
    console.error('Failed to retrieve user data:', error);
    return null;
  }
};

/**
 * Securely clears all stored data
 */
export const clearAllData = async (): Promise<void> => {
  try {
    validateStorage();

    // Clear all application data
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });

    // Update cleanup timestamp
    localStorage.setItem(STORAGE_KEYS.LAST_CLEANUP, Date.now().toString());

    // Verify cleanup
    Object.values(STORAGE_KEYS).forEach(key => {
      if (localStorage.getItem(key) && key !== STORAGE_KEYS.LAST_CLEANUP) {
        throw new Error(`Failed to clear storage key: ${key}`);
      }
    });
  } catch (error) {
    console.error('Failed to clear storage:', error);
    throw error;
  }
};