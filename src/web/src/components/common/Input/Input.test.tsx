import React from 'react';
import { screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../utils/test-utils';
import Input from './Input';
import { colors, typography, spacing } from '../../../styles/variables';

describe('Input Component', () => {
  // Common test props
  const defaultProps = {
    id: 'test-input',
    name: 'test',
    label: 'Test Input',
    value: '',
    onChange: jest.fn(),
  };

  // Helper function to render component with providers
  const renderInput = (props = {}) => {
    const user = userEvent.setup();
    return {
      user,
      ...renderWithProviders(
        <Input {...defaultProps} {...props} />
      )
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders input with label and meets accessibility standards', async () => {
      const { checkAccessibility } = renderInput();

      const input = screen.getByRole('textbox', { name: /test input/i });
      const label = screen.getByText(/test input/i);

      expect(input).toBeInTheDocument();
      expect(label).toBeInTheDocument();
      expect(input).toHaveAttribute('id', 'test-input');
      expect(label).toHaveAttribute('for', 'test-input');

      // Verify accessibility
      await checkAccessibility();
    });

    it('renders with required indicator when required prop is true', () => {
      renderInput({ required: true });
      const label = screen.getByText(/test input/i);
      expect(label).toHaveStyle({ color: colors.text });
      expect(label).toHaveTextContent('*');
    });

    it('renders with placeholder text when provided', () => {
      const placeholder = 'Enter value';
      renderInput({ placeholder });
      expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument();
    });

    it('renders in disabled state when disabled prop is true', () => {
      renderInput({ disabled: true });
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveStyle({
        backgroundColor: 'rgba(0, 0, 0, 0.12)',
        cursor: 'not-allowed'
      });
    });
  });

  describe('Validation and Error States', () => {
    const validationRules = [
      {
        type: 'required',
        message: 'This field is required'
      },
      {
        type: 'pattern',
        value: /^\d+$/,
        message: 'Must be a number'
      }
    ];

    it('displays error message and styling on validation failure', async () => {
      const { user } = renderInput({ validationRules });
      const input = screen.getByRole('textbox');

      await user.type(input, 'abc');
      fireEvent.blur(input);

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Must be a number');
      expect(input).toHaveStyle({ borderColor: colors.warning });
    });

    it('validates required field on blur', async () => {
      const { user } = renderInput({ validationRules });
      const input = screen.getByRole('textbox');

      await user.click(input);
      await user.tab();

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('This field is required');
    });

    it('clears error state when valid input is provided', async () => {
      const { user } = renderInput({ validationRules });
      const input = screen.getByRole('textbox');

      // First trigger error
      await user.type(input, 'abc');
      fireEvent.blur(input);
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Then fix it
      await user.clear(input);
      await user.type(input, '123');
      fireEvent.blur(input);

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveStyle({ opacity: 0 });
    });
  });

  describe('User Interactions', () => {
    it('handles value changes and calls onChange', async () => {
      const onChange = jest.fn();
      const { user } = renderInput({ onChange });
      const input = screen.getByRole('textbox');

      await user.type(input, 'test value');
      expect(onChange).toHaveBeenCalledWith('test value');
    });

    it('handles focus and blur events with correct styling', async () => {
      const onBlur = jest.fn();
      const { user } = renderInput({ onBlur });
      const input = screen.getByRole('textbox');

      // Check focus state
      await user.click(input);
      expect(input).toHaveFocus();
      expect(input).toHaveStyle({ borderColor: colors.primary });

      // Check blur state
      await user.tab();
      expect(input).not.toHaveFocus();
      expect(onBlur).toHaveBeenCalled();
    });

    it('handles number type input with min/max constraints', async () => {
      const { user } = renderInput({
        type: 'number',
        min: '0',
        max: '100'
      });
      const input = screen.getByRole('spinbutton');

      await user.type(input, '150');
      expect(input).toHaveValue(100);

      await user.clear(input);
      await user.type(input, '-10');
      expect(input).toHaveValue(0);
    });
  });

  describe('Unit Display', () => {
    it('renders unit text when provided', () => {
      renderInput({ unit: 'kg' });
      const unitText = screen.getByText('kg');
      expect(unitText).toBeInTheDocument();
      expect(unitText).toHaveStyle({
        position: 'absolute',
        right: '12px'
      });
    });

    it('positions unit text correctly relative to input', () => {
      renderInput({ unit: 'm²' });
      const unitText = screen.getByText('m²');
      expect(unitText).toHaveStyle({
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)'
      });
    });
  });

  describe('Form Integration', () => {
    it('integrates with form submission', async () => {
      const handleSubmit = jest.fn(e => e.preventDefault());
      const { user } = renderWithProviders(
        <form onSubmit={handleSubmit}>
          <Input {...defaultProps} required />
          <button type="submit">Submit</button>
        </form>
      );

      const input = screen.getByRole('textbox');
      const submitButton = screen.getByRole('button');

      await user.type(input, 'test value');
      await user.click(submitButton);

      expect(handleSubmit).toHaveBeenCalled();
    });

    it('prevents form submission when required field is empty', async () => {
      const handleSubmit = jest.fn(e => e.preventDefault());
      const { user } = renderWithProviders(
        <form onSubmit={handleSubmit}>
          <Input {...defaultProps} required />
          <button type="submit">Submit</button>
        </form>
      );

      const submitButton = screen.getByRole('button');
      await user.click(submitButton);

      expect(handleSubmit).not.toHaveBeenCalled();
      expect(screen.getByRole('textbox')).toBeInvalid();
    });
  });

  describe('Theme Compliance', () => {
    it('applies correct typography styles', () => {
      renderInput();
      const input = screen.getByRole('textbox');
      
      expect(input).toHaveStyle({
        fontFamily: typography.fontFamily,
        fontSize: typography.fontSize.md
      });
    });

    it('applies correct spacing styles', () => {
      renderInput();
      const inputContainer = screen.getByRole('textbox').parentElement;
      
      expect(inputContainer).toHaveStyle({
        marginBottom: spacing.md
      });
    });
  });
});