import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, jest } from '@jest/globals';
import { axe } from 'jest-axe';

import SpaceCalculator from './SpaceCalculator';
import { renderWithProviders } from '../../../utils/test-utils';
import { SoilType, SunlightCondition, MeasurementUnit } from '../../../types/garden';

describe('SpaceCalculator Component', () => {
  // Setup function for common test scenarios
  const setupTest = (customProps = {}) => {
    const defaultProps = {
      initialDimensions: {
        length: 20,
        width: 15,
        unit: MeasurementUnit.FEET
      },
      onCalculate: jest.fn()
    };

    const props = { ...defaultProps, ...customProps };
    const utils = renderWithProviders(<SpaceCalculator {...props} />);
    const user = userEvent.setup();

    return {
      ...utils,
      user,
      props
    };
  };

  it('renders initial form with all required fields', async () => {
    const { container } = setupTest();

    // Verify length input field
    expect(screen.getByLabelText(/length/i)).toBeInTheDocument();

    // Verify width input field
    expect(screen.getByLabelText(/width/i)).toBeInTheDocument();

    // Verify soil type dropdown with all 5 options
    const soilSelect = screen.getByLabelText(/soil type/i);
    expect(soilSelect).toBeInTheDocument();
    Object.values(SoilType).forEach(type => {
      expect(screen.getByText(new RegExp(type, 'i'))).toBeInTheDocument();
    });

    // Verify sunlight condition options
    Object.values(SunlightCondition).forEach(condition => {
      expect(screen.getByText(new RegExp(condition, 'i'))).toBeInTheDocument();
    });

    // Check accessibility
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('validates dimension inputs correctly', async () => {
    const { user } = setupTest();
    const lengthInput = screen.getByLabelText(/length/i);
    const widthInput = screen.getByLabelText(/width/i);

    // Test minimum dimension validation
    await user.clear(lengthInput);
    await user.type(lengthInput, '1');
    expect(screen.getByText(/minimum/i)).toBeInTheDocument();

    // Test maximum dimension validation
    await user.clear(lengthInput);
    await user.type(lengthInput, '1001');
    expect(screen.getByText(/maximum/i)).toBeInTheDocument();

    // Test valid dimensions
    await user.clear(lengthInput);
    await user.clear(widthInput);
    await user.type(lengthInput, '20');
    await user.type(widthInput, '15');
    
    await waitFor(() => {
      expect(screen.queryByText(/minimum/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/maximum/i)).not.toBeInTheDocument();
    });
  });

  it('handles soil type selection with validation', async () => {
    const { user } = setupTest();
    const soilSelect = screen.getByLabelText(/soil type/i);

    // Test each soil type selection
    for (const soilType of Object.values(SoilType)) {
      await user.click(soilSelect);
      const option = screen.getByText(new RegExp(soilType, 'i'));
      await user.click(option);
      
      await waitFor(() => {
        expect(soilSelect).toHaveValue(soilType);
      });
    }
  });

  it('handles sunlight condition selection with validation', async () => {
    const { user } = setupTest();
    const sunlightSelect = screen.getByLabelText(/sunlight/i);

    // Test each sunlight condition
    for (const condition of Object.values(SunlightCondition)) {
      await user.click(sunlightSelect);
      const option = screen.getByText(new RegExp(condition, 'i'));
      await user.click(option);
      
      await waitFor(() => {
        expect(sunlightSelect).toHaveValue(condition);
      });
    }
  });

  it('displays capacity warning when space utilization is high', async () => {
    const { user } = setupTest({
      initialDimensions: {
        length: 95,
        width: 95,
        unit: MeasurementUnit.FEET
      }
    });

    // Fill in required fields
    await user.click(screen.getByLabelText(/soil type/i));
    await user.click(screen.getByText(new RegExp(SoilType.LOAMY_SOIL, 'i')));
    
    await user.click(screen.getByLabelText(/sunlight/i));
    await user.click(screen.getByText(new RegExp(SunlightCondition.FULL_SUN, 'i')));

    // Verify warning appears
    await waitFor(() => {
      const warning = screen.getByRole('alert');
      expect(warning).toBeInTheDocument();
      expect(warning).toHaveAttribute('aria-live', 'polite');
      expect(warning).toHaveTextContent(/space critical/i);
    });
  });

  it('calculates garden space correctly', async () => {
    const onCalculate = jest.fn();
    const { user } = setupTest({ onCalculate });

    // Enter valid dimensions
    const lengthInput = screen.getByLabelText(/length/i);
    const widthInput = screen.getByLabelText(/width/i);
    
    await user.clear(lengthInput);
    await user.clear(widthInput);
    await user.type(lengthInput, '30');
    await user.type(widthInput, '20');

    // Select soil type and sunlight
    await user.click(screen.getByLabelText(/soil type/i));
    await user.click(screen.getByText(new RegExp(SoilType.LOAMY_SOIL, 'i')));
    
    await user.click(screen.getByLabelText(/sunlight/i));
    await user.click(screen.getByText(new RegExp(SunlightCondition.FULL_SUN, 'i')));

    // Verify calculation triggered
    await waitFor(() => {
      expect(onCalculate).toHaveBeenCalledWith({
        length: 30,
        width: 20,
        unit: MeasurementUnit.FEET
      });
    });

    // Verify calculation display
    expect(screen.getByText(/total area/i)).toBeInTheDocument();
    expect(screen.getByText(/usable area/i)).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    const onCalculate = jest.fn().mockRejectedValue(new Error('API Error'));
    const { user } = setupTest({ onCalculate });

    // Trigger calculation with valid data
    await user.clear(screen.getByLabelText(/length/i));
    await user.type(screen.getByLabelText(/length/i), '30');
    
    await user.clear(screen.getByLabelText(/width/i));
    await user.type(screen.getByLabelText(/width/i), '20');

    await user.click(screen.getByLabelText(/soil type/i));
    await user.click(screen.getByText(new RegExp(SoilType.LOAMY_SOIL, 'i')));
    
    await user.click(screen.getByLabelText(/sunlight/i));
    await user.click(screen.getByText(new RegExp(SunlightCondition.FULL_SUN, 'i')));

    // Verify error handling
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/error/i);
    });
  });

  it('maintains accessibility standards', async () => {
    const { container } = setupTest();

    // Test keyboard navigation
    const lengthInput = screen.getByLabelText(/length/i);
    const widthInput = screen.getByLabelText(/width/i);
    const soilSelect = screen.getByLabelText(/soil type/i);
    const sunlightSelect = screen.getByLabelText(/sunlight/i);

    expect(lengthInput).toHaveAttribute('aria-label');
    expect(widthInput).toHaveAttribute('aria-label');
    expect(soilSelect).toHaveAttribute('aria-label');
    expect(sunlightSelect).toHaveAttribute('aria-label');

    // Run full accessibility audit
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});