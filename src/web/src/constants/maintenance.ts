/**
 * @fileoverview Constants and configurations for garden maintenance operations
 * Defines default values, labels, and utility functions for maintenance tasks
 * @version 1.0.0
 */

import { TaskType, Frequency, Unit } from '../types/maintenance';

/**
 * Default number of items to display per page in maintenance task lists
 */
export const DEFAULT_PAGE_SIZE: number = 10;

/**
 * Default duration in minutes for maintenance tasks
 */
export const DEFAULT_TASK_DURATION: number = 30;

/**
 * Human-readable labels for maintenance task types
 */
export const TASK_TYPE_LABELS: Record<TaskType, string> = {
    [TaskType.Fertilizer]: 'Fertilizer',
    [TaskType.Water]: 'Water',
    [TaskType.Composting]: 'Composting'
};

/**
 * Human-readable labels for maintenance frequencies
 */
export const FREQUENCY_LABELS: Record<Frequency, string> = {
    [Frequency.Daily]: 'Daily',
    [Frequency.Weekly]: 'Weekly',
    [Frequency.BiWeekly]: 'Bi-Weekly'
};

/**
 * Human-readable labels for measurement units
 */
export const UNIT_LABELS: Record<Unit, string> = {
    [Unit.Grams]: 'g',
    [Unit.Milliliters]: 'ml'
};

/**
 * AI-recommended default amount for fertilizer tasks in grams
 * Based on optimal nutrient requirements for urban garden plants
 */
export const DEFAULT_FERTILIZER_AMOUNT: number = 50;

/**
 * AI-recommended default amount for watering tasks in milliliters
 * Based on average water requirements for container plants
 */
export const DEFAULT_WATER_AMOUNT: number = 500;

/**
 * AI-recommended default amount for composting tasks in grams
 * Based on optimal soil enrichment requirements
 */
export const DEFAULT_COMPOST_AMOUNT: number = 100;

/**
 * Default morning time for scheduling maintenance tasks
 * Optimal for water retention and nutrient absorption
 */
export const DEFAULT_MORNING_TIME: string = '06:00';

/**
 * Default evening time for scheduling maintenance tasks
 * Suitable for secondary watering and maintenance checks
 */
export const DEFAULT_EVENING_TIME: string = '18:00';

/**
 * Returns the AI-recommended default amount for a given maintenance task type
 * @param taskType - The type of maintenance task
 * @returns The recommended default amount in appropriate units
 * @throws Error if task type is not recognized
 */
export function getDefaultAmount(taskType: TaskType): number {
    switch (taskType) {
        case TaskType.Fertilizer:
            return DEFAULT_FERTILIZER_AMOUNT;
        case TaskType.Water:
            return DEFAULT_WATER_AMOUNT;
        case TaskType.Composting:
            return DEFAULT_COMPOST_AMOUNT;
        default:
            throw new Error(`Unknown task type: ${taskType}`);
    }
}

/**
 * Determines the appropriate measurement unit for a given maintenance task type
 * @param taskType - The type of maintenance task
 * @returns The appropriate unit enum value
 * @throws Error if task type is not recognized
 */
export function getDefaultUnit(taskType: TaskType): Unit {
    switch (taskType) {
        case TaskType.Fertilizer:
        case TaskType.Composting:
            return Unit.Grams;
        case TaskType.Water:
            return Unit.Milliliters;
        default:
            throw new Error(`Unknown task type: ${taskType}`);
    }
}