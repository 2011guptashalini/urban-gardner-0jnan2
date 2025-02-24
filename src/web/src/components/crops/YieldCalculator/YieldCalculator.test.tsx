import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axe from '@axe-core/react';
import { YieldCalculator } from './YieldCalculator';
import { renderWithProviders } from '../../../utils/test-utils';
import { BagSize } from '../../../types/crops';

// Constants for testing
const TEST_CROP_ID = 'test-crop-id';
const MOCK_YIELD_VALUE = 2.5;
const CALCULATION_THRESHOLD = 0.1; // 10% accuracy requirement
const WARNING_THRESHOLD = 0.9; // 90% capacity warning
const PERFORMANCE_TIMEOUT = 1000;

describe('YieldCalculator', () => {
  // Mock handlers
  const mockOnYieldCalculated = jest.fn();
  const mockOnCapacityWarning = jest.fn();
  const mockOnError = jest.fn();

  // Default props
  const defaultProps = {
    cropId: TEST_CROP_ID,
    onYieldCalculated: mockOnYieldCalculated,
    onCapacityWarning: mockOnCapacityWarning,
    onError: mockOnError,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering and Accessibility', () => {
    it('should render without errors', () => {
      renderWithProviders(<YieldCalculator {...defaultProps} />);
      expect(screen.getByLabelText(/grow bag size/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/number of grow bags/i)).toBeInTheDocument();
    });

    it('should meet accessibility standards', async () => {
      const { container } = renderWithProviders(<YieldCalculator {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should handle loading state correctly', () => {
      renderWithProviders(<YieldCalculator {...defaultProps} />);
      const loadingText = screen.queryByText(/calculating yield/i);
      expect(loadingText).not.toBeInTheDocument();
    });
  });

  describe('Yield Calculations', () => {
    it('should calculate yield within 10% accuracy threshold', async () => {
      renderWithProviders(<YieldCalculator {...defaultProps} />);
      
      // Select bag size
      const bagSizeInput = screen.getByLabelText(/grow bag size/i);
      await userEvent.selectOptions(bagSizeInput, BagSize.TWELVE_INCH);

      // Enter quantity
      const quantityInput = screen.getByLabelText(/number of grow bags/i);
      await userEvent.type(quantityInput, '5');

      // Wait for debounced calculation
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockOnYieldCalculated).toHaveBeenCalledWith(expect.any(Number));
        const calculatedYield = mockOnYieldCalculated.mock.calls[0][0];
        const accuracy = Math.abs(calculatedYield - MOCK_YIELD_VALUE) / MOCK_YIELD_VALUE;
        expect(accuracy).toBeLessThanOrEqual(CALCULATION_THRESHOLD);
      });
    });

    it('should retry failed calculations up to 3 times', async () => {
      renderWithProviders(<YieldCalculator {...defaultProps} />);
      
      // Trigger calculation
      const bagSizeInput = screen.getByLabelText(/grow bag size/i);
      await userEvent.selectOptions(bagSizeInput, BagSize.EIGHT_INCH);

      // Advance timers for retries
      for (let i = 0; i < 3; i++) {
        jest.advanceTimersByTime(1000);
      }

      expect(screen.getByText(/attempt 3\/3/i)).toBeInTheDocument();
    });
  });

  describe('Input Validation', () => {
    it('should validate bag size selection', async () => {
      renderWithProviders(<YieldCalculator {...defaultProps} />);
      
      const bagSizeInput = screen.getByLabelText(/grow bag size/i);
      await userEvent.selectOptions(bagSizeInput, 'invalid-size');

      expect(mockOnError).toHaveBeenCalledWith('Invalid bag size selected');
    });

    it('should enforce quantity limits', async () => {
      renderWithProviders(<YieldCalculator {...defaultProps} />);
      
      const quantityInput = screen.getByLabelText(/number of grow bags/i);
      await userEvent.type(quantityInput, '101');

      expect(mockOnError).toHaveBeenCalledWith('Quantity must be between 1 and 100');
    });
  });

  describe('Space Capacity Warnings', () => {
    it('should trigger warning when space utilization exceeds 90%', async () => {
      renderWithProviders(<YieldCalculator {...defaultProps} />);
      
      // Configure inputs to trigger warning
      const bagSizeInput = screen.getByLabelText(/grow bag size/i);
      const quantityInput = screen.getByLabelText(/number of grow bags/i);

      await userEvent.selectOptions(bagSizeInput, BagSize.TWELVE_INCH);
      await userEvent.type(quantityInput, '20');

      jest.advanceTimersByTime(500);

      expect(mockOnCapacityWarning).toHaveBeenCalledWith(
        'Garden space capacity is approaching its limit'
      );
    });

    it('should clear warning when space utilization decreases', async () => {
      renderWithProviders(<YieldCalculator {...defaultProps} />);
      
      // First trigger warning
      const quantityInput = screen.getByLabelText(/number of grow bags/i);
      await userEvent.type(quantityInput, '20');
      
      // Then reduce quantity
      await userEvent.clear(quantityInput);
      await userEvent.type(quantityInput, '5');

      jest.advanceTimersByTime(500);

      expect(mockOnCapacityWarning).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance', () => {
    it('should debounce yield calculations', async () => {
      renderWithProviders(<YieldCalculator {...defaultProps} />);
      
      const quantityInput = screen.getByLabelText(/number of grow bags/i);
      
      // Rapid input changes
      await userEvent.type(quantityInput, '1');
      await userEvent.type(quantityInput, '2');
      await userEvent.type(quantityInput, '3');

      // Should not calculate immediately
      expect(mockOnYieldCalculated).not.toHaveBeenCalled();

      // Should calculate after debounce
      jest.advanceTimersByTime(500);
      expect(mockOnYieldCalculated).toHaveBeenCalledTimes(1);
    });

    it('should complete calculations within performance timeout', async () => {
      const startTime = performance.now();
      
      renderWithProviders(<YieldCalculator {...defaultProps} />);
      
      const bagSizeInput = screen.getByLabelText(/grow bag size/i);
      await userEvent.selectOptions(bagSizeInput, BagSize.TWELVE_INCH);

      jest.advanceTimersByTime(500);

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(PERFORMANCE_TIMEOUT);
    });
  });

  describe('Error Handling', () => {
    it('should handle calculation errors gracefully', async () => {
      renderWithProviders(<YieldCalculator {...defaultProps} />);
      
      // Trigger error condition
      const bagSizeInput = screen.getByLabelText(/grow bag size/i);
      await userEvent.selectOptions(bagSizeInput, BagSize.EIGHT_INCH);

      // Wait for all retries to complete
      jest.advanceTimersByTime(3000);

      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('Yield calculation accuracy exceeds 10% threshold')
      );
    });

    it('should disable inputs during calculation', async () => {
      renderWithProviders(<YieldCalculator {...defaultProps} />);
      
      // Trigger calculation
      const bagSizeInput = screen.getByLabelText(/grow bag size/i);
      const quantityInput = screen.getByLabelText(/number of grow bags/i);

      await userEvent.selectOptions(bagSizeInput, BagSize.TWELVE_INCH);
      
      // Check disabled state
      expect(bagSizeInput).toBeDisabled();
      expect(quantityInput).toBeDisabled();

      // Wait for calculation to complete
      jest.advanceTimersByTime(500);
    });
  });
});