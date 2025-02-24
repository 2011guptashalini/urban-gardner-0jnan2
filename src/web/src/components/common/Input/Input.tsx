import React, { forwardRef, useState, useCallback, ChangeEvent, FocusEvent } from 'react';
import { InputContainer, StyledInput, InputLabel, ErrorMessage } from './Input.styles';

type InputType = 'text' | 'number' | 'email' | 'password' | 'tel';

interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

interface InputProps {
  id: string;
  name: string;
  label: string;
  value: string;
  type?: InputType;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string;
  unit?: string;
  validationRules?: ValidationRule[];
  onChange: (value: string) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
}

/**
 * A reusable input component with validation and accessibility features
 * @version 1.0.0
 */
const Input = forwardRef<HTMLInputElement, InputProps>(({
  id,
  name,
  label,
  value,
  type = 'text',
  placeholder,
  error,
  disabled = false,
  required = false,
  min,
  max,
  step,
  unit,
  validationRules = [],
  onChange,
  onBlur,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localError, setLocalError] = useState<string>('');

  /**
   * Validates input value based on validation rules
   */
  const validateInput = useCallback((inputValue: string): string => {
    for (const rule of validationRules) {
      switch (rule.type) {
        case 'required':
          if (!inputValue.trim()) {
            return rule.message;
          }
          break;
        case 'min':
          if (type === 'number' && Number(inputValue) < Number(rule.value)) {
            return rule.message;
          }
          break;
        case 'max':
          if (type === 'number' && Number(inputValue) > Number(rule.value)) {
            return rule.message;
          }
          break;
        case 'pattern':
          if (!new RegExp(rule.value).test(inputValue)) {
            return rule.message;
          }
          break;
        case 'custom':
          if (typeof rule.value === 'function' && !rule.value(inputValue)) {
            return rule.message;
          }
          break;
      }
    }
    return '';
  }, [type, validationRules]);

  /**
   * Handles input value changes with validation
   */
  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    let validatedValue = inputValue;

    // Handle number type validation
    if (type === 'number') {
      const numValue = Number(inputValue);
      if (min !== undefined && numValue < Number(min)) {
        validatedValue = min.toString();
      }
      if (max !== undefined && numValue > Number(max)) {
        validatedValue = max.toString();
      }
    }

    // Validate input
    const validationError = validateInput(validatedValue);
    setLocalError(validationError);

    // Call onChange with validated value
    onChange(validatedValue);
  }, [type, min, max, onChange, validateInput]);

  /**
   * Handles input focus events
   */
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  /**
   * Handles input blur events
   */
  const handleBlur = useCallback((event: FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    const validationError = validateInput(event.target.value);
    setLocalError(validationError);
    onBlur?.(event);
  }, [onBlur, validateInput]);

  // Combine external and internal error states
  const displayError = error || localError;

  return (
    <InputContainer>
      <InputLabel
        htmlFor={id}
        hasError={Boolean(displayError)}
        required={required}
      >
        {label}
      </InputLabel>
      <StyledInput
        ref={ref}
        id={id}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        min={min}
        max={max}
        step={step}
        hasError={Boolean(displayError)}
        isFocused={isFocused}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-invalid={Boolean(displayError)}
        aria-describedby={displayError ? `${id}-error` : undefined}
        {...props}
      />
      {unit && (
        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
          {unit}
        </span>
      )}
      <ErrorMessage
        id={`${id}-error`}
        role="alert"
        style={{ opacity: displayError ? 1 : 0 }}
      >
        {displayError}
      </ErrorMessage>
    </InputContainer>
  );
});

Input.displayName = 'Input';

export default Input;