import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from '@axe-core/react';
import { MaintenanceSchedulerPage } from './MaintenanceScheduler';
import { renderWithProviders } from '../../utils/test-utils';
import { TaskType, Frequency, TimeOfDay, Unit } from '../../types/maintenance';

// Mock data
const mockMaintenanceSchedule = [
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
  }
];

const mockGardenData = {
  id: 'garden-1',
  name: 'Test Garden',
  dimensions: { length: 10, width: 10, unit: 'feet' },
  soilType: 'loamy_soil',
  sunlight: 'full_sun'
};

// Mock hooks
jest.mock('../../hooks/useMaintenance', () => ({
  useMaintenance: () => ({
    schedule: mockMaintenanceSchedule,
    loading: false,
    error: null,
    aiRecommendationStatus: 'idle',
    createTask: jest.fn(),
    updateTask: jest.fn(),
    completeTask: jest.fn(),
    refreshSchedule: jest.fn(),
    getAIRecommendations: jest.fn()
  })
}));

jest.mock('../../hooks/useGarden', () => ({
  useGarden: () => ({
    garden: mockGardenData,
    loading: false,
    error: null
  })
}));

describe('MaintenanceScheduler', () => {
  // Setup and cleanup
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render the maintenance scheduler page correctly', () => {
      const { container } = renderWithProviders(
        <MaintenanceSchedulerPage gardenId="garden-1" />
      );
      
      expect(screen.getByText('Garden Maintenance Schedule')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();
      expect(container).toMatchSnapshot();
    });

    it('should show loading state when fetching data', () => {
      jest.spyOn(require('../../hooks/useMaintenance'), 'useMaintenance')
        .mockImplementation(() => ({
          ...require('../../hooks/useMaintenance').useMaintenance(),
          loading: true
        }));

      renderWithProviders(<MaintenanceSchedulerPage gardenId="garden-1" />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should handle error states gracefully', async () => {
      const errorMessage = 'Failed to load schedule';
      jest.spyOn(require('../../hooks/useMaintenance'), 'useMaintenance')
        .mockImplementation(() => ({
          ...require('../../hooks/useMaintenance').useMaintenance(),
          error: new Error(errorMessage)
        }));

      renderWithProviders(<MaintenanceSchedulerPage gardenId="garden-1" />);
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Task Operations', () => {
    it('should create a new task successfully', async () => {
      const { getByRole, getByLabelText } = renderWithProviders(
        <MaintenanceSchedulerPage gardenId="garden-1" />
      );

      // Open create task modal
      fireEvent.click(getByRole('button', { name: /add task/i }));

      // Fill form
      await userEvent.selectOptions(getByLabelText(/task type/i), TaskType.Water);
      await userEvent.selectOptions(getByLabelText(/frequency/i), Frequency.Daily);
      await userEvent.selectOptions(getByLabelText(/preferred time/i), TimeOfDay.Morning);

      // Submit form
      fireEvent.click(getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText(/task created successfully/i)).toBeInTheDocument();
      });
    });

    it('should complete a task successfully', async () => {
      const { getByRole } = renderWithProviders(
        <MaintenanceSchedulerPage gardenId="garden-1" />
      );

      const completeButton = getByRole('button', { name: /complete task/i });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(screen.getByText(/task completed successfully/i)).toBeInTheDocument();
      });
    });

    it('should handle task deletion with confirmation', async () => {
      const { getByRole } = renderWithProviders(
        <MaintenanceSchedulerPage gardenId="garden-1" />
      );

      // Mock window.confirm
      window.confirm = jest.fn(() => true);

      const deleteButton = getByRole('button', { name: /delete task/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalled();
      });
    });
  });

  describe('AI Recommendations', () => {
    it('should fetch AI recommendations within SLA timeframe', async () => {
      const startTime = performance.now();
      const { getByRole } = renderWithProviders(
        <MaintenanceSchedulerPage gardenId="garden-1" />
      );

      const aiButton = getByRole('button', { name: /get ai recommendations/i });
      fireEvent.click(aiButton);

      await waitFor(() => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        expect(responseTime).toBeLessThan(3000); // 3s SLA requirement
        expect(screen.getByText(/ai recommendations updated/i)).toBeInTheDocument();
      });
    });

    it('should display AI confidence levels for recommended tasks', () => {
      const mockAITask = {
        ...mockMaintenanceSchedule[0],
        aiRecommended: true,
        aiConfidence: 0.85
      };

      jest.spyOn(require('../../hooks/useMaintenance'), 'useMaintenance')
        .mockImplementation(() => ({
          ...require('../../hooks/useMaintenance').useMaintenance(),
          schedule: [mockAITask]
        }));

      renderWithProviders(<MaintenanceSchedulerPage gardenId="garden-1" />);
      expect(screen.getByText(/85%/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(
        <MaintenanceSchedulerPage gardenId="garden-1" />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation', () => {
      renderWithProviders(<MaintenanceSchedulerPage gardenId="garden-1" />);
      
      const addButton = screen.getByRole('button', { name: /add task/i });
      addButton.focus();
      expect(document.activeElement).toBe(addButton);
    });

    it('should have proper ARIA labels', () => {
      renderWithProviders(<MaintenanceSchedulerPage gardenId="garden-1" />);
      
      expect(screen.getByRole('region', { name: /garden maintenance schedule/i }))
        .toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render large task lists efficiently', async () => {
      const largeMockSchedule = Array.from({ length: 100 }, (_, i) => ({
        ...mockMaintenanceSchedule[0],
        id: `task-${i}`
      }));

      jest.spyOn(require('../../hooks/useMaintenance'), 'useMaintenance')
        .mockImplementation(() => ({
          ...require('../../hooks/useMaintenance').useMaintenance(),
          schedule: largeMockSchedule
        }));

      const startTime = performance.now();
      renderWithProviders(<MaintenanceSchedulerPage gardenId="garden-1" />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // 1s render time limit
    });

    it('should debounce AI recommendation requests', async () => {
      const getAIRecommendations = jest.fn();
      jest.spyOn(require('../../hooks/useMaintenance'), 'useMaintenance')
        .mockImplementation(() => ({
          ...require('../../hooks/useMaintenance').useMaintenance(),
          getAIRecommendations
        }));

      const { getByRole } = renderWithProviders(
        <MaintenanceSchedulerPage gardenId="garden-1" />
      );

      const aiButton = getByRole('button', { name: /get ai recommendations/i });
      fireEvent.click(aiButton);
      fireEvent.click(aiButton);
      fireEvent.click(aiButton);

      await waitFor(() => {
        expect(getAIRecommendations).toHaveBeenCalledTimes(1);
      });
    });
  });
});