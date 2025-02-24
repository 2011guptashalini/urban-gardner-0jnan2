import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, expect, describe, it, beforeEach } from 'vitest';
import { renderWithProviders } from '../../../utils/test-utils';
import GardenForm from './GardenForm';
import { Garden, SoilType, SunlightCondition } from '../../../types/garden';

// Mock garden data for testing
const mockGarden: Garden = {
  id: 'test-garden-id',
  userId: 'test-user-id',
  name: 'Test Garden',
  dimensions: {
    length: 20,
    width: 15,
    unit: 'feet'
  },
  soilType: SoilType.LOAMY_SOIL,
  sunlight: SunlightCondition.FULL_SUN,
  createdAt: new Date('2023-01-01T00:00:00.000Z'),
  updatedAt: new Date('2023-01-01T00:00:00.000Z')
};

// Mock validation error
const mockValidationError = {
  code: 'VALIDATION_ERROR',
  message: 'Invalid garden dimensions',
  details: {
    length: 'Length must be between 2 and 100',
    width: 'Width must be between 2 and 100'
  }
};

// Test setup helper
const setup = (props = {}) => {
  const user = userEvent.setup();
  const mockSubmit = vi.fn();
  const utils = renderWithProviders(
    <GardenForm onSubmit={mockSubmit} {...props} />
  );
  return {
    user,
    mockSubmit,
    ...utils
  };
};

describe('GardenForm Component', () => {
  describe('Rendering', () => {
    it('renders empty form with all required fields', () => {
      setup();
      
      expect(screen.getByLabelText(/length/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/width/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select soil type/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select sunlight condition/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create garden/i })).toBeInTheDocument();
    });

    it('renders form with initial garden data', () => {
      setup({ garden: mockGarden });
      
      expect(screen.getByLabelText(/length/i)).toHaveValue('20');
      expect(screen.getByLabelText(/width/i)).toHaveValue('15');
      expect(screen.getByText(new RegExp(mockGarden.soilType, 'i'))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(mockGarden.sunlight, 'i'))).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update garden/i })).toBeInTheDocument();
    });

    it('renders in loading state', () => {
      setup({ isLoading: true });
      
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    });

    it('meets accessibility standards', async () => {
      const { checkAccessibility } = setup();
      await checkAccessibility();
    });
  });

  describe('Dimension Validation', () => {
    it('validates minimum length and width', async () => {
      const { user } = setup();
      
      await user.type(screen.getByLabelText(/length/i), '1');
      await user.type(screen.getByLabelText(/width/i), '1');
      
      expect(await screen.findByText(/dimension too small/i)).toBeInTheDocument();
    });

    it('validates maximum length and width', async () => {
      const { user } = setup();
      
      await user.type(screen.getByLabelText(/length/i), '1001');
      await user.type(screen.getByLabelText(/width/i), '1001');
      
      expect(await screen.findByText(/dimension too large/i)).toBeInTheDocument();
    });

    it('handles unit conversion correctly', async () => {
      const { user } = setup();
      
      await user.type(screen.getByLabelText(/length \(feet\)/i), '10');
      await user.click(screen.getByRole('button', { name: /measurement unit/i }));
      await user.click(screen.getByText(/meters/i));
      
      expect(screen.getByLabelText(/length \(meters\)/i)).toHaveValue('3.05');
    });
  });

  describe('Soil Type Selection', () => {
    it('renders all soil type options', async () => {
      const { user } = setup();
      
      await user.click(screen.getByRole('button', { name: /select soil type/i }));
      
      expect(screen.getByText(/red soil/i)).toBeInTheDocument();
      expect(screen.getByText(/sandy soil/i)).toBeInTheDocument();
      expect(screen.getByText(/loamy soil/i)).toBeInTheDocument();
      expect(screen.getByText(/clay soil/i)).toBeInTheDocument();
      expect(screen.getByText(/black soil/i)).toBeInTheDocument();
    });

    it('allows soil type selection', async () => {
      const { user } = setup();
      
      await user.click(screen.getByRole('button', { name: /select soil type/i }));
      await user.click(screen.getByText(/loamy soil/i));
      
      expect(screen.getByText(/loamy soil/i)).toBeInTheDocument();
    });
  });

  describe('Sunlight Condition', () => {
    it('renders all sunlight options', async () => {
      const { user } = setup();
      
      await user.click(screen.getByRole('button', { name: /select sunlight condition/i }));
      
      expect(screen.getByText(/full sun/i)).toBeInTheDocument();
      expect(screen.getByText(/partial shade/i)).toBeInTheDocument();
      expect(screen.getByText(/full shade/i)).toBeInTheDocument();
    });

    it('allows sunlight condition selection', async () => {
      const { user } = setup();
      
      await user.click(screen.getByRole('button', { name: /select sunlight condition/i }));
      await user.click(screen.getByText(/full sun/i));
      
      expect(screen.getByText(/full sun/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('submits with valid data', async () => {
      const { user, mockSubmit } = setup();
      
      await user.type(screen.getByLabelText(/length/i), '20');
      await user.type(screen.getByLabelText(/width/i), '15');
      await user.click(screen.getByRole('button', { name: /select soil type/i }));
      await user.click(screen.getByText(/loamy soil/i));
      await user.click(screen.getByRole('button', { name: /select sunlight condition/i }));
      await user.click(screen.getByText(/full sun/i));
      
      await user.click(screen.getByRole('button', { name: /create garden/i }));
      
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({
          dimensions: { length: 20, width: 15, unit: 'feet' },
          soilType: SoilType.LOAMY_SOIL,
          sunlight: SunlightCondition.FULL_SUN
        }));
      });
    });

    it('prevents submission with invalid data', async () => {
      const { user, mockSubmit } = setup();
      
      await user.type(screen.getByLabelText(/length/i), '1');
      await user.click(screen.getByRole('button', { name: /create garden/i }));
      
      expect(mockSubmit).not.toHaveBeenCalled();
      expect(screen.getByText(/dimension too small/i)).toBeInTheDocument();
    });

    it('shows loading state during submission', async () => {
      const { user } = setup({ isLoading: true });
      
      await user.click(screen.getByRole('button', { name: /saving/i }));
      
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('displays validation errors', async () => {
      const { user } = setup({
        onValidationError: vi.fn()
      });
      
      await user.type(screen.getByLabelText(/length/i), '1');
      
      expect(await screen.findByText(/dimension too small/i)).toBeInTheDocument();
    });

    it('clears errors on input change', async () => {
      const { user } = setup();
      
      await user.type(screen.getByLabelText(/length/i), '1');
      expect(await screen.findByText(/dimension too small/i)).toBeInTheDocument();
      
      await user.clear(screen.getByLabelText(/length/i));
      await user.type(screen.getByLabelText(/length/i), '20');
      
      expect(screen.queryByText(/dimension too small/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('supports keyboard navigation', async () => {
      const { user } = setup();
      
      await user.tab();
      expect(screen.getByLabelText(/length/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/width/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('button', { name: /measurement unit/i })).toHaveFocus();
    });

    it('provides error announcements', async () => {
      const { user } = setup();
      
      await user.type(screen.getByLabelText(/length/i), '1');
      
      const errorMessage = await screen.findByRole('alert');
      expect(errorMessage).toHaveTextContent(/dimension too small/i);
    });
  });
});