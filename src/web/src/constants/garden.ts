/**
 * Garden-related constants and configuration values for the Urban Gardening Assistant
 * @version 1.0.0
 */

/**
 * Interface defining soil characteristics
 */
interface SoilCharacteristics {
  readonly waterRetention: string;
  readonly nutrientContent: string;
  readonly bestFor: readonly string[];
}

/**
 * Interface defining sunlight characteristics
 */
interface SunlightCharacteristics {
  readonly hoursRange: string;
  readonly bestFor: readonly string[];
  readonly description: string;
}

/**
 * Garden dimension limits and units
 * Enforces strict validation for garden space planning
 */
export const GARDEN_DIMENSION_LIMITS = {
  MIN_LENGTH: 2.0,
  MAX_LENGTH: 100.0,
  MIN_WIDTH: 2.0,
  MAX_WIDTH: 100.0,
  MIN_AREA: 10.0,
  MAX_AREA: 1000.0,
  UNIT_SUFFIX: 'feet/meters',
  AREA_UNIT_SUFFIX: 'square feet/meters'
} as const;

/**
 * Available soil types with descriptive names
 * Supports requirement F-001-RQ-003 for soil type selection
 */
export const SOIL_TYPES = {
  RED_SOIL: 'Red Soil - Iron-rich, slightly acidic',
  SANDY_SOIL: 'Sandy Soil - Well-draining, low nutrients',
  LOAMY_SOIL: 'Loamy Soil - Balanced, nutrient-rich',
  CLAY_SOIL: 'Clay Soil - Dense, nutrient-rich',
  BLACK_SOIL: 'Black Soil - Rich in organic matter'
} as const;

/**
 * Detailed characteristics for each soil type
 * Provides comprehensive information for user guidance
 */
export const SOIL_CHARACTERISTICS: Readonly<Record<keyof typeof SOIL_TYPES, SoilCharacteristics>> = {
  RED_SOIL: {
    waterRetention: 'Moderate',
    nutrientContent: 'Medium',
    bestFor: ['Root vegetables', 'Herbs']
  },
  SANDY_SOIL: {
    waterRetention: 'Low',
    nutrientContent: 'Low',
    bestFor: ['Herbs', 'Carrots', 'Radishes']
  },
  LOAMY_SOIL: {
    waterRetention: 'High',
    nutrientContent: 'High',
    bestFor: ['Most vegetables', 'Fruits']
  },
  CLAY_SOIL: {
    waterRetention: 'Very High',
    nutrientContent: 'High',
    bestFor: ['Leafy greens', 'Brassicas']
  },
  BLACK_SOIL: {
    waterRetention: 'High',
    nutrientContent: 'Very High',
    bestFor: ['All vegetables', 'Heavy feeders']
  }
} as const;

/**
 * Available sunlight conditions with descriptions
 * Supports requirement F-001-RQ-002 for sunlight condition input
 */
export const SUNLIGHT_CONDITIONS = {
  FULL_SUN: 'Full Sun (6+ hours direct sunlight)',
  PARTIAL_SHADE: 'Partial Shade (3-6 hours direct sunlight)',
  FULL_SHADE: 'Full Shade (<3 hours direct sunlight)'
} as const;

/**
 * Detailed characteristics for each sunlight condition
 * Provides comprehensive information for optimal plant selection
 */
export const SUNLIGHT_CHARACTERISTICS: Readonly<Record<keyof typeof SUNLIGHT_CONDITIONS, SunlightCharacteristics>> = {
  FULL_SUN: {
    hoursRange: '6 or more hours',
    bestFor: ['Tomatoes', 'Peppers', 'Eggplants'],
    description: 'Direct sunlight for majority of the day'
  },
  PARTIAL_SHADE: {
    hoursRange: '3 to 6 hours',
    bestFor: ['Leafy greens', 'Herbs', 'Root vegetables'],
    description: 'Mix of direct sun and shade throughout the day'
  },
  FULL_SHADE: {
    hoursRange: 'Less than 3 hours',
    bestFor: ['Shade-tolerant herbs', 'Some leafy greens'],
    description: 'Minimal direct sunlight, mostly indirect light'
  }
} as const;

/**
 * User-friendly validation messages for garden input errors
 * Supports requirement F-001-RQ-001 for dimension validation
 */
export const GARDEN_VALIDATION_MESSAGES = {
  INVALID_LENGTH: 'Length must be between 2 and 100 feet/meters',
  INVALID_WIDTH: 'Width must be between 2 and 100 feet/meters',
  INVALID_AREA: 'Total area must be between 10 and 1000 square feet/meters',
  INVALID_SOIL_TYPE: 'Please select a valid soil type from the available options',
  INVALID_SUNLIGHT: 'Please select a valid sunlight condition for your garden',
  DIMENSION_TOO_SMALL: 'Dimensions are too small for effective gardening',
  DIMENSION_TOO_LARGE: 'Dimensions exceed maximum supported garden size',
  AREA_TOO_SMALL: 'Garden area is too small for effective planting',
  AREA_TOO_LARGE: 'Garden area exceeds maximum supported size'
} as const;