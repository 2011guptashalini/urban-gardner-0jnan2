import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, describe, it, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { axe } from '@axe-core/react';

import TaskList from './TaskList';
import { renderWithProviders } from '../../../utils/test-utils';
import { TaskType, Frequency, TimeOfDay, Unit } from '../../../types/maintenance';

// Mock AI service
const mockAIService = vi.fn();
vi.mock('../../../api/maintenance', () => ({
  getAIRecommendations: () => mockAIService()
}));

describe('TaskList Component', () => {
  // Test data setup
  const mockTasks = [
    {
      id: '1',
      cropId: 'garden-1',
      taskType: TaskType.Water,
      frequency: Frequency.Daily,
      amount: 500,
      unit: Unit.Milliliters,
      preferredTime: TimeOfDay.Morning,
      aiRecommended: false,
      aiConfidence: 0,
      active: true,
      nextScheduledTime: new Date(),
      lastCompletedTime: null,
      completionHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      cropId: 'garden-1',
      taskType: TaskType.Fertilizer,
      frequency: Frequency.Weekly,
      amount: 50,
      unit: Unit.Grams,
      preferredTime: TimeOfDay.Morning,
      aiRecommended: true,
      aiConfidence: 0.95,
      active: true,
      nextScheduledTime: new Date(),
      lastCompletedTime: null,
      completionHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const defaultProps = {
    gardenId: 'garden-1',
    pageSize: 10
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAIService.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders task list with tasks', async () => {
    const { store } = renderWithProviders(
      <TaskList {...defaultProps} />,
      {
        preloadedState: {
          maintenance: {
            tasks: mockTasks,
            loading: false,
            error: null
          }
        }
      }
    );

    // Verify tasks are rendered
    expect(screen.getByText('Water')).toBeInTheDocument();
    expect(screen.getByText('Fertilizer')).toBeInTheDocument();
    expect(screen.getByText('500 ml')).toBeInTheDocument();
    expect(screen.getByText('50 g')).toBeInTheDocument();
  });

  it('handles task filtering correctly', async () => {
    const { store } = renderWithProviders(
      <TaskList {...defaultProps} />,
      {
        preloadedState: {
          maintenance: {
            tasks: mockTasks,
            loading: false,
            error: null
          }
        }
      }
    );

    // Filter by Water tasks
    const filterSelect = screen.getByRole('combobox');
    await userEvent.selectOptions(filterSelect, TaskType.Water);

    // Verify only water tasks are shown
    expect(screen.getByText('Water')).toBeInTheDocument();
    expect(screen.queryByText('Fertilizer')).not.toBeInTheDocument();
  });

  it('handles task completion', async () => {
    const { store } = renderWithProviders(
      <TaskList {...defaultProps} />,
      {
        preloadedState: {
          maintenance: {
            tasks: mockTasks,
            loading: false,
            error: null
          }
        }
      }
    );

    // Complete a task
    const completeButtons = screen.getAllByRole('button', { name: /Complete task/i });
    await userEvent.click(completeButtons[0]);

    // Verify task completion action was dispatched
    const actions = store.getActions();
    expect(actions).toContainEqual(
      expect.objectContaining({
        type: 'maintenance/completeTask/pending'
      })
    );
  });

  it('handles task deletion with confirmation', async () => {
    const { store } = renderWithProviders(
      <TaskList {...defaultProps} />,
      {
        preloadedState: {
          maintenance: {
            tasks: mockTasks,
            loading: false,
            error: null
          }
        }
      }
    );

    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockImplementation(() => true);

    // Delete a task
    const deleteButtons = screen.getAllByRole('button', { name: /Delete task/i });
    await userEvent.click(deleteButtons[0]);

    // Verify confirmation was shown and delete action was dispatched
    expect(confirmSpy).toHaveBeenCalled();
    const actions = store.getActions();
    expect(actions).toContainEqual(
      expect.objectContaining({
        type: 'maintenance/updateTask/pending'
      })
    );

    confirmSpy.mockRestore();
  });

  it('displays AI recommendations badge correctly', () => {
    renderWithProviders(
      <TaskList {...defaultProps} />,
      {
        preloadedState: {
          maintenance: {
            tasks: mockTasks,
            loading: false,
            error: null
          }
        }
      }
    );

    // Verify AI recommendation badge is shown only for AI recommended tasks
    const aiRecommendedBadge = screen.getByText('AI Recommended');
    expect(aiRecommendedBadge).toBeInTheDocument();
    expect(aiRecommendedBadge).toHaveAttribute('title', expect.stringContaining('95%'));
  });

  it('handles empty state correctly', () => {
    renderWithProviders(
      <TaskList {...defaultProps} />,
      {
        preloadedState: {
          maintenance: {
            tasks: [],
            loading: false,
            error: null
          }
        }
      }
    );

    // Verify empty state message and add task button
    expect(screen.getByText(/No maintenance tasks found/i)).toBeInTheDocument();
    expect(screen.getByText('Add First Task')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    renderWithProviders(
      <TaskList {...defaultProps} />,
      {
        preloadedState: {
          maintenance: {
            tasks: [],
            loading: true,
            error: null
          }
        }
      }
    );

    // Verify loading indicator is shown
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles error state', () => {
    const errorMessage = 'Failed to load tasks';
    renderWithProviders(
      <TaskList {...defaultProps} />,
      {
        preloadedState: {
          maintenance: {
            tasks: [],
            loading: false,
            error: errorMessage
          }
        }
      }
    );

    // Verify error message is shown
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('meets accessibility requirements', async () => {
    const { container } = renderWithProviders(
      <TaskList {...defaultProps} />,
      {
        preloadedState: {
          maintenance: {
            tasks: mockTasks,
            loading: false,
            error: null
          }
        }
      }
    );

    // Run accessibility tests
    const results = await axe(container);
    expect(results).toHaveNoViolations();

    // Verify ARIA attributes
    expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Maintenance Tasks');
    expect(screen.getAllByRole('listitem')).toHaveLength(mockTasks.length);
  });

  it('optimizes performance with virtual list', async () => {
    // Create large dataset for performance testing
    const largeMockTasks = Array.from({ length: 100 }, (_, i) => ({
      ...mockTasks[0],
      id: `task-${i}`,
      taskType: i % 2 === 0 ? TaskType.Water : TaskType.Fertilizer
    }));

    const { container } = renderWithProviders(
      <TaskList {...defaultProps} />,
      {
        preloadedState: {
          maintenance: {
            tasks: largeMockTasks,
            loading: false,
            error: null
          }
        }
      }
    );

    // Verify virtual list is used
    expect(container.querySelector('.react-window-list')).toBeInTheDocument();

    // Verify only visible items are rendered
    const renderedItems = screen.getAllByRole('listitem');
    expect(renderedItems.length).toBeLessThan(largeMockTasks.length);
  });
});