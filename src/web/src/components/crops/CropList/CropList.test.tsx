import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import axe from '@axe-core/react';
import { CropList } from './CropList';
import { renderWithProviders } from '../../../utils/test-utils';
import { Crop, BagSize, SPACE_CAPACITY_WARNING_THRESHOLD } from '../../../types/crops';

// Mock the useCrops hook
vi.mock('../../../hooks/useCrops', () => ({
  useCrops: vi.fn()
}));

// Test data generators
const createMockCrop = (overrides = {}): Crop => ({
  id: `crop-${Math.random()}`,
  gardenId: 'garden-1',
  name: 'Test Crop',
  quantityNeeded: 500,
  growBags: 4,
  bagSize: BagSize.TWELVE_INCH,
  estimatedYield: 600,
  actualYield: 550,
  yieldAccuracy: 0.08,
  spaceUtilization: 0.7,
  isOverCapacity: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

describe('CropList', () => {
  // Common test props
  const defaultProps = {
    gardenId: 'garden-1',
    onEdit: vi.fn(),
    showActions: true,
    yieldAccuracyThreshold: 0.1,
    spaceWarningThreshold: 0.9,
    enableVirtualization: false
  };

  // Common test setup
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render loading state correctly', () => {
      const useCropsMock = require('../../../hooks/useCrops').useCrops;
      useCropsMock.mockReturnValue({
        loading: true,
        crops: [],
        error: null
      });

      renderWithProviders(<CropList {...defaultProps} />);
      expect(screen.getByText('Loading crops...')).toBeInTheDocument();
    });

    it('should render error state correctly', () => {
      const useCropsMock = require('../../../hooks/useCrops').useCrops;
      useCropsMock.mockReturnValue({
        loading: false,
        crops: [],
        error: 'Failed to load crops'
      });

      renderWithProviders(<CropList {...defaultProps} />);
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to load crops');
    });

    it('should render empty state correctly', () => {
      const useCropsMock = require('../../../hooks/useCrops').useCrops;
      useCropsMock.mockReturnValue({
        loading: false,
        crops: [],
        error: null
      });

      renderWithProviders(<CropList {...defaultProps} />);
      expect(screen.getByText('No crops added yet.')).toBeInTheDocument();
    });

    it('should render crop list correctly', () => {
      const mockCrops = [
        createMockCrop({ name: 'Tomatoes' }),
        createMockCrop({ name: 'Spinach' })
      ];

      const useCropsMock = require('../../../hooks/useCrops').useCrops;
      useCropsMock.mockReturnValue({
        loading: false,
        crops: mockCrops,
        error: null
      });

      renderWithProviders(<CropList {...defaultProps} />);
      expect(screen.getByText('Tomatoes')).toBeInTheDocument();
      expect(screen.getByText('Spinach')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should handle edit button click', async () => {
      const mockCrop = createMockCrop();
      const useCropsMock = require('../../../hooks/useCrops').useCrops;
      useCropsMock.mockReturnValue({
        loading: false,
        crops: [mockCrop],
        error: null
      });

      renderWithProviders(<CropList {...defaultProps} />);
      
      const editButton = screen.getByLabelText(`Edit ${mockCrop.name}`);
      await userEvent.click(editButton);
      
      expect(defaultProps.onEdit).toHaveBeenCalledWith(mockCrop.id);
    });

    it('should handle delete button click with confirmation', async () => {
      const mockCrop = createMockCrop();
      const mockDeleteCrop = vi.fn();
      const useCropsMock = require('../../../hooks/useCrops').useCrops;
      useCropsMock.mockReturnValue({
        loading: false,
        crops: [mockCrop],
        error: null,
        deleteCrop: mockDeleteCrop
      });

      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm');
      confirmSpy.mockImplementation(() => true);

      renderWithProviders(<CropList {...defaultProps} />);
      
      const deleteButton = screen.getByLabelText(`Delete ${mockCrop.name}`);
      await userEvent.click(deleteButton);
      
      expect(confirmSpy).toHaveBeenCalled();
      expect(mockDeleteCrop).toHaveBeenCalledWith(mockCrop.id);
    });
  });

  describe('Calculations', () => {
    it('should display yield accuracy warning when threshold exceeded', () => {
      const mockCrop = createMockCrop({ yieldAccuracy: 0.15 }); // 15% deviation
      const useCropsMock = require('../../../hooks/useCrops').useCrops;
      useCropsMock.mockReturnValue({
        loading: false,
        crops: [mockCrop],
        error: null
      });

      renderWithProviders(<CropList {...defaultProps} />);
      expect(screen.getByText(/Exceeds threshold/)).toBeInTheDocument();
    });

    it('should display space capacity warning when threshold exceeded', () => {
      const mockCrop = createMockCrop({ 
        spaceUtilization: SPACE_CAPACITY_WARNING_THRESHOLD + 0.1 
      });
      const useCropsMock = require('../../../hooks/useCrops').useCrops;
      useCropsMock.mockReturnValue({
        loading: false,
        crops: [mockCrop],
        error: null,
        spaceUtilization: SPACE_CAPACITY_WARNING_THRESHOLD + 0.1
      });

      renderWithProviders(<CropList {...defaultProps} />);
      expect(screen.getByText(/Warning: Garden space capacity exceeded!/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const mockCrops = [createMockCrop()];
      const useCropsMock = require('../../../hooks/useCrops').useCrops;
      useCropsMock.mockReturnValue({
        loading: false,
        crops: mockCrops,
        error: null
      });

      const { container } = renderWithProviders(<CropList {...defaultProps} />);
      const results = await axe.run(container);
      expect(results.violations).toHaveLength(0);
    });

    it('should handle keyboard navigation', async () => {
      const mockCrops = [
        createMockCrop({ name: 'Tomatoes' }),
        createMockCrop({ name: 'Spinach' })
      ];
      const useCropsMock = require('../../../hooks/useCrops').useCrops;
      useCropsMock.mockReturnValue({
        loading: false,
        crops: mockCrops,
        error: null
      });

      renderWithProviders(<CropList {...defaultProps} />);
      
      const firstEditButton = screen.getByLabelText('Edit Tomatoes');
      firstEditButton.focus();
      expect(document.activeElement).toBe(firstEditButton);

      // Tab to next button
      await userEvent.tab();
      const firstDeleteButton = screen.getByLabelText('Delete Tomatoes');
      expect(document.activeElement).toBe(firstDeleteButton);
    });

    it('should have proper ARIA labels and roles', () => {
      const mockCrop = createMockCrop();
      const useCropsMock = require('../../../hooks/useCrops').useCrops;
      useCropsMock.mockReturnValue({
        loading: false,
        crops: [mockCrop],
        error: null
      });

      renderWithProviders(<CropList {...defaultProps} />);
      
      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getByRole('listitem')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const largeCropList = Array.from({ length: 100 }, () => createMockCrop());
      const useCropsMock = require('../../../hooks/useCrops').useCrops;
      useCropsMock.mockReturnValue({
        loading: false,
        crops: largeCropList,
        error: null
      });

      const startTime = performance.now();
      renderWithProviders(<CropList {...defaultProps} enableVirtualization={true} />);
      const renderTime = performance.now() - startTime;

      // Ensure render time is reasonable (< 100ms)
      expect(renderTime).toBeLessThan(100);
    });

    it('should memoize calculations correctly', () => {
      const mockCrop = createMockCrop();
      const useCropsMock = require('../../../hooks/useCrops').useCrops;
      const calculateYieldMock = vi.fn();
      
      useCropsMock.mockReturnValue({
        loading: false,
        crops: [mockCrop],
        error: null,
        calculateYield: calculateYieldMock
      });

      const { rerender } = renderWithProviders(<CropList {...defaultProps} />);
      
      // Rerender with same props
      rerender(<CropList {...defaultProps} />);
      
      // Calculation function should only be called once
      expect(calculateYieldMock).toHaveBeenCalledTimes(1);
    });
  });
});