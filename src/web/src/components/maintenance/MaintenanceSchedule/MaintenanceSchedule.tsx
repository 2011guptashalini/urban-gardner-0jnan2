import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ErrorBoundary } from 'react-error-boundary'; // v4.0.0
import { useVirtualizer } from 'react-virtual'; // v2.10.4
import {
  CircularProgress,
  Alert,
  AlertTitle,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material'; // v5.14.0
import {
  AutoAwesome as AIIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import TaskList from '../TaskList/TaskList';
import { MaintenanceTask, TaskType, Frequency, TimeOfDay } from '../../../types/maintenance';
import { useMaintenance } from '../../../hooks/useMaintenance';

interface MaintenanceScheduleProps {
  gardenId: string;
  showAIRecommendations?: boolean;
  onError?: (error: Error) => void;
  options?: {
    refreshInterval?: number;
    confidenceThreshold?: number;
    maxTasks?: number;
  };
}

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => (
  <Alert
    severity="error"
    action={
      <Button color="inherit" size="small" onClick={resetErrorBoundary}>
        Try Again
      </Button>
    }
  >
    <AlertTitle>Error</AlertTitle>
    {error.message}
  </Alert>
);

const MaintenanceSchedule: React.FC<MaintenanceScheduleProps> = ({
  gardenId,
  showAIRecommendations = true,
  onError,
  options = {
    refreshInterval: 300000, // 5 minutes
    confidenceThreshold: 0.7,
    maxTasks: 50
  }
}) => {
  // State management
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);

  // Refs
  const scheduleRef = useRef<HTMLDivElement>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout>();

  // Custom hooks
  const {
    schedule: tasks,
    loading,
    error,
    aiRecommendationStatus,
    createTask,
    updateTask,
    completeTask,
    refreshSchedule,
    getAIRecommendations
  } = useMaintenance(gardenId);

  // Virtual list configuration
  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => scheduleRef.current,
    estimateSize: () => 80,
    overscan: 5
  });

  // Memoized task handlers
  const handleTaskComplete = useCallback(async (taskId: string) => {
    try {
      await completeTask(taskId);
      setNotification({
        message: 'Task completed successfully',
        severity: 'success'
      });
    } catch (error) {
      setNotification({
        message: 'Failed to complete task',
        severity: 'error'
      });
      onError?.(error);
    }
  }, [completeTask, onError]);

  const handleTaskEdit = useCallback(async (task: MaintenanceTask) => {
    setSelectedTask(task);
    setShowEditModal(true);
  }, []);

  const handleTaskDelete = useCallback(async (taskId: string) => {
    try {
      await updateTask(taskId, { active: false });
      setNotification({
        message: 'Task deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      setNotification({
        message: 'Failed to delete task',
        severity: 'error'
      });
      onError?.(error);
    }
  }, [updateTask, onError]);

  // AI recommendations handler
  const handleAIRecommendations = useCallback(async () => {
    if (!showAIRecommendations) return;

    try {
      await getAIRecommendations();
      setNotification({
        message: 'AI recommendations updated',
        severity: 'success'
      });
    } catch (error) {
      setNotification({
        message: 'Failed to get AI recommendations',
        severity: 'warning'
      });
      onError?.(error);
    }
  }, [showAIRecommendations, getAIRecommendations, onError]);

  // Filtered and sorted tasks
  const processedTasks = useMemo(() => {
    return tasks
      .filter(task => task.active)
      .filter(task => !task.aiRecommended || task.aiConfidence >= (options.confidenceThreshold || 0.7))
      .sort((a, b) => a.nextScheduledTime.getTime() - b.nextScheduledTime.getTime())
      .slice(0, options.maxTasks);
  }, [tasks, options.confidenceThreshold, options.maxTasks]);

  // Auto-refresh effect
  useEffect(() => {
    if (options.refreshInterval) {
      refreshTimerRef.current = setInterval(refreshSchedule, options.refreshInterval);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [refreshSchedule, options.refreshInterval]);

  // Initial AI recommendations
  useEffect(() => {
    if (showAIRecommendations && tasks.length === 0 && !loading) {
      handleAIRecommendations();
    }
  }, [showAIRecommendations, tasks.length, loading, handleAIRecommendations]);

  // Error handling effect
  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  if (loading) {
    return (
      <div className="maintenance-schedule-loading">
        <CircularProgress size={40} />
        <p>Loading maintenance schedule...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={refreshSchedule}>
      <div
        ref={scheduleRef}
        className="maintenance-schedule-container"
        role="region"
        aria-label="Garden Maintenance Schedule"
      >
        <TaskList
          tasks={processedTasks}
          onTaskComplete={handleTaskComplete}
          onTaskEdit={handleTaskEdit}
          onTaskDelete={handleTaskDelete}
        />

        {showAIRecommendations && (
          <div className="ai-recommendations-status">
            <Tooltip title="AI-powered recommendations">
              <Chip
                icon={<AIIcon />}
                label={`AI Status: ${aiRecommendationStatus}`}
                color={aiRecommendationStatus === 'success' ? 'success' : 'default'}
                onClick={handleAIRecommendations}
              />
            </Tooltip>
          </div>
        )}

        <Dialog
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          aria-labelledby="edit-task-dialog"
        >
          <DialogTitle id="edit-task-dialog">
            Edit Maintenance Task
          </DialogTitle>
          <DialogContent>
            {/* Task edit form would go here */}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button color="primary" onClick={() => setShowEditModal(false)}>
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={!!notification}
          autoHideDuration={6000}
          onClose={() => setNotification(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          {notification && (
            <Alert
              onClose={() => setNotification(null)}
              severity={notification.severity}
              variant="filled"
            >
              {notification.message}
            </Alert>
          )}
        </Snackbar>
      </div>
    </ErrorBoundary>
  );
};

export default React.memo(MaintenanceSchedule);