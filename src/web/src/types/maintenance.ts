/**
 * @fileoverview TypeScript type definitions for garden maintenance operations
 * Defines types and interfaces for task scheduling, frequencies, and AI recommendations
 * @version 1.0.0
 */

/**
 * Types of maintenance tasks that can be performed on garden crops
 */
export enum TaskType {
    Fertilizer = 'Fertilizer',
    Water = 'Water',
    Composting = 'Composting'
}

/**
 * Frequency options for scheduling maintenance tasks
 */
export enum Frequency {
    Daily = 'Daily',
    Weekly = 'Weekly',
    BiWeekly = 'BiWeekly',
    Monthly = 'Monthly',
    Custom = 'Custom'
}

/**
 * Units of measurement for maintenance task quantities
 */
export enum Unit {
    Grams = 'g',
    Milliliters = 'ml',
    Liters = 'L',
    Kilograms = 'kg'
}

/**
 * Preferred time of day for performing maintenance tasks
 */
export enum TimeOfDay {
    Morning = 'Morning',
    Afternoon = 'Afternoon',
    Evening = 'Evening',
    Night = 'Night'
}

/**
 * Interface representing a maintenance task completion record
 */
interface TaskCompletionRecord {
    date: Date;
    success: boolean;
    notes: string;
}

/**
 * Interface for a complete maintenance task entity
 */
export interface MaintenanceTask {
    /** Unique identifier for the task */
    id: string;
    
    /** ID of the crop this task is associated with */
    cropId: string;
    
    /** Type of maintenance task */
    taskType: TaskType;
    
    /** Frequency of task occurrence */
    frequency: Frequency;
    
    /** Custom frequency in days (only used when frequency is Custom) */
    customFrequencyDays: number | null;
    
    /** Quantity of material to be used */
    amount: number;
    
    /** Unit of measurement for the amount */
    unit: Unit;
    
    /** Preferred time of day for task execution */
    preferredTime: TimeOfDay;
    
    /** Indicates if this task was recommended by AI */
    aiRecommended: boolean;
    
    /** AI confidence score for the recommendation (0-1) */
    aiConfidence: number;
    
    /** Indicates if the task is currently active */
    active: boolean;
    
    /** Next scheduled execution time */
    nextScheduledTime: Date;
    
    /** Last successful completion time */
    lastCompletedTime: Date | null;
    
    /** History of task completions */
    completionHistory: Array<TaskCompletionRecord>;
    
    /** Task creation timestamp */
    createdAt: Date;
    
    /** Last update timestamp */
    updatedAt: Date;
}

/**
 * Interface for creating a new maintenance task
 */
export interface MaintenanceTaskRequest {
    /** ID of the crop this task is for */
    cropId: string;
    
    /** Type of maintenance task */
    taskType: TaskType;
    
    /** Frequency of task occurrence */
    frequency: Frequency;
    
    /** Custom frequency in days (required when frequency is Custom) */
    customFrequencyDays: number | null;
    
    /** Quantity of material to be used */
    amount: number;
    
    /** Unit of measurement for the amount */
    unit: Unit;
    
    /** Preferred time of day for task execution */
    preferredTime: TimeOfDay;
    
    /** Whether to use AI for task recommendations */
    useAiRecommendations: boolean;
}

/**
 * Interface for paginated maintenance task list responses
 */
export interface MaintenanceTaskList {
    /** Array of maintenance tasks */
    tasks: MaintenanceTask[];
    
    /** Total number of tasks matching the query */
    total: number;
    
    /** Current page number */
    page: number;
    
    /** Number of items per page */
    pageSize: number;
    
    /** Indicates if there is a next page */
    hasNextPage: boolean;
    
    /** Indicates if there is a previous page */
    hasPreviousPage: boolean;
}