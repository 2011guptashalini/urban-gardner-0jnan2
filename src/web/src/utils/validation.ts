/**
 * @fileoverview Validation utilities for garden, crop, and maintenance data
 * Implements robust schema validation with Zod and detailed error reporting
 * @version 1.0.0
 */

import { z } from 'zod';
import {
  Garden,
  MeasurementUnit,
  SoilType,
  SunlightCondition,
  MIN_DIMENSION,
  MAX_DIMENSION,
  MIN_GARDEN_AREA,
  MAX_GARDEN_AREA
} from '../types/garden';
import {
  Crop,
  BagSize,
  MIN_QUANTITY,
  MIN_GROW_BAGS,
  SPACE_CAPACITY_WARNING_THRESHOLD,
  VALID_BAG_SIZES
} from '../types/crops';
import {
  MaintenanceTask,
  TaskType,
  Frequency,
  Unit,
  TimeOfDay
} from '../types/maintenance';

/**
 * Constants for unit conversion and validation
 */
const FEET_TO_METERS = 0.3048;
const METERS_TO_FEET = 3.28084;

/**
 * Type for validation result with detailed error reporting
 */
export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: string[];
  warnings: string[];
  recommendations?: string[];
}

/**
 * Zod schema for garden dimensions with unit conversion
 * Implements requirement F-001-RQ-001
 */
export const dimensionsSchema = z.object({
  length: z.number()
    .min(MIN_DIMENSION, `Length must be at least ${MIN_DIMENSION} units`)
    .max(MAX_DIMENSION, `Length must not exceed ${MAX_DIMENSION} units`),
  width: z.number()
    .min(MIN_DIMENSION, `Width must be at least ${MIN_DIMENSION} units`)
    .max(MAX_DIMENSION, `Width must not exceed ${MAX_DIMENSION} units`),
  unit: z.enum([MeasurementUnit.FEET, MeasurementUnit.METERS])
}).refine(
  (dims) => {
    const area = dims.length * dims.width;
    const areaInMeters = dims.unit === MeasurementUnit.FEET ? 
      area * FEET_TO_METERS * FEET_TO_METERS : area;
    return areaInMeters >= MIN_GARDEN_AREA && areaInMeters <= MAX_GARDEN_AREA;
  },
  {
    message: `Garden area must be between ${MIN_GARDEN_AREA}m² and ${MAX_GARDEN_AREA}m²`
  }
);

/**
 * Zod schema for complete garden validation
 * Implements requirements F-001-RQ-001, F-001-RQ-002, F-001-RQ-003
 */
export const gardenSchema = z.object({
  dimensions: dimensionsSchema,
  soilType: z.enum([
    SoilType.RED_SOIL,
    SoilType.SANDY_SOIL,
    SoilType.LOAMY_SOIL,
    SoilType.CLAY_SOIL,
    SoilType.BLACK_SOIL
  ]).describe('Soil type must be one of the supported types'),
  sunlight: z.enum([
    SunlightCondition.FULL_SUN,
    SunlightCondition.PARTIAL_SHADE,
    SunlightCondition.FULL_SHADE
  ]).describe('Sunlight condition must be specified')
});

/**
 * Zod schema for crop validation with space optimization
 * Implements requirement F-002-RQ-001, F-002-RQ-002
 */
export const cropSchema = z.object({
  quantityNeeded: z.number()
    .min(MIN_QUANTITY, `Quantity must be at least ${MIN_QUANTITY}`)
    .positive('Quantity must be positive'),
  growBags: z.number()
    .min(MIN_GROW_BAGS, `Must have at least ${MIN_GROW_BAGS} grow bag`)
    .int('Grow bags must be a whole number'),
  bagSize: z.enum([
    BagSize.EIGHT_INCH,
    BagSize.TEN_INCH,
    BagSize.TWELVE_INCH,
    BagSize.FOURTEEN_INCH
  ]).describe('Bag size must be a standard size')
});

/**
 * Zod schema for maintenance task validation
 */
export const maintenanceSchema = z.object({
  taskType: z.enum([
    TaskType.Fertilizer,
    TaskType.Water,
    TaskType.Composting
  ]),
  frequency: z.enum([
    Frequency.Daily,
    Frequency.Weekly,
    Frequency.BiWeekly,
    Frequency.Monthly,
    Frequency.Custom
  ]),
  amount: z.number().positive('Amount must be positive'),
  unit: z.enum([
    Unit.Grams,
    Unit.Milliliters,
    Unit.Liters,
    Unit.Kilograms
  ]),
  preferredTime: z.enum([
    TimeOfDay.Morning,
    TimeOfDay.Afternoon,
    TimeOfDay.Evening,
    TimeOfDay.Night
  ])
});

/**
 * Validates garden dimensions with unit conversion
 * @param dimensions Garden dimensions to validate
 * @param unit Measurement unit for conversion
 */
export function validateGardenDimensions(
  dimensions: { length: number; width: number },
  unit: MeasurementUnit
): ValidationResult<{ length: number; width: number; areaInMeters: number }> {
  const result: ValidationResult<{ length: number; width: number; areaInMeters: number }> = {
    isValid: false,
    errors: [],
    warnings: []
  };

  try {
    const validatedDims = dimensionsSchema.parse({ ...dimensions, unit });
    const conversionFactor = unit === MeasurementUnit.FEET ? FEET_TO_METERS : 1;
    const areaInMeters = validatedDims.length * validatedDims.width * conversionFactor * conversionFactor;

    result.isValid = true;
    result.data = {
      length: validatedDims.length,
      width: validatedDims.width,
      areaInMeters
    };

    // Add warnings for dimensions close to limits
    if (areaInMeters < MIN_GARDEN_AREA * 1.1) {
      result.warnings.push('Garden area is close to minimum recommended size');
    }
    if (areaInMeters > MAX_GARDEN_AREA * 0.9) {
      result.warnings.push('Garden area is approaching maximum allowed size');
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      result.errors = error.errors.map(err => err.message);
    } else {
      result.errors.push('Invalid dimensions provided');
    }
  }

  return result;
}

/**
 * Validates crop requirements and checks space utilization
 * @param crop Crop data to validate
 * @param availableArea Available garden area in square meters
 */
export function validateCropRequirements(
  crop: Pick<Crop, 'quantityNeeded' | 'growBags' | 'bagSize'>,
  availableArea: number
): ValidationResult<{ spaceUtilization: number }> {
  const result: ValidationResult<{ spaceUtilization: number }> = {
    isValid: false,
    errors: [],
    warnings: [],
    recommendations: []
  };

  try {
    const validatedCrop = cropSchema.parse(crop);
    
    // Calculate space utilization based on bag size
    const bagSizeInMeters = parseInt(validatedCrop.bagSize) * 0.0254; // Convert inches to meters
    const totalBagArea = Math.PI * Math.pow(bagSizeInMeters / 2, 2) * validatedCrop.growBags;
    const spaceUtilization = totalBagArea / availableArea;

    result.isValid = true;
    result.data = { spaceUtilization };

    // Add warnings and recommendations for space utilization
    if (spaceUtilization > SPACE_CAPACITY_WARNING_THRESHOLD) {
      result.warnings.push('Garden space utilization exceeds recommended threshold');
      result.recommendations?.push('Consider reducing the number of grow bags or using smaller sizes');
    }

    if (spaceUtilization < 0.5) {
      result.recommendations?.push('Space utilization is low - consider adding more plants');
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      result.errors = error.errors.map(err => err.message);
    } else {
      result.errors.push('Invalid crop requirements provided');
    }
  }

  return result;
}

/**
 * Validates maintenance task parameters and provides schedule optimization
 * @param task Maintenance task to validate
 */
export function validateMaintenanceTask(
  task: Partial<MaintenanceTask>
): ValidationResult<MaintenanceTask> {
  const result: ValidationResult<MaintenanceTask> = {
    isValid: false,
    errors: [],
    warnings: [],
    recommendations: []
  };

  try {
    const validatedTask = maintenanceSchema.parse(task);

    // Add task-specific recommendations
    switch (validatedTask.taskType) {
      case TaskType.Water:
        if (validatedTask.preferredTime === TimeOfDay.Afternoon) {
          result.warnings.push('Watering in afternoon may lead to water loss through evaporation');
          result.recommendations?.push('Consider watering in early morning or evening');
        }
        break;
      case TaskType.Fertilizer:
        if (validatedTask.frequency === Frequency.Daily) {
          result.warnings.push('Daily fertilization may not be necessary');
          result.recommendations?.push('Consider reducing fertilization frequency to weekly');
        }
        break;
    }

    result.isValid = true;
    result.data = validatedTask as MaintenanceTask;
  } catch (error) {
    if (error instanceof z.ZodError) {
      result.errors = error.errors.map(err => err.message);
    } else {
      result.errors.push('Invalid maintenance task parameters provided');
    }
  }

  return result;
}