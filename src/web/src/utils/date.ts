/**
 * @fileoverview Advanced date utility functions for garden maintenance scheduling
 * Includes performance optimizations and timezone handling
 * @version 1.0.0
 */

import { format, addDays, addWeeks } from 'date-fns';
import { Frequency } from '../types/maintenance';

// Cache size for memoized calculations
const CACHE_SIZE = 100;

/**
 * Interface for date formatting options
 */
interface DateFormatOptions {
  timezone?: string;
  locale?: string;
}

/**
 * Interface for memoization options
 */
interface MemoOptions {
  cacheSize?: number;
  ttl?: number;
}

/**
 * Simple LRU cache implementation for date calculations
 */
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private readonly maxSize: number;

  constructor(maxSize: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value) {
      // Move to front (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.size >= this.maxSize) {
      // Remove least recently used
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}

/**
 * Validates a date input for calculations
 * @param date - Date to validate
 * @returns boolean indicating if date is valid
 */
export const validateDate = (date: Date): boolean => {
  if (!(date instanceof Date)) return false;
  if (isNaN(date.getTime())) return false;
  
  // Check for reasonable date range (between 1970 and 2100)
  const year = date.getFullYear();
  return year >= 1970 && year <= 2100;
};

/**
 * Formats a date into a human-readable string with localization support
 * @param date - Date to format
 * @param formatString - Format pattern
 * @param options - Formatting options
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date,
  formatString: string = 'yyyy-MM-dd HH:mm:ss',
  options: DateFormatOptions = {}
): string => {
  if (!validateDate(date)) {
    throw new Error('Invalid date provided to formatDate');
  }

  try {
    let adjustedDate = new Date(date);
    
    // Apply timezone offset if specified
    if (options.timezone) {
      const tzOffset = new Date().getTimezoneOffset();
      adjustedDate = new Date(date.getTime() + tzOffset * 60000);
    }

    return format(adjustedDate, formatString, {
      locale: options.locale
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return date.toISOString(); // Fallback to ISO string
  }
};

/**
 * Memoized wrapper for expensive date calculations
 * @param calculationFn - Function to memoize
 * @param options - Memoization options
 * @returns Memoized function
 */
const memoizedDateCalculation = <T extends (...args: any[]) => any>(
  calculationFn: T,
  options: MemoOptions = {}
): T => {
  const cache = new LRUCache<string, ReturnType<T>>(options.cacheSize || CACHE_SIZE);

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    let result = cache.get(key);

    if (result === undefined) {
      result = calculationFn(...args);
      cache.set(key, result);
    }

    return result;
  }) as T;
};

/**
 * Calculates the next scheduled time with performance optimization
 * @param lastCompletedTime - Last completion time
 * @param frequency - Task frequency
 * @param preferredTime - Preferred time of day
 * @returns Next scheduled date and time
 */
export const calculateNextScheduledTime = memoizedDateCalculation(
  (lastCompletedTime: Date, frequency: Frequency, preferredTime: string): Date => {
    if (!validateDate(lastCompletedTime)) {
      throw new Error('Invalid lastCompletedTime provided');
    }

    const [hours, minutes] = preferredTime.split(':').map(Number);
    let nextDate = new Date(lastCompletedTime);
    nextDate.setHours(hours, minutes, 0, 0);

    switch (frequency) {
      case Frequency.Daily:
        nextDate = addDays(nextDate, 1);
        break;
      case Frequency.Weekly:
        nextDate = addWeeks(nextDate, 1);
        break;
      case Frequency.BiWeekly:
        nextDate = addWeeks(nextDate, 2);
        break;
      default:
        throw new Error(`Unsupported frequency: ${frequency}`);
    }

    return nextDate;
  }
);

/**
 * Checks if a scheduled task is overdue with timezone awareness
 * @param scheduledTime - Scheduled task time
 * @param options - Timezone options
 * @returns Boolean indicating if task is overdue
 */
export const isOverdue = (
  scheduledTime: Date,
  options: DateFormatOptions = {}
): boolean => {
  if (!validateDate(scheduledTime)) {
    throw new Error('Invalid scheduledTime provided');
  }

  const now = new Date();
  let adjustedScheduledTime = new Date(scheduledTime);

  if (options.timezone) {
    const tzOffset = new Date().getTimezoneOffset();
    adjustedScheduledTime = new Date(scheduledTime.getTime() + tzOffset * 60000);
  }

  return adjustedScheduledTime < now;
};

/**
 * Gets optimized time range for maintenance frequency
 * @param frequency - Task frequency
 * @param options - Range calculation options
 * @returns Object containing start and end dates
 */
export const getTimeRangeForFrequency = memoizedDateCalculation(
  (
    frequency: Frequency,
    options: DateFormatOptions = {}
  ): { startDate: Date; endDate: Date } => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (frequency) {
      case Frequency.Daily:
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = addDays(startDate, 1);
        break;
      case Frequency.Weekly:
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = addWeeks(startDate, 1);
        break;
      case Frequency.BiWeekly:
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = addWeeks(startDate, 2);
        break;
      default:
        throw new Error(`Unsupported frequency: ${frequency}`);
    }

    if (options.timezone) {
      const tzOffset = new Date().getTimezoneOffset();
      startDate = new Date(startDate.getTime() + tzOffset * 60000);
      endDate = new Date(endDate.getTime() + tzOffset * 60000);
    }

    return { startDate, endDate };
  }
);