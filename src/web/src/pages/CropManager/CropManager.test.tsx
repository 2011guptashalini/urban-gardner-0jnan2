import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi } from 'vitest';
import { axe } from '@axe-core/react';
import { renderWithProviders } from '../../utils/test-utils';
import CropManager from './CropManager';
import { useCrops } from '../../hooks/useCrops';
import { BagSize } from '../../types/crops';

// Mock useCrops hook
vi.mock('../../hooks/useCrops', () => ({
  useCrops: vi.fn()
}));

// Test data constants
const mockGardenId = 'test-garden-1';
const mockCrop = {
  id: 'test-crop-1',
  name: 'Tomatoes',
  quantityNeeded: 5,
  growBags: 3,
  bagSize: BagSize.TWELVE_INCH,
  estimatedYield: 1.5,
  actualYield: 1.35,
  yieldAccuracy: 0.9,
  spaceUtilization: 0.85,
  isOverCapacity: false,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Setup function for common test configuration
const setupTest = (
  initialState = {},
  mockOptions = {
    loading: false,
    error: null,
    spaceUtilization: 0.5,
    hasWarning: false
  }
) => {
  // Mock useCrops implementation
  const mockCreateCrop = vi.fn();
  const mockUpdateCrop = vi.fn();
  const mockCalculateYield = vi.fn();
  const mockValidateSpaceCapacity = vi.fn();

  (useCrops as jest.Mock).mockReturnValue({
    crops: [mockCrop],
    loading: mockOptions.loading,
    error: mockOptions.error,
    spaceUtilization: mockOptions.spaceUtilization,
    hasWarning: mockOptions.hasWarning,
    createCrop: mockCreateCrop,
    updateCrop: mockUpdateCrop,
    calculateYield: mockCalculateYield,
    validateSpaceCapacity: mockValidateSpaceCapacity
  });

  // Render component with providers
  const utils = renderWithProviders(
    <CropManager 
      gardenId={mockGardenId}
      isAccessible={true}
      analyticsConfig={{ enableTracking: false, metricsEndpoint: '' }}
    />,
    { initialState }
  );

  return {
    ...utils,
    mocks: {
      createCrop: mockCreateCrop,
      updateCrop: mockUpdateCrop,
      calculateYield: mockCalculateYield,
      validateSpaceCapacity: mockValidateSpaceCapacity
    }
  };
};

describe('CropManager Component', () => {
  describe('Rendering and Layout', () => {
    it('renders all main sections correctly', () => {
      setupTest();

      expect(screen.getByRole('heading', { name: /crop manager/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /add new crop/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /your crops/i })).toBeInTheDocument();
    });

    it('displays loading state appropriately', () => {
      setupTest({}, { loading: true, error: null, spaceUtilization: 0 });
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('handles error states correctly', () => {
      const errorMessage = 'Failed to load crops';
      setupTest({}, { loading: false, error: errorMessage, spaceUtilization: 0 });
      expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
    });
  });

  describe('Crop Yield Calculations (F-002-RQ-001)', () => {
    it('calculates yield within 10% accuracy threshold', async () => {
      const { mocks } = setupTest();
      
      // Mock successful yield calculation
      mocks.calculateYield.mockResolvedValue({
        isOk: () => true,
        value: 1.35
      });

      // Add a new crop
      fireEvent.change(screen.getByLabelText(/crop name/i), {
        target: { value: 'Tomatoes' }
      });
      fireEvent.change(screen.getByLabelText(/quantity needed/i), {
        target: { value: '5' }
      });
      fireEvent.click(screen.getByRole('button', { name: /save crop/i }));

      await waitFor(() => {
        expect(mocks.calculateYield).toHaveBeenCalled();
      });

      // Verify yield accuracy is within threshold
      const yieldIndicator = screen.getByText(/yield accuracy/i);
      expect(yieldIndicator).toHaveTextContent('90%');
      expect(yieldIndicator).not.toHaveTextContent(/exceeds threshold/i);
    });

    it('retries failed yield calculations', async () => {
      const { mocks } = setupTest();
      
      // Mock failed calculation with retry
      mocks.calculateYield
        .mockRejectedValueOnce(new Error('Calculation failed'))
        .mockResolvedValueOnce({
          isOk: () => true,
          value: 1.35
        });

      fireEvent.click(screen.getByRole('button', { name: /save crop/i }));

      await waitFor(() => {
        expect(mocks.calculateYield).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Space Capacity Warnings (F-002-RQ-002)', () => {
    it('displays warning when space capacity exceeds 90%', async () => {
      setupTest({}, { 
        loading: false, 
        error: null, 
        spaceUtilization: 0.95,
        hasWarning: true 
      });

      const warning = screen.getByRole('alert');
      expect(warning).toHaveTextContent(/space capacity exceeded/i);
      expect(warning).toHaveAttribute('aria-live', 'polite');
    });

    it('updates warning in real-time when adding crops', async () => {
      const { mocks } = setupTest();

      // Mock space validation to trigger warning
      mocks.validateSpaceCapacity.mockReturnValue(0.92);

      // Add a crop that would exceed capacity
      fireEvent.change(screen.getByLabelText(/grow bags/i), {
        target: { value: '10' }
      });

      await waitFor(() => {
        const warning = screen.getByRole('alert');
        expect(warning).toHaveTextContent(/space capacity/i);
      });
    });
  });

  describe('Accessibility Compliance', () => {
    it('meets WCAG requirements', async () => {
      const { container } = setupTest();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides proper ARIA labels and landmarks', () => {
      setupTest();

      // Verify form labels
      expect(screen.getByLabelText(/crop name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/quantity needed/i)).toBeInTheDocument();

      // Verify landmarks
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      setupTest();

      const form = screen.getByRole('form');
      const inputs = within(form).getAllByRole('textbox');

      // Test tab order
      inputs[0].focus();
      expect(document.activeElement).toBe(inputs[0]);
      
      fireEvent.keyDown(inputs[0], { key: 'Tab' });
      expect(document.activeElement).toBe(inputs[1]);
    });

    it('announces dynamic content changes', async () => {
      const { mocks } = setupTest();

      // Trigger a yield calculation
      mocks.calculateYield.mockResolvedValue({
        isOk: () => true,
        value: 1.35
      });

      fireEvent.click(screen.getByRole('button', { name: /calculate yield/i }));

      await waitFor(() => {
        const announcement = screen.getByRole('alert', { name: /yield calculation complete/i });
        expect(announcement).toBeInTheDocument();
      });
    });
  });
});