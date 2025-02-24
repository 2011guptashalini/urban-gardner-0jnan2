import React from 'react';
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axe from '@axe-core/react';
import { renderWithProviders } from '../../../utils/test-utils';
import Dropdown from './Dropdown';
import { SoilType, SunlightCondition } from '../../../types/garden';

// Mock data for tests
const soilTypeOptions = Object.values(SoilType).map(type => ({
  value: type,
  label: type.replace(/_/g, ' ').toLowerCase()
}));

const sunlightOptions = Object.values(SunlightCondition).map(condition => ({
  value: condition,
  label: condition.replace(/_/g, ' ').toLowerCase()
}));

describe('Dropdown Component', () => {
  // Common setup for all tests
  const mockOnChange = jest.fn();
  const mockOnBlur = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    mockOnBlur.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with placeholder when no value is selected', () => {
      renderWithProviders(
        <Dropdown
          options={soilTypeOptions}
          value={null}
          onChange={mockOnChange}
          placeholder="Select soil type"
          ariaLabel="Soil type selector"
        />
      );

      expect(screen.getByText('Select soil type')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    });

    it('renders with selected value', () => {
      const selectedValue = soilTypeOptions[0];
      renderWithProviders(
        <Dropdown
          options={soilTypeOptions}
          value={selectedValue}
          onChange={mockOnChange}
          placeholder="Select soil type"
        />
      );

      expect(screen.getByText(selectedValue.label)).toBeInTheDocument();
    });

    it('renders in error state with error message', () => {
      const errorMessage = 'Please select a soil type';
      renderWithProviders(
        <Dropdown
          options={soilTypeOptions}
          value={null}
          onChange={mockOnChange}
          error={errorMessage}
          placeholder="Select soil type"
        />
      );

      expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
      expect(screen.getByTestId('dropdown-container')).toHaveStyle({
        borderColor: expect.stringContaining('error')
      });
    });

    it('renders in disabled state', () => {
      renderWithProviders(
        <Dropdown
          options={soilTypeOptions}
          value={null}
          onChange={mockOnChange}
          disabled={true}
          placeholder="Select soil type"
        />
      );

      const trigger = screen.getByRole('button');
      expect(trigger).toBeDisabled();
      expect(trigger).toHaveAttribute('aria-disabled', 'true');
    });

    it('renders loading state', () => {
      renderWithProviders(
        <Dropdown
          options={[]}
          value={null}
          onChange={mockOnChange}
          isLoading={true}
          placeholder="Select soil type"
        />
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Interaction Handling', () => {
    it('opens menu on click and displays options', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <Dropdown
          options={soilTypeOptions}
          value={null}
          onChange={mockOnChange}
          placeholder="Select soil type"
        />
      );

      await user.click(screen.getByRole('button'));
      
      const menu = screen.getByRole('listbox');
      expect(menu).toBeInTheDocument();
      
      soilTypeOptions.forEach(option => {
        expect(screen.getByText(option.label)).toBeInTheDocument();
      });
    });

    it('selects option on click and closes menu', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <Dropdown
          options={soilTypeOptions}
          value={null}
          onChange={mockOnChange}
          placeholder="Select soil type"
        />
      );

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText(soilTypeOptions[0].label));

      expect(mockOnChange).toHaveBeenCalledWith(soilTypeOptions[0]);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <Dropdown
          options={soilTypeOptions}
          value={null}
          onChange={mockOnChange}
          placeholder="Select soil type"
        />
      );

      const trigger = screen.getByRole('button');
      await user.tab();
      expect(trigger).toHaveFocus();

      // Open with Enter
      await user.keyboard('{Enter}');
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      // Navigate with arrow keys
      await user.keyboard('{ArrowDown}');
      expect(screen.getByText(soilTypeOptions[0].label)).toHaveClass('focused');

      // Select with Enter
      await user.keyboard('{Enter}');
      expect(mockOnChange).toHaveBeenCalledWith(soilTypeOptions[0]);
    });

    it('closes on outside click', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <Dropdown
          options={soilTypeOptions}
          value={null}
          onChange={mockOnChange}
          placeholder="Select soil type"
        />
      );

      await user.click(screen.getByRole('button'));
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      await user.click(document.body);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('meets WCAG accessibility guidelines', async () => {
      const { container } = renderWithProviders(
        <Dropdown
          options={soilTypeOptions}
          value={null}
          onChange={mockOnChange}
          placeholder="Select soil type"
          ariaLabel="Soil type selector"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('maintains proper ARIA attributes', () => {
      renderWithProviders(
        <Dropdown
          options={soilTypeOptions}
          value={soilTypeOptions[0]}
          onChange={mockOnChange}
          placeholder="Select soil type"
          ariaLabel="Soil type selector"
        />
      );

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('aria-label', 'Soil type selector');
    });

    it('manages focus correctly', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <Dropdown
          options={soilTypeOptions}
          value={null}
          onChange={mockOnChange}
          placeholder="Select soil type"
        />
      );

      await user.tab();
      expect(screen.getByRole('button')).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(screen.getByRole('listbox')).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Integration Tests', () => {
    it('integrates with soil type selection requirement', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <Dropdown
          options={soilTypeOptions}
          value={null}
          onChange={mockOnChange}
          placeholder="Select soil type"
          error="Soil type is required"
        />
      );

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText(soilTypeOptions[0].label));

      expect(mockOnChange).toHaveBeenCalledWith(soilTypeOptions[0]);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('integrates with sunlight condition requirement', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <Dropdown
          options={sunlightOptions}
          value={null}
          onChange={mockOnChange}
          placeholder="Select sunlight condition"
        />
      );

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText(sunlightOptions[0].label));

      expect(mockOnChange).toHaveBeenCalledWith(sunlightOptions[0]);
    });
  });
});