import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import GardenPlanner from './GardenPlanner';
import { renderWithProviders } from '../../utils/test-utils';
import { SOIL_TYPES, SUNLIGHT_CONDITIONS } from '../../constants/garden';

// Mock navigation and Redux dispatch
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock API functions
const mockCalculateSpace = vi.fn();
const mockCreateGarden = vi.fn();
vi.mock('../../hooks/useGarden', () => ({
  useGarden: () => ({
    calculateGardenSpace: mockCalculateSpace,
    createGarden: mockCreateGarden,
    loading: false,
    error: null,
    spaceCalculation: null
  })
}));

describe('GardenPlanner Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders garden planner form with all required fields', async () => {
    renderWithProviders(<GardenPlanner />);

    // Verify form elements are present
    expect(screen.getByRole('main', { name: /garden planner/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/length/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/width/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /soil type/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /sunlight/i })).toBeInTheDocument();
  });

  it('validates dimension inputs correctly', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GardenPlanner />);

    const lengthInput = screen.getByLabelText(/length/i);
    const widthInput = screen.getByLabelText(/width/i);

    // Test invalid dimensions
    await user.type(lengthInput, '1');
    await user.type(widthInput, '1');
    
    await waitFor(() => {
      expect(screen.getByText(/dimensions are too small/i)).toBeInTheDocument();
    });

    // Test valid dimensions
    await user.clear(lengthInput);
    await user.clear(widthInput);
    await user.type(lengthInput, '10');
    await user.type(widthInput, '10');

    await waitFor(() => {
      expect(screen.queryByText(/dimensions are too small/i)).not.toBeInTheDocument();
    });
  });

  it('handles soil type selection with all required options', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GardenPlanner />);

    const soilTypeSelect = screen.getByRole('combobox', { name: /soil type/i });
    await user.click(soilTypeSelect);

    // Verify all soil types are present
    Object.values(SOIL_TYPES).forEach(soilType => {
      expect(screen.getByText(new RegExp(soilType, 'i'))).toBeInTheDocument();
    });

    // Test soil type selection
    await user.selectOptions(soilTypeSelect, Object.keys(SOIL_TYPES)[0]);
    expect(soilTypeSelect).toHaveValue(Object.keys(SOIL_TYPES)[0]);
  });

  it('handles sunlight condition selection correctly', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GardenPlanner />);

    const sunlightSelect = screen.getByRole('combobox', { name: /sunlight/i });
    await user.click(sunlightSelect);

    // Verify all sunlight options are present
    Object.values(SUNLIGHT_CONDITIONS).forEach(condition => {
      expect(screen.getByText(new RegExp(condition, 'i'))).toBeInTheDocument();
    });

    // Test sunlight selection
    await user.selectOptions(sunlightSelect, Object.keys(SUNLIGHT_CONDITIONS)[0]);
    expect(sunlightSelect).toHaveValue(Object.keys(SUNLIGHT_CONDITIONS)[0]);
  });

  it('submits form with valid data successfully', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GardenPlanner />);

    // Fill form with valid data
    await user.type(screen.getByLabelText(/length/i), '20');
    await user.type(screen.getByLabelText(/width/i), '20');
    await user.selectOptions(
      screen.getByRole('combobox', { name: /soil type/i }),
      Object.keys(SOIL_TYPES)[0]
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: /sunlight/i }),
      Object.keys(SUNLIGHT_CONDITIONS)[0]
    );

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create garden/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateGarden).toHaveBeenCalledWith({
        dimensions: { length: 20, width: 20 },
        soilType: Object.keys(SOIL_TYPES)[0],
        sunlight: Object.keys(SUNLIGHT_CONDITIONS)[0]
      });
    });
  });

  it('displays space calculation results when available', async () => {
    const spaceCalculation = {
      totalArea: 400,
      usableArea: 360,
      capacityPercentage: 90
    };

    renderWithProviders(<GardenPlanner />, {
      preloadedState: {
        garden: {
          spaceCalculation
        }
      }
    });

    await waitFor(() => {
      expect(screen.getByText(/total area/i)).toBeInTheDocument();
      expect(screen.getByText(/360/)).toBeInTheDocument();
    });
  });

  it('shows space capacity warning when utilization is high', async () => {
    renderWithProviders(<GardenPlanner />, {
      preloadedState: {
        garden: {
          spaceCalculation: {
            capacityPercentage: 95
          }
        }
      }
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/space warning/i);
    });
  });

  it('maintains accessibility requirements', async () => {
    const { checkAccessibility } = renderWithProviders(<GardenPlanner />);
    await checkAccessibility();

    // Verify ARIA labels and roles
    expect(screen.getByRole('main', { name: /garden planner/i })).toHaveAttribute('aria-label');
    expect(screen.getByLabelText(/length/i)).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText(/width/i)).toHaveAttribute('aria-required', 'true');
  });

  it('handles error states appropriately', async () => {
    renderWithProviders(<GardenPlanner />, {
      preloadedState: {
        garden: {
          error: 'Failed to create garden'
        }
      }
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to create garden');
  });
});