import React, { useCallback, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import debounce from 'lodash/debounce';
import Input from '../../common/Input/Input';
import Dropdown from '../../common/Dropdown/Dropdown';
import {
  GARDEN_DIMENSION_LIMITS,
  SOIL_TYPES,
  SUNLIGHT_CONDITIONS,
  SOIL_CHARACTERISTICS,
  SUNLIGHT_CHARACTERISTICS,
  GARDEN_VALIDATION_MESSAGES
} from '../../../constants/garden';

interface GardenFormProps {
  garden?: Garden;
  onSubmit: (data: CreateGardenRequest | UpdateGardenRequest) => Promise<void>;
  isLoading?: boolean;
  defaultUnit?: 'feet' | 'meters';
  showHelp?: boolean;
  onValidationError?: (errors: ValidationErrors) => void;
}

interface GardenFormData {
  length: string;
  width: string;
  unit: 'feet' | 'meters';
  soilType: keyof typeof SOIL_TYPES;
  sunlightCondition: keyof typeof SUNLIGHT_CONDITIONS;
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

/**
 * GardenForm component for creating and editing garden spaces
 * Implements requirements F-001-RQ-001, F-001-RQ-002, and F-001-RQ-003
 */
const GardenForm: React.FC<GardenFormProps> = ({
  garden,
  onSubmit,
  isLoading = false,
  defaultUnit = 'feet',
  showHelp = true,
  onValidationError
}) => {
  const [unit, setUnit] = useState<'feet' | 'meters'>(defaultUnit);
  
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty }
  } = useForm<GardenFormData>({
    defaultValues: {
      length: garden?.length?.toString() || '',
      width: garden?.width?.toString() || '',
      unit: defaultUnit,
      soilType: garden?.soilType || undefined,
      sunlightCondition: garden?.sunlightCondition || undefined
    }
  });

  const watchLength = watch('length');
  const watchWidth = watch('width');

  /**
   * Validates garden dimensions and calculates area
   */
  const validateDimensions = useCallback((
    length: number,
    width: number,
    currentUnit: 'feet' | 'meters'
  ): ValidationResult => {
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};
    
    const conversionFactor = currentUnit === 'meters' ? 1 : 0.3048;
    const lengthInMeters = length * conversionFactor;
    const widthInMeters = width * conversionFactor;
    const areaInMeters = lengthInMeters * widthInMeters;

    if (lengthInMeters < GARDEN_DIMENSION_LIMITS.MIN_LENGTH) {
      errors.length = GARDEN_VALIDATION_MESSAGES.DIMENSION_TOO_SMALL;
    }
    if (lengthInMeters > GARDEN_DIMENSION_LIMITS.MAX_LENGTH) {
      errors.length = GARDEN_VALIDATION_MESSAGES.DIMENSION_TOO_LARGE;
    }
    if (widthInMeters < GARDEN_DIMENSION_LIMITS.MIN_WIDTH) {
      errors.width = GARDEN_VALIDATION_MESSAGES.DIMENSION_TOO_SMALL;
    }
    if (widthInMeters > GARDEN_DIMENSION_LIMITS.MAX_WIDTH) {
      errors.width = GARDEN_VALIDATION_MESSAGES.DIMENSION_TOO_LARGE;
    }
    if (areaInMeters < GARDEN_DIMENSION_LIMITS.MIN_AREA) {
      warnings.area = GARDEN_VALIDATION_MESSAGES.AREA_TOO_SMALL;
    }
    if (areaInMeters > GARDEN_DIMENSION_LIMITS.MAX_AREA) {
      errors.area = GARDEN_VALIDATION_MESSAGES.AREA_TOO_LARGE;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    };
  }, []);

  /**
   * Handles unit conversion between feet and meters
   */
  const handleUnitChange = useCallback((newUnit: 'feet' | 'meters') => {
    const length = parseFloat(watchLength);
    const width = parseFloat(watchWidth);
    
    if (!isNaN(length) && !isNaN(width)) {
      const conversionFactor = newUnit === 'meters' ? 0.3048 : 3.28084;
      setValue('length', (length * conversionFactor).toFixed(2));
      setValue('width', (width * conversionFactor).toFixed(2));
    }
    
    setUnit(newUnit);
  }, [watchLength, watchWidth, setValue]);

  /**
   * Debounced validation to prevent excessive calculations
   */
  const debouncedValidation = useCallback(
    debounce((length: string, width: string) => {
      const numLength = parseFloat(length);
      const numWidth = parseFloat(width);
      
      if (!isNaN(numLength) && !isNaN(numWidth)) {
        const validationResult = validateDimensions(numLength, numWidth, unit);
        if (!validationResult.isValid && onValidationError) {
          onValidationError(validationResult.errors);
        }
      }
    }, 300),
    [validateDimensions, unit, onValidationError]
  );

  useEffect(() => {
    debouncedValidation(watchLength, watchWidth);
    return () => debouncedValidation.cancel();
  }, [watchLength, watchWidth, debouncedValidation]);

  const onFormSubmit = handleSubmit(async (data) => {
    const numLength = parseFloat(data.length);
    const numWidth = parseFloat(data.width);
    
    const validation = validateDimensions(numLength, numWidth, unit);
    if (!validation.isValid) {
      if (onValidationError) {
        onValidationError(validation.errors);
      }
      return;
    }

    const gardenData = {
      length: numLength,
      width: numWidth,
      unit,
      soilType: data.soilType,
      sunlightCondition: data.sunlightCondition
    };

    await onSubmit(garden ? { ...gardenData, id: garden.id } : gardenData);
  });

  return (
    <form onSubmit={onFormSubmit} noValidate>
      <div className="dimensions-container">
        <Controller
          name="length"
          control={control}
          rules={{
            required: 'Length is required',
            pattern: {
              value: /^\d*\.?\d*$/,
              message: 'Please enter a valid number'
            }
          }}
          render={({ field }) => (
            <Input
              id="garden-length"
              label={`Length (${unit})`}
              type="number"
              {...field}
              error={errors.length?.message}
              min={GARDEN_DIMENSION_LIMITS.MIN_LENGTH}
              max={GARDEN_DIMENSION_LIMITS.MAX_LENGTH}
              step="0.1"
              required
            />
          )}
        />

        <Controller
          name="width"
          control={control}
          rules={{
            required: 'Width is required',
            pattern: {
              value: /^\d*\.?\d*$/,
              message: 'Please enter a valid number'
            }
          }}
          render={({ field }) => (
            <Input
              id="garden-width"
              label={`Width (${unit})`}
              type="number"
              {...field}
              error={errors.width?.message}
              min={GARDEN_DIMENSION_LIMITS.MIN_WIDTH}
              max={GARDEN_DIMENSION_LIMITS.MAX_WIDTH}
              step="0.1"
              required
            />
          )}
        />

        <Dropdown
          options={['feet', 'meters']}
          value={unit}
          onChange={handleUnitChange}
          placeholder="Select unit"
          ariaLabel="Measurement unit"
        />
      </div>

      <Controller
        name="soilType"
        control={control}
        rules={{ required: 'Soil type is required' }}
        render={({ field }) => (
          <Dropdown
            options={Object.keys(SOIL_TYPES)}
            value={field.value}
            onChange={field.onChange}
            placeholder="Select soil type"
            error={errors.soilType?.message}
            renderOption={(option) => (
              <div>
                <div>{SOIL_TYPES[option as keyof typeof SOIL_TYPES]}</div>
                {showHelp && (
                  <div className="help-text">
                    Best for: {SOIL_CHARACTERISTICS[option as keyof typeof SOIL_TYPES].bestFor.join(', ')}
                  </div>
                )}
              </div>
            )}
          />
        )}
      />

      <Controller
        name="sunlightCondition"
        control={control}
        rules={{ required: 'Sunlight condition is required' }}
        render={({ field }) => (
          <Dropdown
            options={Object.keys(SUNLIGHT_CONDITIONS)}
            value={field.value}
            onChange={field.onChange}
            placeholder="Select sunlight condition"
            error={errors.sunlightCondition?.message}
            renderOption={(option) => (
              <div>
                <div>{SUNLIGHT_CONDITIONS[option as keyof typeof SUNLIGHT_CONDITIONS]}</div>
                {showHelp && (
                  <div className="help-text">
                    {SUNLIGHT_CHARACTERISTICS[option as keyof typeof SUNLIGHT_CONDITIONS].description}
                  </div>
                )}
              </div>
            )}
          />
        )}
      />

      <button
        type="submit"
        disabled={isLoading || !isDirty}
        aria-busy={isLoading}
      >
        {isLoading ? 'Saving...' : garden ? 'Update Garden' : 'Create Garden'}
      </button>
    </form>
  );
};

export default GardenForm;