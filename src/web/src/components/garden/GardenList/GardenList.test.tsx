import { vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../utils/test-utils';
import GardenList from './GardenList';
import { Garden, MeasurementUnit, SoilType, SunlightCondition } from '../../../types/garden';

// Helper function to create mock garden data
const createMockGarden = (overrides: Partial<Garden> = {}): Garden => ({
  id: `garden-${Math.random().toString(36).substr(2, 9)}`,
  userId: 'test-user',
  name: 'Test Garden',
  dimensions: {
    length: 10,
    width: 10,
    unit: MeasurementUnit.FEET
  },
  soilType: SoilType.LOAMY_SOIL,
  sunlight: SunlightCondition.FULL_SUN,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

// Common test setup function
const setup = (props: Partial<any> = {}) => {
  const mockFunctions = {
    onAddGarden: vi.fn().mockResolvedValue(undefined),
    onEditGarden: vi.fn().mockResolvedValue(undefined),
    onDeleteGarden: vi.fn().mockResolvedValue(undefined),
    onViewGarden: vi.fn().mockResolvedValue(undefined)
  };

  const defaultProps = {
    gardens: [],
    isLoading: false,
    error: null,
    ...mockFunctions,
    ...props
  };

  return {
    ...mockFunctions,
    ...renderWithProviders(<GardenList {...defaultProps} />)
  };
};

describe('GardenList Component', () => {
  describe('Empty State', () => {
    it('renders empty state message when no gardens provided', () => {
      setup();
      
      expect(screen.getByText(/You haven't created any gardens yet/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create your first garden/i })).toBeInTheDocument();
    });

    it('handles add garden action from empty state', async () => {
      const { onAddGarden } = setup();
      
      const addButton = screen.getByRole('button', { name: /create your first garden/i });
      await userEvent.click(addButton);
      
      expect(onAddGarden).toHaveBeenCalledTimes(1);
    });
  });

  describe('Garden List Display', () => {
    const mockGardens = [
      createMockGarden({ name: 'Balcony Garden' }),
      createMockGarden({ name: 'Rooftop Garden' }),
      createMockGarden({ name: 'Window Garden' })
    ];

    it('renders garden cards in responsive grid', () => {
      setup({ gardens: mockGardens });
      
      const gardenList = screen.getByRole('region', { name: /garden list/i });
      expect(gardenList).toHaveStyle({
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)'
      });
      
      mockGardens.forEach(garden => {
        expect(screen.getByText(garden.name)).toBeInTheDocument();
      });
    });

    it('displays correct garden details on each card', () => {
      setup({ gardens: mockGardens });
      
      mockGardens.forEach(garden => {
        const card = screen.getByRole('article', { name: `Garden: ${garden.name}` });
        expect(within(card).getByText(garden.name)).toBeInTheDocument();
        expect(within(card).getByText(/dimensions:/i)).toBeInTheDocument();
        expect(within(card).getByText(/soil type:/i)).toBeInTheDocument();
        expect(within(card).getByText(/sunlight:/i)).toBeInTheDocument();
      });
    });
  });

  describe('Garden Management Actions', () => {
    const mockGarden = createMockGarden();

    it('handles view garden action', async () => {
      const { onViewGarden } = setup({ gardens: [mockGarden] });
      
      const viewButton = screen.getByRole('button', { name: `View ${mockGarden.name} details` });
      await userEvent.click(viewButton);
      
      expect(onViewGarden).toHaveBeenCalledWith(mockGarden.id);
    });

    it('handles edit garden action', async () => {
      const { onEditGarden } = setup({ gardens: [mockGarden] });
      
      const editButton = screen.getByRole('button', { name: `Edit ${mockGarden.name}` });
      await userEvent.click(editButton);
      
      expect(onEditGarden).toHaveBeenCalledWith(mockGarden.id);
    });

    it('handles delete garden action with confirmation', async () => {
      const { onDeleteGarden } = setup({ gardens: [mockGarden] });
      
      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm');
      confirmSpy.mockImplementation(() => true);
      
      const deleteButton = screen.getByRole('button', { name: `Delete ${mockGarden.name}` });
      await userEvent.click(deleteButton);
      
      expect(confirmSpy).toHaveBeenCalled();
      expect(onDeleteGarden).toHaveBeenCalledWith(mockGarden.id);
      
      confirmSpy.mockRestore();
    });

    it('prevents delete when confirmation is cancelled', async () => {
      const { onDeleteGarden } = setup({ gardens: [mockGarden] });
      
      const confirmSpy = vi.spyOn(window, 'confirm');
      confirmSpy.mockImplementation(() => false);
      
      const deleteButton = screen.getByRole('button', { name: `Delete ${mockGarden.name}` });
      await userEvent.click(deleteButton);
      
      expect(confirmSpy).toHaveBeenCalled();
      expect(onDeleteGarden).not.toHaveBeenCalled();
      
      confirmSpy.mockRestore();
    });
  });

  describe('Loading State', () => {
    it('displays loading state correctly', () => {
      setup({ isLoading: true });
      
      expect(screen.getByRole('status', { name: /loading gardens/i })).toBeInTheDocument();
      expect(screen.getByText(/loading your gardens/i)).toBeInTheDocument();
    });

    it('disables actions during loading', async () => {
      const { onAddGarden } = setup({ isLoading: true, gardens: [createMockGarden()] });
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
      
      await userEvent.click(buttons[0]);
      expect(onAddGarden).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when loading fails', () => {
      const errorMessage = 'Failed to load gardens';
      setup({ error: errorMessage, gardens: [] });
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(`Error loading gardens: ${errorMessage}`)).toBeInTheDocument();
    });

    it('provides retry option on error', async () => {
      const { onAddGarden } = setup({ error: 'Load error', gardens: [] });
      
      const retryButton = screen.getByRole('button', { name: /retry loading gardens/i });
      await userEvent.click(retryButton);
      
      expect(onAddGarden).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('maintains proper ARIA attributes', () => {
      const { container } = setup({ gardens: [createMockGarden()] });
      
      expect(screen.getByRole('region', { name: /garden list/i })).toBeInTheDocument();
      expect(screen.getByRole('article')).toHaveAttribute('aria-label');
      expect(container).toBeAccessible();
    });

    it('supports keyboard navigation', async () => {
      setup({ gardens: [createMockGarden()] });
      
      const firstButton = screen.getAllByRole('button')[0];
      firstButton.focus();
      expect(document.activeElement).toBe(firstButton);
      
      await userEvent.tab();
      expect(document.activeElement).not.toBe(firstButton);
    });
  });
});