/**
 * @fileoverview TypeScript type definitions for garden-related data structures
 * Used throughout the Urban Gardening Assistant frontend application
 * Implements requirements F-001-RQ-001, F-001-RQ-002, and F-001-RQ-003
 */

// Global constants for dimension validation
export const MIN_DIMENSION = 2.0;
export const MAX_DIMENSION = 100.0;
export const MIN_GARDEN_AREA = 10.0;
export const MAX_GARDEN_AREA = 1000.0;

/**
 * Supported measurement units for garden dimensions
 */
export enum MeasurementUnit {
    FEET = 'feet',
    METERS = 'meters'
}

/**
 * Type-safe representation of garden space dimensions
 * Implements requirement F-001-RQ-001
 */
export interface Dimensions {
    length: number;
    width: number;
    unit: MeasurementUnit;
}

/**
 * Comprehensive enumeration of supported soil types
 * Implements requirement F-001-RQ-003
 * Each soil type has specific characteristics for plant growth
 */
export enum SoilType {
    RED_SOIL = 'red_soil',      // Iron-rich, slightly acidic
    SANDY_SOIL = 'sandy_soil',  // Well-draining, low nutrients
    LOAMY_SOIL = 'loamy_soil',  // Balanced, nutrient-rich
    CLAY_SOIL = 'clay_soil',    // Dense, nutrient-rich
    BLACK_SOIL = 'black_soil'   // Rich in organic matter
}

/**
 * Standardized sunlight exposure options
 * Implements requirement F-001-RQ-002
 */
export enum SunlightCondition {
    FULL_SUN = 'full_sun',           // 6+ hours direct sunlight
    PARTIAL_SHADE = 'partial_shade',  // 3-6 hours direct sunlight
    FULL_SHADE = 'full_shade'        // <3 hours direct sunlight
}

/**
 * Complete garden data structure with all required attributes
 * Used for frontend state management and API interactions
 */
export interface Garden {
    id: string;
    userId: string;
    name: string;
    dimensions: Dimensions;
    soilType: SoilType;
    sunlight: SunlightCondition;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Type-safe garden creation request payload
 * Omits system-generated fields like id, userId, and timestamps
 */
export interface CreateGardenRequest {
    name: string;
    dimensions: Dimensions;
    soilType: SoilType;
    sunlight: SunlightCondition;
}

/**
 * Type-safe garden update request payload
 * Matches CreateGardenRequest structure for consistency
 */
export interface UpdateGardenRequest {
    name: string;
    dimensions: Dimensions;
    soilType: SoilType;
    sunlight: SunlightCondition;
}