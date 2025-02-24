/**
 * @fileoverview Defines crop-related constants, validation rules, and configuration values
 * Used throughout the Urban Gardening Assistant frontend application
 * Version: 1.0.0
 * 
 * Implements requirements:
 * - F-002-RQ-001: Crop yield calculation with 10% accuracy
 * - F-002-RQ-002: Space capacity warning thresholds
 */

import { BagSize } from '../types/crops';

/**
 * Standardized grow bag size definitions mapped to display values
 * Aligned with BagSize enum from types/crops.ts
 */
export const GROW_BAG_SIZES: Record<string, string> = {
    EIGHT_INCH: BagSize.EIGHT_INCH,     // 20 cm
    TEN_INCH: BagSize.TEN_INCH,        // 25 cm
    TWELVE_INCH: BagSize.TWELVE_INCH,   // 30 cm
    FOURTEEN_INCH: BagSize.FOURTEEN_INCH // 35 cm
} as const;

/**
 * Validation limits for crop quantities and grow bag allocations
 * Ensures data integrity and realistic garden planning
 */
export const CROP_LIMITS = {
    MIN_QUANTITY: 1,              // Minimum crop quantity in grams
    MAX_QUANTITY: 1000,          // Maximum crop quantity in grams
    MIN_GROW_BAGS: 1,            // Minimum number of grow bags
    MAX_GROW_BAGS: 100,          // Maximum number of grow bags
    MAX_CROPS_PER_GARDEN: 10     // Maximum unique crops per garden
} as const;

/**
 * Critical thresholds for yield calculations and space utilization
 * Implements F-002-RQ-001 and F-002-RQ-002 requirements
 */
export const YIELD_THRESHOLDS = {
    ACCURACY_THRESHOLD: 0.1,      // 10% yield accuracy requirement
    SPACE_CAPACITY_WARNING: 0.9,  // 90% space utilization warning
    MIN_VIABLE_YIELD: 0.1        // 10% minimum viable yield threshold
} as const;

/**
 * Comprehensive yield rates and growing specifications per crop type
 * Daily yields in kilograms, recommended bag sizes, and expected variances
 */
export const CROP_YIELD_RATES = {
    TOMATOES: {
        DAILY_YIELD: 0.25,                    // 250g per day
        RECOMMENDED_BAG_SIZE: BagSize.TWELVE_INCH,
        YIELD_VARIANCE: 0.05                  // 5% variance
    },
    SPINACH: {
        DAILY_YIELD: 0.15,                    // 150g per day
        RECOMMENDED_BAG_SIZE: BagSize.EIGHT_INCH,
        YIELD_VARIANCE: 0.03                  // 3% variance
    },
    LETTUCE: {
        DAILY_YIELD: 0.2,                     // 200g per day
        RECOMMENDED_BAG_SIZE: BagSize.TEN_INCH,
        YIELD_VARIANCE: 0.04                  // 4% variance
    },
    PEPPERS: {
        DAILY_YIELD: 0.15,                    // 150g per day
        RECOMMENDED_BAG_SIZE: BagSize.TWELVE_INCH,
        YIELD_VARIANCE: 0.05                  // 5% variance
    },
    EGGPLANT: {
        DAILY_YIELD: 0.3,                     // 300g per day
        RECOMMENDED_BAG_SIZE: BagSize.FOURTEEN_INCH,
        YIELD_VARIANCE: 0.06                  // 6% variance
    }
} as const;

/**
 * User-friendly validation and warning messages
 * Provides consistent error messaging across the application
 */
export const CROP_VALIDATION_MESSAGES = {
    INVALID_QUANTITY: 'Quantity must be between 1 and 1000',
    INVALID_GROW_BAGS: 'Number of grow bags must be between 1 and 100',
    INVALID_BAG_SIZE: 'Please select a valid grow bag size',
    MAX_CROPS_EXCEEDED: 'Maximum 10 crops allowed per garden',
    SPACE_OVERCAPACITY: 'Selected crops exceed available garden space',
    YIELD_ACCURACY_WARNING: 'Yield estimates may vary by up to 10%',
    INSUFFICIENT_YIELD: 'Expected yield is below minimum viable threshold'
} as const;