import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FixedSizeList as VirtualList } from 'react-window'; // v1.8.9
import { 
  IconButton, 
  Tooltip, 
  Chip,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Checkbox
} from '@mui/material'; // v5.14.0
import {
  CheckCircle as CheckIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Refresh as RefreshIcon,
  AutoAwesome as AIIcon
} from '@mui/icons-material';

import {
  TaskListContainer,
  TaskHeader,
  TaskItem,
  TaskContent,
  TaskName,
  TaskDetails,
  TaskFrequency,
  TaskAmount,
  TaskTime,
  AddTaskButton
} from './TaskList.styles';

import { MaintenanceTask, TaskType, Frequency, TimeOfDay } from '../../../types/maintenance';
import { useMaintenance } from '../../../hooks/useMaintenance';

interface TaskListProps {
  gardenId: string;
  filter?: TaskType | null;
  sortBy?: string;
  searchQuery?: string;
  pageSize?: number;
}

const TaskList: React.FC<TaskListProps> = ({
  gardenId,
  filter = null,
  sortBy = 'nextScheduledTime',
  searchQuery = '',
  pageSize = 10
}) => {
  // State management
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [localFilter, setLocalFilter] = useState<TaskType | null>(filter);
  const [localSort, setLocalSort] = useState<string>(sortBy);
  const [localSearch, setLocalSearch] = useState<string>(searchQuery);

  // Virtual list configuration
  const listRef = useRef<VirtualList>(null);
  const listHeight = 600;
  const itemHeight = 80;

  // Custom hook for maintenance operations
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

  // Memoized task handlers
  const handleTaskComplete = useCallback(async (task: MaintenanceTask, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await completeTask(task.id);
      setSelectedTasks(prev => {
        const updated = new Set(prev);
        updated.delete(task.id);
        return updated;
      });
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  }, [completeTask]);

  const handleTaskDelete = useCallback(async (task: MaintenanceTask, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await updateTask(task.id, { active: false });
        setSelectedTasks(prev => {
          const updated = new Set(prev);
          updated.delete(task.id);
          return updated;
        });
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  }, [updateTask]);

  // Task filtering and sorting
  const filteredTasks = React.useMemo(() => {
    return tasks
      .filter(task => {
        if (localFilter && task.taskType !== localFilter) return false;
        if (localSearch) {
          const searchLower = localSearch.toLowerCase();
          return (
            task.taskType.toLowerCase().includes(searchLower) ||
            task.frequency.toLowerCase().includes(searchLower)
          );
        }
        return true;
      })
      .sort((a, b) => {
        switch (localSort) {
          case 'nextScheduledTime':
            return a.nextScheduledTime.getTime() - b.nextScheduledTime.getTime();
          case 'taskType':
            return a.taskType.localeCompare(b.taskType);
          case 'frequency':
            return a.frequency.localeCompare(b.frequency);
          default:
            return 0;
        }
      });
  }, [tasks, localFilter, localSort, localSearch]);

  // Render task item with memoization
  const renderTaskItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const task = filteredTasks[index];
    if (!task) return null;

    return (
      <TaskItem style={style} role="listitem" aria-label={`Maintenance task: ${task.taskType}`}>
        <TaskContent>
          <TaskName>
            {task.taskType}
            {task.aiRecommended && (
              <Tooltip title={`AI Confidence: ${(task.aiConfidence * 100).toFixed(1)}%`}>
                <Chip
                  icon={<AIIcon />}
                  label="AI Recommended"
                  size="small"
                  color="primary"
                  sx={{ ml: 1 }}
                />
              </Tooltip>
            )}
          </TaskName>
          <TaskDetails>
            Next scheduled: {task.nextScheduledTime.toLocaleDateString()}
          </TaskDetails>
        </TaskContent>

        <TaskFrequency>
          <span>{task.frequency}</span>
        </TaskFrequency>

        <TaskAmount>
          <span>{`${task.amount} ${task.unit}`}</span>
        </TaskAmount>

        <TaskTime>
          <span>{task.preferredTime}</span>
        </TaskTime>

        <div>
          <Tooltip title="Complete Task">
            <IconButton
              onClick={(e) => handleTaskComplete(task, e)}
              aria-label="Complete task"
              color="primary"
              size="small"
            >
              <CheckIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Task">
            <IconButton
              onClick={(e) => handleTaskDelete(task, e)}
              aria-label="Delete task"
              color="error"
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </div>
      </TaskItem>
    );
  }, [filteredTasks, handleTaskComplete, handleTaskDelete]);

  // Empty state renderer
  const renderEmptyState = () => (
    <Alert
      severity="info"
      action={
        <AddTaskButton onClick={() => createTask({
          cropId: gardenId,
          taskType: TaskType.Water,
          frequency: Frequency.Daily,
          preferredTime: TimeOfDay.Morning,
          amount: 500,
          unit: 'ml',
          customFrequencyDays: null,
          useAiRecommendations: true
        })}>
          Add First Task
        </AddTaskButton>
      }
    >
      No maintenance tasks found. Start by adding your first task or use AI recommendations.
    </Alert>
  );

  // Effect for AI recommendations
  useEffect(() => {
    if (tasks.length === 0 && !loading && !error) {
      getAIRecommendations().catch(console.error);
    }
  }, [tasks.length, loading, error, getAIRecommendations]);

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <TaskListContainer role="region" aria-label="Maintenance Tasks">
      <TaskHeader>
        <div>
          <TextField
            size="small"
            placeholder="Search tasks..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            sx={{ mr: 2 }}
          />
          <TextField
            select
            size="small"
            value={localFilter || ''}
            onChange={(e) => setLocalFilter(e.target.value as TaskType || null)}
            sx={{ width: 150, mr: 2 }}
          >
            <MenuItem value="">All Types</MenuItem>
            {Object.values(TaskType).map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </TextField>
        </div>
        <div>
          <Tooltip title="Refresh Tasks">
            <IconButton onClick={refreshSchedule} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Get AI Recommendations">
            <IconButton
              onClick={() => getAIRecommendations()}
              disabled={loading || aiRecommendationStatus === 'loading'}
            >
              <AIIcon />
            </IconButton>
          </Tooltip>
        </div>
      </TaskHeader>

      {loading ? (
        <CircularProgress sx={{ m: 'auto' }} />
      ) : filteredTasks.length === 0 ? (
        renderEmptyState()
      ) : (
        <VirtualList
          ref={listRef}
          height={listHeight}
          width="100%"
          itemCount={filteredTasks.length}
          itemSize={itemHeight}
        >
          {renderTaskItem}
        </VirtualList>
      )}
    </TaskListContainer>
  );
};

export default React.memo(TaskList);