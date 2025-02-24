import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { renderWithProviders } from '../../../utils/test-utils';
import { CropForm } from './CropForm';
import { BagSize } from '../../../types/crops';

// Test constants
const TEST_GARDEN_ID = 'test-garden-123';
const VALID_CROP_DATA = {
  name: 'Tomatoes',
  quantityNeeded: 5,
  growBags: 3,
  bagSize: BagSize.TWELVE_INCH
};

const MOCK_INITIAL_STATE = {
  garden: {
    currentGarden: {
      id: TEST_GARDEN_ID,
      spaceAvailable: 100
    }
  }
};

// Common test setup function
const setup = (props = {}) => {
  const handleSubmit = vi.fn();
  const defaultProps = {
    gardenId: TEST_GARDEN_ID,
    handleSubmit,
    isLoading: false,
    ...props
  };

  return {
    handleSubmit,
    ...renderWithProviders(<CropForm {...defaultProps} />, {
      preloadedState: MOCK_INITIAL_STATE
    })
  };
};

describe('CropForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields correctly', () => {
    setup();

    // Verify all form fields are present
    expect(screen.getByLabelText(/crop name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/daily quantity needed/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/number of grow bags/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bag size selection/i)).toBeInTheDocument();

    // Verify initial empty state
    expect(screen.getByLabelText(/crop name/i)).toHaveValue('');
    expect(screen.getByLabelText(/daily quantity needed/i)).toHaveValue(1);
    expect(screen.getByLabelText(/number of grow bags/i)).toHaveValue(1);
  });

  it('validates required fields', async () => {
    const { handleSubmit } = setup();

    // Submit empty form
    fireEvent.submit(screen.getByRole('form'));

    // Verify validation messages
    await waitFor(() => {
      expect(screen.getByText(/crop name is required/i)).toBeInTheDocument();
    });

    // Verify form was not submitted
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('validates minimum quantity needed', async () => {
    setup();

    // Enter invalid quantity
    const quantityInput = screen.getByLabelText(/daily quantity needed/i);
    fireEvent.change(quantityInput, { target: { value: '0' } });
    fireEvent.blur(quantityInput);

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/minimum quantity is 1g/i)).toBeInTheDocument();
    });

    // Enter valid quantity
    fireEvent.change(quantityInput, { target: { value: '5' } });
    fireEvent.blur(quantityInput);

    // Verify error message disappears
    await waitFor(() => {
      expect(screen.queryByText(/minimum quantity is 1g/i)).not.toBeInTheDocument();
    });
  });

  it('validates grow bags space capacity', async () => {
    setup();

    // Enter excessive grow bags
    const growBagsInput = screen.getByLabelText(/number of grow bags/i);
    fireEvent.change(growBagsInput, { target: { value: '50' } });
    fireEvent.blur(growBagsInput);

    // Verify warning message
    await waitFor(() => {
      expect(screen.getByText(/will utilize over 90% of available space/i)).toBeInTheDocument();
    });

    // Enter reasonable number
    fireEvent.change(growBagsInput, { target: { value: '3' } });
    fireEvent.blur(growBagsInput);

    // Verify warning disappears
    await waitFor(() => {
      expect(screen.queryByText(/will utilize over 90% of available space/i)).not.toBeInTheDocument();
    });
  });

  it('handles loading state correctly', () => {
    setup({ isLoading: true });

    // Verify loading state UI
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveTextContent(/saving/i);
    expect(screen.getByLabelText(/crop name/i)).toBeDisabled();
    expect(screen.getByLabelText(/daily quantity needed/i)).toBeDisabled();
    expect(screen.getByLabelText(/number of grow bags/i)).toBeDisabled();
    expect(screen.getByLabelText(/bag size selection/i)).toBeDisabled();
  });

  it('handles successful form submission', async () => {
    const { handleSubmit } = setup();

    // Fill form with valid data
    fireEvent.change(screen.getByLabelText(/crop name/i), {
      target: { value: VALID_CROP_DATA.name }
    });
    fireEvent.change(screen.getByLabelText(/daily quantity needed/i), {
      target: { value: VALID_CROP_DATA.quantityNeeded }
    });
    fireEvent.change(screen.getByLabelText(/number of grow bags/i), {
      target: { value: VALID_CROP_DATA.growBags }
    });
    fireEvent.change(screen.getByLabelText(/bag size selection/i), {
      target: { value: VALID_CROP_DATA.bagSize }
    });

    // Submit form
    fireEvent.submit(screen.getByRole('form'));

    // Verify submission
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        gardenId: TEST_GARDEN_ID,
        ...VALID_CROP_DATA
      });
    });
  });

  it('handles initial values correctly', () => {
    setup({ initialValues: VALID_CROP_DATA });

    // Verify form fields are populated with initial values
    expect(screen.getByLabelText(/crop name/i)).toHaveValue(VALID_CROP_DATA.name);
    expect(screen.getByLabelText(/daily quantity needed/i)).toHaveValue(VALID_CROP_DATA.quantityNeeded);
    expect(screen.getByLabelText(/number of grow bags/i)).toHaveValue(VALID_CROP_DATA.growBags);
    expect(screen.getByLabelText(/bag size selection/i)).toHaveValue(VALID_CROP_DATA.bagSize);
  });

  it('validates bag size selection', async () => {
    const { handleSubmit } = setup();

    // Fill form with invalid bag size
    fireEvent.change(screen.getByLabelText(/bag size selection/i), {
      target: { value: 'invalid' }
    });
    fireEvent.blur(screen.getByLabelText(/bag size selection/i));

    // Verify validation message
    await waitFor(() => {
      expect(screen.getByText(/invalid bag size/i)).toBeInTheDocument();
    });

    // Form should not submit with invalid data
    fireEvent.submit(screen.getByRole('form'));
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('maintains form state during user input', async () => {
    setup();

    // Enter values sequentially
    fireEvent.change(screen.getByLabelText(/crop name/i), {
      target: { value: 'Tom' }
    });
    fireEvent.change(screen.getByLabelText(/crop name/i), {
      target: { value: 'Tomatoes' }
    });

    // Verify input persistence
    expect(screen.getByLabelText(/crop name/i)).toHaveValue('Tomatoes');
  });

  it('clears form after successful submission', async () => {
    const { handleSubmit } = setup();

    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/crop name/i), {
      target: { value: VALID_CROP_DATA.name }
    });
    fireEvent.submit(screen.getByRole('form'));

    // Verify form reset
    await waitFor(() => {
      expect(screen.getByLabelText(/crop name/i)).toHaveValue('');
      expect(handleSubmit).toHaveBeenCalled();
    });
  });
});