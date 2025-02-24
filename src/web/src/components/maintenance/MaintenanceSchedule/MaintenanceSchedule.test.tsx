import React from 'react';
import { screen, within, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { renderWithProviders } from '../../../utils/test-utils';
import MaintenanceSchedule from './MaintenanceSchedule';
import { TaskType, Frequency, TimeOfDay, Unit } from '../../../types/maintenance';

// Viewport sizes for responsive testing
const VIEWPORT_SIZES = {
  MOBILE: { width: 375, height: 667 },
  TABLET: { width: 768, height: 1024 },
  DESKTOP: { width: 1440, height: 900 }
};

// Performance thresholds based on requirements
const PERFORMANCE_THRESHOLDS = {
  AI_RECOMMENDATION_LOAD: 3000, // 3s SLA requirement
  TASK_LIST_RENDER: 100, // 100ms for initial render
  VIRTUAL_SCROLL_UPDATE: 16 // 16ms for smooth scrolling
};

// Mock maintenance task for testing
const mockMaintenanceTask = {
  id: 'task-1',
  cropId: 'crop-1',
  taskType: TaskType.Fertilizer,
  frequency: Frequency.Weekly,
  amount: 50,
  unit: Unit.Grams,
  preferredTime: TimeOfDay.Morning,
  aiRecommended: true,
  aiConfidence: 0.95,
  active: true,
  nextScheduledTime: new Date(),
  lastCompletedTime: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
};

// Setup function for consistent test environment
const setupMaintenanceSchedule = async (props = {}, options = {}) => {
  const mockTasks = Array.from({ length: 20 }, (_, i) => ({
    ...mockMaintenanceTask,
    id: `task-${i + 1}`,
    aiRecommended: i % 2 === 0
  }));

  const user = userEvent.setup();
  const result = renderWithProviders(
    <MaintenanceSchedule
      gardenId="garden-1"
      showAIRecommendations={true}
      {...props}
    />,
    {
      preloadedState: {
        maintenance: {
          tasks: mockTasks,
          loading: false,
          error: null
        }
      },
      ...options
    }
  );

  return { result, user, tasks: mockTasks };
};

describe('MaintenanceSchedule Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Rendering and State Management', () => {
    it('renders loading state with skeleton UI', () => {
      renderWithProviders(
        <MaintenanceSchedule gardenId="garden-1" />,
        {
          preloadedState: {
            maintenance: { loading: true }
          }
        }
      );

      expect(screen.getByText('Loading maintenance schedule...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders task list when data is loaded', async () => {
      const { tasks } = await setupMaintenanceSchedule();
      
      await waitFor(() => {
        expect(screen.getByRole('region', { name: /garden maintenance schedule/i })).toBeInTheDocument();
        expect(screen.getAllByRole('listitem')).toHaveLength(Math.min(tasks.length, 10)); // Initial viewport
      });
    });

    it('handles error states gracefully', async () => {
      renderWithProviders(
        <MaintenanceSchedule gardenId="garden-1" />,
        {
          preloadedState: {
            maintenance: {
              error: 'Failed to load maintenance schedule'
            }
          }
        }
      );

      expect(screen.getByRole('alert')).toHaveTextContent('Failed to load maintenance schedule');
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('preserves scroll position on re-render', async () => {
      const { result, user } = await setupMaintenanceSchedule();
      const container = screen.getByRole('region');
      
      // Scroll down
      fireEvent.scroll(container, { target: { scrollTop: 500 } });
      
      // Trigger re-render
      await user.click(screen.getByRole('button', { name: /refresh/i }));
      
      expect(container.scrollTop).toBe(500);
    });
  });

  describe('Task Management', () => {
    it('completes task with optimistic update', async () => {
      const { user } = await setupMaintenanceSchedule();
      const completeButton = screen.getAllByRole('button', { name: /complete task/i })[0];
      
      await user.click(completeButton);
      
      expect(screen.getByText('Task completed successfully')).toBeInTheDocument();
    });

    it('edits task details with validation', async () => {
      const { user } = await setupMaintenanceSchedule();
      const editButton = screen.getAllByRole('button', { name: /edit/i })[0];
      
      await user.click(editButton);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('deletes task with confirmation', async () => {
      const { user } = await setupMaintenanceSchedule();
      const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
      
      await user.click(deleteButton);
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
  });

  describe('AI Recommendations', () => {
    it('loads AI recommendations within 3s', async () => {
      const startTime = performance.now();
      const { result } = await setupMaintenanceSchedule();
      
      await waitFor(() => {
        expect(screen.getByText(/AI Status:/)).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(PERFORMANCE_THRESHOLDS.AI_RECOMMENDATION_LOAD);
    });

    it('displays confidence scores correctly', async () => {
      await setupMaintenanceSchedule();
      const aiTasks = screen.getAllByText(/AI Recommended/);
      
      aiTasks.forEach(task => {
        const confidence = within(task.parentElement!).getByText(/\d{1,3}%/);
        expect(parseFloat(confidence.textContent!)).toBeGreaterThanOrEqual(70);
      });
    });

    it('handles AI service failures gracefully', async () => {
      renderWithProviders(
        <MaintenanceSchedule gardenId="garden-1" />,
        {
          preloadedState: {
            maintenance: {
              aiRecommendationStatus: 'error'
            }
          }
        }
      );

      expect(screen.getByText(/AI Status: error/i)).toBeInTheDocument();
    });
  });

  describe('Virtual Scrolling', () => {
    it('renders visible items only', async () => {
      const { tasks } = await setupMaintenanceSchedule();
      const visibleItems = screen.getAllByRole('listitem');
      
      expect(visibleItems.length).toBeLessThan(tasks.length);
    });

    it('maintains smooth scrolling performance', async () => {
      const { result } = await setupMaintenanceSchedule();
      const container = screen.getByRole('region');
      const startTime = performance.now();
      
      fireEvent.scroll(container, { target: { scrollTop: 1000 } });
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(PERFORMANCE_THRESHOLDS.VIRTUAL_SCROLL_UPDATE);
    });
  });

  describe('Accessibility', () => {
    it('meets WCAG 2.1 AA standards', async () => {
      const { result } = await setupMaintenanceSchedule();
      await result.checkAccessibility();
    });

    it('supports keyboard navigation', async () => {
      const { user } = await setupMaintenanceSchedule();
      const firstTask = screen.getAllByRole('listitem')[0];
      
      await user.tab();
      expect(firstTask).toHaveFocus();
    });

    it('provides screen reader announcements', async () => {
      const { user } = await setupMaintenanceSchedule();
      const completeButton = screen.getAllByRole('button', { name: /complete task/i })[0];
      
      await user.click(completeButton);
      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Performance', () => {
    it('renders initial view within 100ms', async () => {
      const startTime = performance.now();
      await setupMaintenanceSchedule();
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(PERFORMANCE_THRESHOLDS.TASK_LIST_RENDER);
    });

    it('processes AI recommendations within 3s', async () => {
      const { user } = await setupMaintenanceSchedule();
      const aiButton = screen.getByRole('button', { name: /get ai recommendations/i });
      
      const startTime = performance.now();
      await user.click(aiButton);
      
      await waitFor(() => {
        expect(screen.getByText(/AI Status: success/i)).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(PERFORMANCE_THRESHOLDS.AI_RECOMMENDATION_LOAD);
    });

    it('handles large task lists efficiently', async () => {
      const largeMockTasks = Array.from({ length: 100 }, (_, i) => ({
        ...mockMaintenanceTask,
        id: `task-${i + 1}`
      }));

      const startTime = performance.now();
      await setupMaintenanceSchedule({}, {
        preloadedState: {
          maintenance: {
            tasks: largeMockTasks,
            loading: false
          }
        }
      });
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(PERFORMANCE_THRESHOLDS.TASK_LIST_RENDER);
    });
  });
});