/**
 * MaintenanceScheduler Component
 * Enterprise-grade React component for managing garden maintenance schedules
 * with AI-powered recommendations and comprehensive task management.
 * @version 1.0.0
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import styled from 'styled-components'; // ^5.3.0
import { useErrorBoundary } from 'react-error-boundary'; // ^4.0.0
import { ErrorBoundary } from 'react-error-boundary'; // ^4.0.0
import { useDebounce } from 'use-debounce'; // ^9.0.0
import {
  CircularProgress,
  Alert,
  AlertTitle,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  TextField,
  MenuItem
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import MaintenanceSchedule from '../../components/maintenance/MaintenanceSchedule/MaintenanceSchedule';
import { MaintenanceTask, TaskType, Frequency, TimeOfDay, Unit } from '../../types/maintenance';
import { useMaintenance } from '../../hooks/useMaintenance';
import { flexColumn, cardContainer } from '../../styles/mixins';

// Styled Components
const SchedulerContainer = styled.div`
  ${flexColumn}
  ${cardContainer}
  width: 100%;
  max-width: ${({ theme }) => theme.spacing.container.lg};
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.lg};
`;

const SchedulerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const SchedulerControls = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: center;
`;

const AIRecommendationChip = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.primary}10;
`;

interface MaintenanceSchedulerProps {
  gardenId: string;
  initialTasks?: MaintenanceTask[];
  onError?: (error: Error) => void;
}

const MaintenanceScheduler: React.FC<MaintenanceSchedulerProps> = ({
  gardenId,
  initialTasks = [],
  onError
}) => {
  // State management
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaskData, setNewTaskData] = useState<Partial<MaintenanceTask>>({});
  const [notification, setNotification] = useState<{
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);

  // Custom hooks
  const { showBoundary } = useErrorBoundary();
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

  // Debounced AI recommendations to prevent excessive API calls
  const [debouncedAIRecommendations] = useDebounce(getAIRecommendations, 300);

  // Memoized task handlers
  const handleCreateTask = useCallback(async () => {
    try {
      if (!newTaskData.taskType || !newTaskData.frequency) {
        throw new Error('Please fill in all required fields');
      }

      await createTask({
        cropId: gardenId,
        taskType: newTaskData.taskType as TaskType,
        frequency: newTaskData.frequency as Frequency,
        preferredTime: newTaskData.preferredTime as TimeOfDay || TimeOfDay.Morning,
        amount: newTaskData.amount || 0,
        unit: newTaskData.unit as Unit || Unit.Milliliters,
        customFrequencyDays: null,
        useAiRecommendations: true
      });

      setShowCreateModal(false);
      setNewTaskData({});
      setNotification({
        message: 'Task created successfully',
        severity: 'success'
      });
    } catch (error) {
      setNotification({
        message: error.message,
        severity: 'error'
      });
      onError?.(error);
    }
  }, [createTask, gardenId, newTaskData, onError]);

  const handleAIRecommendations = useCallback(async () => {
    try {
      await debouncedAIRecommendations();
      setNotification({
        message: 'AI recommendations updated successfully',
        severity: 'success'
      });
    } catch (error) {
      setNotification({
        message: 'Failed to get AI recommendations',
        severity: 'error'
      });
      onError?.(error);
    }
  }, [debouncedAIRecommendations, onError]);

  // Effect for error handling
  useEffect(() => {
    if (error) {
      showBoundary(error);
    }
  }, [error, showBoundary]);

  // Effect for initial AI recommendations
  useEffect(() => {
    if (tasks.length === 0 && !loading) {
      handleAIRecommendations();
    }
  }, [tasks.length, loading, handleAIRecommendations]);

  // Render create task modal
  const renderCreateTaskModal = () => (
    <Dialog
      open={showCreateModal}
      onClose={() => setShowCreateModal(false)}
      aria-labelledby="create-task-dialog"
    >
      <DialogTitle id="create-task-dialog">Create Maintenance Task</DialogTitle>
      <DialogContent>
        <TextField
          select
          fullWidth
          margin="normal"
          label="Task Type"
          value={newTaskData.taskType || ''}
          onChange={(e) => setNewTaskData({ ...newTaskData, taskType: e.target.value as TaskType })}
        >
          {Object.values(TaskType).map((type) => (
            <MenuItem key={type} value={type}>{type}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          fullWidth
          margin="normal"
          label="Frequency"
          value={newTaskData.frequency || ''}
          onChange={(e) => setNewTaskData({ ...newTaskData, frequency: e.target.value as Frequency })}
        >
          {Object.values(Frequency).map((freq) => (
            <MenuItem key={freq} value={freq}>{freq}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          fullWidth
          margin="normal"
          label="Preferred Time"
          value={newTaskData.preferredTime || TimeOfDay.Morning}
          onChange={(e) => setNewTaskData({ ...newTaskData, preferredTime: e.target.value as TimeOfDay })}
        >
          {Object.values(TimeOfDay).map((time) => (
            <MenuItem key={time} value={time}>{time}</MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowCreateModal(false)}>Cancel</Button>
        <Button onClick={handleCreateTask} color="primary">Create</Button>
      </DialogActions>
    </Dialog>
  );

  if (loading) {
    return (
      <SchedulerContainer>
        <CircularProgress />
      </SchedulerContainer>
    );
  }

  return (
    <ErrorBoundary
      FallbackComponent={({ error }) => (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {error.message}
        </Alert>
      )}
      onReset={refreshSchedule}
    >
      <SchedulerContainer>
        <SchedulerHeader>
          <h1>Garden Maintenance Schedule</h1>
          <SchedulerControls>
            <Tooltip title="Get AI Recommendations">
              <IconButton
                onClick={handleAIRecommendations}
                disabled={aiRecommendationStatus === 'loading'}
              >
                <AIIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh Schedule">
              <IconButton onClick={refreshSchedule} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateModal(true)}
            >
              Add Task
            </Button>
          </SchedulerControls>
        </SchedulerHeader>

        <MaintenanceSchedule
          gardenId={gardenId}
          showAIRecommendations={true}
          onError={onError}
          options={{
            refreshInterval: 300000,
            confidenceThreshold: 0.7,
            maxTasks: 50
          }}
        />

        {renderCreateTaskModal()}

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
      </SchedulerContainer>
    </ErrorBoundary>
  );
};

export default MaintenanceScheduler;