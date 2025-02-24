/**
 * Custom React hook for managing garden maintenance operations
 * Implements task scheduling, AI recommendations, and optimistic updates
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectMaintenanceSchedule,
  selectMaintenanceLoading,
  selectMaintenanceError
} from '../store/slices/maintenanceSlice';
import {
  MaintenanceTask,
  MaintenanceTaskRequest,
  TaskType,
  Frequency,
  TimeOfDay,
  Unit
} from '../types/maintenance';
import {
  getAllMaintenanceTasks,
  createMaintenanceTask,
  updateMaintenanceTask,
  completeTask,
  getAIRecommendations,
  bulkUpdateTasks
} from '../api/maintenance';

// Cache duration for maintenance data (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Hook for managing garden maintenance operations
 * @param gardenId - Unique identifier of the garden
 */
export const useMaintenance = (gardenId: string) => {
  const dispatch = useDispatch();
  
  // Redux state selectors
  const schedule = useSelector(selectMaintenanceSchedule);
  const loading = useSelector(selectMaintenanceLoading);
  const error = useSelector(selectMaintenanceError);

  // Local state for optimistic updates and AI recommendations
  const [localSchedule, setLocalSchedule] = useState<MaintenanceTask[]>([]);
  const [aiRecommendationStatus, setAiRecommendationStatus] = useState<string>('idle');
  const [lastFetched, setLastFetched] = useState<number>(0);

  /**
   * Fetches maintenance schedule with caching
   */
  const fetchSchedule = async () => {
    try {
      if (Date.now() - lastFetched < CACHE_DURATION && localSchedule.length > 0) {
        return;
      }

      const response = await getAllMaintenanceTasks(1, 100, { 
        cropId: gardenId,
        active: true 
      });

      setLocalSchedule(response.tasks);
      setLastFetched(Date.now());
    } catch (error) {
      console.error('Failed to fetch maintenance schedule:', error);
      throw error;
    }
  };

  /**
   * Creates a new maintenance task with optimistic update
   */
  const createTask = async (taskRequest: MaintenanceTaskRequest): Promise<void> => {
    try {
      // Validate task request
      if (!taskRequest.cropId || !taskRequest.taskType || !taskRequest.frequency) {
        throw new Error('Invalid task request data');
      }

      // Create optimistic task
      const optimisticTask: MaintenanceTask = {
        id: `temp-${Date.now()}`,
        cropId: taskRequest.cropId,
        taskType: taskRequest.taskType,
        frequency: taskRequest.frequency,
        customFrequencyDays: taskRequest.customFrequencyDays,
        amount: taskRequest.amount,
        unit: taskRequest.unit,
        preferredTime: taskRequest.preferredTime,
        aiRecommended: false,
        aiConfidence: 0,
        active: true,
        nextScheduledTime: new Date(),
        lastCompletedTime: null,
        completionHistory: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Update local state optimistically
      setLocalSchedule(prev => [...prev, optimisticTask]);

      // Make API call
      const response = await createMaintenanceTask(taskRequest);

      // Update local state with actual response
      setLocalSchedule(prev => 
        prev.map(task => 
          task.id === optimisticTask.id ? response : task
        )
      );
    } catch (error) {
      // Rollback optimistic update
      setLocalSchedule(prev => 
        prev.filter(task => task.id !== `temp-${Date.now()}`)
      );
      throw error;
    }
  };

  /**
   * Updates an existing maintenance task with optimistic update
   */
  const updateTask = async (
    taskId: string, 
    updates: Partial<MaintenanceTask>
  ): Promise<void> => {
    try {
      // Store original task for rollback
      const originalTask = localSchedule.find(task => task.id === taskId);
      if (!originalTask) {
        throw new Error('Task not found');
      }

      // Update local state optimistically
      setLocalSchedule(prev =>
        prev.map(task =>
          task.id === taskId ? { ...task, ...updates } : task
        )
      );

      // Make API call
      await updateMaintenanceTask(taskId, updates);
    } catch (error) {
      // Rollback to original state
      setLocalSchedule(prev =>
        prev.map(task =>
          task.id === taskId ? originalTask : task
        )
      );
      throw error;
    }
  };

  /**
   * Marks a maintenance task as completed
   */
  const completeMaintenanceTask = async (taskId: string): Promise<void> => {
    try {
      const task = localSchedule.find(t => t.id === taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      // Optimistic update
      setLocalSchedule(prev =>
        prev.map(t =>
          t.id === taskId
            ? { ...t, lastCompletedTime: new Date() }
            : t
        )
      );

      // Make API call
      await completeTask(taskId);
    } catch (error) {
      // Rollback optimistic update
      await fetchSchedule();
      throw error;
    }
  };

  /**
   * Fetches AI-powered maintenance recommendations
   */
  const getAIRecommendations = async (): Promise<void> => {
    try {
      setAiRecommendationStatus('loading');

      const recommendations = await getAIRecommendations(gardenId, {
        soilType: 'default',
        sunlight: 'full',
        temperature: 20,
        humidity: 50
      });

      // Update local schedule with AI recommendations
      const bulkUpdates = recommendations.map(recommendation => ({
        id: recommendation.id,
        updates: {
          aiRecommended: true,
          aiConfidence: recommendation.aiConfidence
        }
      }));

      await bulkUpdateTasks(bulkUpdates);
      await fetchSchedule();
      setAiRecommendationStatus('success');
    } catch (error) {
      setAiRecommendationStatus('error');
      throw error;
    }
  };

  /**
   * Refreshes the maintenance schedule
   */
  const refreshSchedule = async (): Promise<void> => {
    setLastFetched(0);
    await fetchSchedule();
  };

  // Initial fetch on mount and gardenId change
  useEffect(() => {
    if (gardenId) {
      fetchSchedule();
    }
  }, [gardenId]);

  return {
    schedule: localSchedule,
    loading,
    error,
    aiRecommendationStatus,
    createTask,
    updateTask,
    completeTask: completeMaintenanceTask,
    refreshSchedule,
    getAIRecommendations
  };
};