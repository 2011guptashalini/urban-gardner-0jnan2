/**
 * @fileoverview TypeScript type definitions for crop-related data structures
 * Used throughout the Urban Gardening Assistant frontend application
 * Implements requirements F-002-RQ-001 and F-002-RQ-002
 */

import { Garden } from './garden';

// Global constants for validation and calculations
export const VALID_BAG_SIZES = ['8"', '10"', '12"', '14"'] as const;
export const MIN_QUANTITY = 1;
export const MIN_GROW_BAGS = 1;
export const YIELD_ACCURACY_THRESHOLD = 0.10; // 10% accuracy requirement
export const SPACE_CAPACITY_WARNING_THRESHOLD = 0.90; // 90% capacity warning threshold

/**
 * Type-safe enumeration of standardized grow bag sizes
 * Includes both imperial and metric measurements
 */
export enum BagSize {
    EIGHT_INCH = '8"',     // 20 cm
    TEN_INCH = '10"',      // 25 cm
    TWELVE_INCH = '12"',   // 30 cm
    FOURTEEN_INCH = '14"'  // 35 cm
}

/**
 * Comprehensive crop data structure with yield calculation and space utilization tracking
 * Implements requirements F-002-RQ-001 and F-002-RQ-002
 */
export interface Crop {
    id: string;
    gardenId: string;
    name: string;
    quantityNeeded: number;      // Daily quantity needed in grams
    growBags: number;            // Number of grow bags allocated
    bagSize: BagSize;           // Size of grow bags
    estimatedYield: number;     // Estimated daily yield in grams
    actualYield: number;        // Actual measured yield in grams
    yieldAccuracy: number;      // Calculated yield accuracy percentage
    spaceUtilization: number;   // Percentage of garden space utilized
    isOverCapacity: boolean;    // Space capacity warning flag
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Type-safe crop creation request with validation constraints
 * Omits system-generated fields and calculated values
 */
export interface CreateCropRequest {
    gardenId: string;
    name: string;
    quantityNeeded: number;
    growBags: number;
    bagSize: BagSize;
}

/**
 * Type-safe crop update request with optional fields
 * Allows partial updates while maintaining type safety
 */
export interface UpdateCropRequest {
    name?: string;
    quantityNeeded?: number;
    growBags?: number;
    bagSize?: BagSize;
}

/**
 * Paginated crop list response with type-safe array handling
 * Supports frontend pagination implementation
 */
export interface CropListResponse {
    crops: Crop[];
    total: number;
    page: number;
    perPage: number;
}