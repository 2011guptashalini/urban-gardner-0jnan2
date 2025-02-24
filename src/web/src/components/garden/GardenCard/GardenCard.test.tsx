import React from 'react';
import { vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../utils/test-utils';
import GardenCard from './GardenCard';
import { Garden, MeasurementUnit, SoilType, SunlightCondition } from '../../../types/garden';

// Mock functions for card actions
const mockOnEdit = vi.fn();
const mockOnDelete = vi.fn();
const mockOnView = vi.fn();

// Mock window.confirm
const mockConfirm = vi.fn();
window.confirm = mockConfirm;

// Create mock garden data helper
const createMockGarden = (overrides?: Partial<Garden>): Garden => ({
  id: '123',
  userId: 'user123',
  name: 'Test Garden',
  dimensions: {
    length: 10,
    width: 5,
    unit: MeasurementUnit.FEET
  },
  soilType: SoilType.LOAMY_SOIL,
  sunlight: SunlightCondition.FULL_SUN,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  ...overrides
});

// Test setup helper
const setupTest = (options: {
  garden?: Garden;
  isLoading?: boolean;
} = {}) => {
  const garden = options.garden || createMockGarden();
  const isLoading = options.isLoading || false;
  const user = userEvent.setup();

  const utils = renderWithProviders(
    <GardenCard
      garden={garden}
      onEdit={mockOnEdit}
      onDelete={mockOnDelete}
      onView={mockOnView}
      isLoading={isLoading}
    />
  );

  return {
    ...utils,
    user,
    garden
  };
};

describe('GardenCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    test('renders garden information correctly', () => {
      const garden = createMockGarden();
      const { container } = setupTest({ garden });

      // Verify garden name
      expect(screen.getByRole('heading', { name: garden.name })).toBeInTheDocument();

      // Verify dimensions
      const dimensionText = screen.getByText(/Dimensions:/);
      expect(dimensionText).toBeInTheDocument();
      expect(dimensionText).toHaveTextContent('50.0 sq ft (10 × 5 feet)');

      // Verify soil type
      const soilText = screen.getByText(/Soil Type:/);
      expect(soilText).toBeInTheDocument();
      expect(soilText).toHaveTextContent('Loamy Soil');

      // Verify sunlight condition
      const sunlightText = screen.getByText(/Sunlight:/);
      expect(sunlightText).toBeInTheDocument();
      expect(sunlightText).toHaveTextContent('Full Sun');

      // Verify action buttons
      expect(screen.getByRole('button', { name: /View/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();

      // Verify ARIA labels
      expect(container.querySelector('[role="article"]')).toHaveAttribute(
        'aria-label',
        `Garden: ${garden.name}`
      );
    });

    test('renders loading state correctly', () => {
      setupTest({ isLoading: true });

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    test('handles error state gracefully', () => {
      const errorMessage = 'Failed to load garden';
      const { container } = renderWithProviders(
        <GardenCard
          garden={createMockGarden()}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onView={mockOnView}
          isLoading={false}
        />
      );

      // Simulate error by throwing in ErrorBoundary
      const error = new Error(errorMessage);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      container.querySelector('[role="article"]')?.dispatchEvent(
        new ErrorEvent('error', { error })
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
      
      errorSpy.mockRestore();
    });
  });

  describe('interactions', () => {
    test('handles view button click correctly', async () => {
      const { user, garden } = setupTest();
      
      const viewButton = screen.getByRole('button', { name: /View/i });
      await user.click(viewButton);

      expect(mockOnView).toHaveBeenCalledTimes(1);
      expect(mockOnView).toHaveBeenCalledWith(garden.id);
    });

    test('handles edit button click correctly', async () => {
      const { user, garden } = setupTest();
      
      const editButton = screen.getByRole('button', { name: /Edit/i });
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
      expect(mockOnEdit).toHaveBeenCalledWith(garden.id);
    });

    test('handles delete button click with confirmation', async () => {
      const { user, garden } = setupTest();
      mockConfirm.mockReturnValue(true);
      
      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      await user.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this garden?');
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnDelete).toHaveBeenCalledWith(garden.id);
    });

    test('cancels delete when confirmation is declined', async () => {
      const { user } = setupTest();
      mockConfirm.mockReturnValue(false);
      
      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      await user.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalled();
      expect(mockOnDelete).not.toHaveBeenCalled();
    });

    test('prevents actions during loading state', async () => {
      const { user } = setupTest({ isLoading: true });
      
      const buttons = screen.getAllByRole('button');
      for (const button of buttons) {
        await user.click(button);
      }

      expect(mockOnView).not.toHaveBeenCalled();
      expect(mockOnEdit).not.toHaveBeenCalled();
      expect(mockOnDelete).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    test('meets accessibility standards', async () => {
      const { checkAccessibility } = setupTest();
      await checkAccessibility();
    });

    test('supports keyboard navigation', async () => {
      const { user } = setupTest();
      
      // Tab through all interactive elements
      const buttons = screen.getAllByRole('button');
      for (const button of buttons) {
        await user.tab();
        expect(button).toHaveFocus();
      }
    });

    test('provides proper ARIA labels', () => {
      const garden = createMockGarden();
      setupTest({ garden });

      // Check article role and label
      expect(screen.getByRole('article')).toHaveAttribute(
        'aria-label',
        `Garden: ${garden.name}`
      );

      // Check region roles and labels
      expect(screen.getByRole('region', { name: 'Garden details' })).toBeInTheDocument();

      // Check button labels
      expect(screen.getByRole('button', { name: `View ${garden.name} details` })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: `Edit ${garden.name}` })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: `Delete ${garden.name}` })).toBeInTheDocument();
    });
  });
});