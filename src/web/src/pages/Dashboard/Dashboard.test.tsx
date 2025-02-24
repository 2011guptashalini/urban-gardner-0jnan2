import React from 'react';
import { screen, waitFor, within, userEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { axe } from '@axe-core/react';
import { renderWithProviders } from '../../utils/test-utils';
import Dashboard from './Dashboard';
import { Garden, SoilType, SunlightCondition, MeasurementUnit } from '../../types/garden';
import { MaintenanceTask, TaskType, Frequency, TimeOfDay } from '../../types/maintenance';

// Mock hooks and navigation
const mockNavigate = vi.fn();
const mockUseGarden = vi.fn();
const mockUseAIRecommendations = vi.fn();

// Mock ResizeObserver for responsive tests
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock data
const mockGardens: Garden[] = [
  {
    id: '1',
    userId: 'user1',
    name: 'Balcony Garden',
    dimensions: {
      length: 10,
      width: 5,
      unit: MeasurementUnit.FEET
    },
    soilType: SoilType.LOAMY_SOIL,
    sunlight: SunlightCondition.FULL_SUN,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    userId: 'user1',
    name: 'Terrace Plot',
    dimensions: {
      length: 20,
      width: 5,
      unit: MeasurementUnit.FEET
    },
    soilType: SoilType.RED_SOIL,
    sunlight: SunlightCondition.PARTIAL_SHADE,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockMaintenanceTasks: MaintenanceTask[] = [
  {
    id: '1',
    cropId: '1',
    taskType: TaskType.Water,
    frequency: Frequency.Daily,
    customFrequencyDays: null,
    amount: 500,
    unit: 'ml',
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

describe('Dashboard', () => {
  beforeAll(() => {
    // Setup global mocks
    window.ResizeObserver = ResizeObserver;
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    mockNavigate.mockReset();
    mockUseGarden.mockReturnValue({
      gardens: mockGardens,
      loading: false,
      error: null,
      fetchAllGardens: vi.fn(),
      createGarden: vi.fn(),
      updateGarden: vi.fn(),
      deleteGarden: vi.fn()
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(<Dashboard />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels for garden cards', () => {
      renderWithProviders(<Dashboard />);
      mockGardens.forEach(garden => {
        const card = screen.getByRole('article', { name: `Garden: ${garden.name}` });
        expect(card).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Dashboard />);
      
      const firstCard = screen.getByRole('article', { name: `Garden: ${mockGardens[0].name}` });
      await user.tab();
      expect(firstCard).toHaveFocus();
    });
  });

  describe('Responsive Design', () => {
    it('should render in desktop layout with 3 columns', () => {
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(min-width: 1024px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn()
      }));

      renderWithProviders(<Dashboard />);
      const container = screen.getByRole('main');
      expect(container).toHaveStyle({ gridTemplateColumns: 'repeat(3, 1fr)' });
    });

    it('should render in tablet layout with 2 columns', () => {
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(min-width: 768px) and (max-width: 1023px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn()
      }));

      renderWithProviders(<Dashboard />);
      const container = screen.getByRole('main');
      expect(container).toHaveStyle({ gridTemplateColumns: 'repeat(2, 1fr)' });
    });

    it('should render in mobile layout with 1 column', () => {
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(max-width: 767px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn()
      }));

      renderWithProviders(<Dashboard />);
      const container = screen.getByRole('main');
      expect(container).toHaveStyle({ gridTemplateColumns: '1fr' });
    });
  });

  describe('Garden Operations', () => {
    it('should display loading state while fetching gardens', () => {
      mockUseGarden.mockReturnValue({
        ...mockUseGarden(),
        loading: true
      });

      renderWithProviders(<Dashboard />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should handle garden deletion with confirmation', async () => {
      const user = userEvent.setup();
      const mockDeleteGarden = vi.fn();
      mockUseGarden.mockReturnValue({
        ...mockUseGarden(),
        deleteGarden: mockDeleteGarden
      });

      renderWithProviders(<Dashboard />);
      
      const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
      await user.click(deleteButton);
      
      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);
      
      expect(mockDeleteGarden).toHaveBeenCalledWith(mockGardens[0].id);
    });

    it('should navigate to garden details on view', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Dashboard />);
      
      const viewButton = screen.getAllByRole('button', { name: /view/i })[0];
      await user.click(viewButton);
      
      expect(mockNavigate).toHaveBeenCalledWith(`/garden/${mockGardens[0].id}`);
    });
  });

  describe('Maintenance Schedule', () => {
    it('should display AI recommendations when enabled', async () => {
      renderWithProviders(<Dashboard />);
      
      const aiChip = screen.getByRole('button', { name: /ai recommendations/i });
      expect(aiChip).toBeInTheDocument();
      expect(aiChip).toHaveAttribute('aria-label', 'AI-powered recommendations');
    });

    it('should handle maintenance task completion', async () => {
      const user = userEvent.setup();
      const mockCompleteTask = vi.fn();
      
      renderWithProviders(<Dashboard />);
      
      const completeButton = screen.getAllByRole('button', { name: /complete task/i })[0];
      await user.click(completeButton);
      
      expect(mockCompleteTask).toHaveBeenCalledWith(mockMaintenanceTasks[0].id);
    });
  });

  describe('Error Handling', () => {
    it('should display error message when garden fetch fails', () => {
      mockUseGarden.mockReturnValue({
        ...mockUseGarden(),
        error: 'Failed to fetch gardens'
      });

      renderWithProviders(<Dashboard />);
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to fetch gardens');
    });

    it('should allow retry when garden fetch fails', async () => {
      const user = userEvent.setup();
      const mockFetchGardens = vi.fn();
      mockUseGarden.mockReturnValue({
        ...mockUseGarden(),
        error: 'Failed to fetch gardens',
        fetchAllGardens: mockFetchGardens
      });

      renderWithProviders(<Dashboard />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);
      
      expect(mockFetchGardens).toHaveBeenCalled();
    });
  });
});