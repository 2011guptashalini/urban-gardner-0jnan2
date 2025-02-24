import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, expect, describe, it, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { axe } from '@axe-core/react';
import { MaintenanceForm } from './MaintenanceForm';
import { renderWithProviders } from '../../../utils/test-utils';
import { TaskType, Frequency, TimeOfDay, Unit } from '../../../types/maintenance';

// Mock constants
const DEFAULT_CROP_ID = 'test-crop-123';
const AI_RESPONSE_TIME = 3000; // 3s SLA requirement

// Mock functions
const mockOnSubmit = vi.fn();
const mockOnCancel = vi.fn();
const mockOnAIError = vi.fn();
const mockGetAIRecommendations = vi.fn();

// Test setup helper
const setupForm = (props = {}) => {
  const user = userEvent.setup();
  const defaultProps = {
    cropId: DEFAULT_CROP_ID,
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
    onAIError: mockOnAIError,
    enableAI: true,
  };

  const renderResult = renderWithProviders(
    <MaintenanceForm {...defaultProps} {...props} />
  );

  return {
    user,
    ...renderResult,
  };
};

// Mock task data helper
const createMockTask = (overrides = {}) => ({
  taskType: TaskType.Water,
  frequency: Frequency.Daily,
  amount: 500,
  unit: Unit.Milliliters,
  preferredTime: TimeOfDay.Morning,
  ...overrides,
});

describe('MaintenanceForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  describe('Form Rendering and Validation', () => {
    it('renders all form fields with correct labels and ARIA attributes', () => {
      const { container } = setupForm();

      expect(screen.getByLabelText(/task type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/frequency/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/unit/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/preferred time/i)).toBeInTheDocument();

      // Check ARIA attributes
      expect(container.querySelector('[aria-invalid]')).toBeFalsy();
      expect(container.querySelector('[aria-required="true"]')).toBeTruthy();
    });

    it('validates required fields on submission', async () => {
      const { user } = setupForm();

      // Submit empty form
      await user.click(screen.getByRole('button', { name: /create task/i }));

      // Check error messages
      expect(await screen.findByText(/task type is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/frequency is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/amount is required/i)).toBeInTheDocument();
    });

    it('validates amount field constraints', async () => {
      const { user } = setupForm();

      // Enter negative amount
      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, '-50');

      // Check error message
      expect(await screen.findByText(/amount must be positive/i)).toBeInTheDocument();
    });

    it('validates custom frequency days range', async () => {
      const { user } = setupForm();

      // Select custom frequency
      await user.click(screen.getByLabelText(/frequency/i));
      await user.click(screen.getByText(/custom/i));

      // Enter invalid days
      const daysInput = screen.getByLabelText(/custom frequency/i);
      await user.type(daysInput, '100');

      expect(await screen.findByText(/maximum 90 days/i)).toBeInTheDocument();
    });
  });

  describe('AI Recommendations Integration', () => {
    it('fetches AI recommendations when enabled', async () => {
      const { user } = setupForm({
        enableAI: true,
      });

      // Enable AI recommendations
      await user.click(screen.getByLabelText(/use ai recommendations/i));

      // Wait for loading state
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      // Fast-forward timers
      vi.advanceTimersByTime(AI_RESPONSE_TIME);

      // Verify recommendations applied
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });

    it('displays AI confidence score when recommendations received', async () => {
      const mockConfidence = 0.85;
      mockGetAIRecommendations.mockResolvedValueOnce([
        createMockTask({ aiConfidence: mockConfidence })
      ]);

      const { user } = setupForm();

      // Enable AI recommendations
      await user.click(screen.getByLabelText(/use ai recommendations/i));

      // Wait for confidence score
      await waitFor(() => {
        expect(screen.getByText(`AI Confidence: ${(mockConfidence * 100).toFixed(1)}%`))
          .toBeInTheDocument();
      });
    });

    it('handles AI service errors gracefully', async () => {
      mockGetAIRecommendations.mockRejectedValueOnce(new Error('AI service unavailable'));

      const { user } = setupForm();

      // Enable AI recommendations
      await user.click(screen.getByLabelText(/use ai recommendations/i));

      // Verify error handling
      await waitFor(() => {
        expect(mockOnAIError).toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission and Validation', () => {
    it('submits valid form data successfully', async () => {
      const { user } = setupForm();
      const taskData = createMockTask();

      // Fill form
      await user.click(screen.getByLabelText(/task type/i));
      await user.click(screen.getByText(taskData.taskType));
      await user.click(screen.getByLabelText(/frequency/i));
      await user.click(screen.getByText(taskData.frequency));
      await user.type(screen.getByLabelText(/amount/i), taskData.amount.toString());
      await user.click(screen.getByLabelText(/unit/i));
      await user.click(screen.getByText(taskData.unit));
      await user.click(screen.getByLabelText(/preferred time/i));
      await user.click(screen.getByText(taskData.preferredTime));

      // Submit form
      await user.click(screen.getByRole('button', { name: /create task/i }));

      // Verify submission
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining(taskData));
    });

    it('handles form submission errors', async () => {
      mockOnSubmit.mockRejectedValueOnce(new Error('Submission failed'));
      const { user } = setupForm();

      // Fill and submit form
      const taskData = createMockTask();
      await user.click(screen.getByLabelText(/task type/i));
      await user.click(screen.getByText(taskData.taskType));
      await user.click(screen.getByRole('button', { name: /create task/i }));

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Compliance', () => {
    it('passes accessibility audit', async () => {
      const { container } = setupForm();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('supports keyboard navigation', async () => {
      const { user } = setupForm();

      // Tab through form fields
      await user.tab();
      expect(screen.getByLabelText(/task type/i)).toHaveFocus();
      await user.tab();
      expect(screen.getByLabelText(/frequency/i)).toHaveFocus();
      await user.tab();
      expect(screen.getByLabelText(/amount/i)).toHaveFocus();
    });

    it('announces form validation errors', async () => {
      const { user } = setupForm();

      // Submit invalid form
      await user.click(screen.getByRole('button', { name: /create task/i }));

      // Check error announcements
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
      alerts.forEach(alert => {
        expect(alert).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  describe('Performance and Error Handling', () => {
    it('debounces AI recommendation requests', async () => {
      const { user } = setupForm();

      // Enable AI and make rapid changes
      await user.click(screen.getByLabelText(/use ai recommendations/i));
      await user.type(screen.getByLabelText(/amount/i), '100');
      await user.type(screen.getByLabelText(/amount/i), '200');
      await user.type(screen.getByLabelText(/amount/i), '300');

      // Verify debounced calls
      vi.advanceTimersByTime(300);
      expect(mockGetAIRecommendations).toHaveBeenCalledTimes(1);
    });

    it('maintains form state during AI loading', async () => {
      const { user } = setupForm();
      const amount = '500';

      // Enter form data
      await user.type(screen.getByLabelText(/amount/i), amount);
      await user.click(screen.getByLabelText(/use ai recommendations/i));

      // Verify form state preserved during loading
      expect(screen.getByLabelText(/amount/i)).toHaveValue(amount);
    });
  });
});