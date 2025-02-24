/**
 * SpaceCalculator Component
 * Implements requirements F-001-RQ-001, F-001-RQ-002, F-001-RQ-003, and F-002-RQ-002
 * Provides real-time garden space calculation with enhanced validation and accessibility
 * @version 1.0.0
 */

import React, { useState, useCallback, useEffect } from 'react'; // ^18.2.0
import { 
  Box, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  FormHelperText, 
  InputLabel,
  Alert,
  Typography,
  Grid
} from '@mui/material'; // ^5.14.0
import { useTranslation } from 'react-i18next'; // ^12.0.0
import { debounce } from 'lodash'; // ^4.17.21

import { useGarden } from '../../../hooks/useGarden';
import { 
  Dimensions, 
  SoilType, 
  SunlightCondition, 
  MeasurementUnit,
  MIN_DIMENSION,
  MAX_DIMENSION
} from '../../../types/garden';

interface SpaceCalculatorProps {
  onCalculate?: (dimensions: Dimensions) => void;
  initialDimensions?: Dimensions;
}

interface ValidationState {
  length: string | null;
  width: string | null;
  soilType: string | null;
  sunlight: string | null;
}

interface CapacityWarning {
  level: 'info' | 'warning' | 'error';
  message: string;
}

export const SpaceCalculator: React.FC<SpaceCalculatorProps> = ({
  onCalculate,
  initialDimensions
}) => {
  const { t } = useTranslation();
  const { calculateGardenSpace, spaceCalculation } = useGarden();

  // State management
  const [dimensions, setDimensions] = useState<Dimensions>(initialDimensions || {
    length: 0,
    width: 0,
    unit: MeasurementUnit.FEET
  });
  const [soilType, setSoilType] = useState<SoilType | ''>('');
  const [sunlight, setSunlight] = useState<SunlightCondition | ''>('');
  const [validation, setValidation] = useState<ValidationState>({
    length: null,
    width: null,
    soilType: null,
    sunlight: null
  });
  const [capacityWarning, setCapacityWarning] = useState<CapacityWarning | null>(null);

  /**
   * Validates dimension input with enhanced error messaging
   */
  const validateDimension = useCallback((value: number, field: 'length' | 'width'): string | null => {
    if (isNaN(value)) {
      return t('validation.number_required');
    }
    if (value < MIN_DIMENSION) {
      return t('validation.min_dimension', { min: MIN_DIMENSION });
    }
    if (value > MAX_DIMENSION) {
      return t('validation.max_dimension', { max: MAX_DIMENSION });
    }
    return null;
  }, [t]);

  /**
   * Handles dimension input changes with debounced validation
   */
  const handleDimensionChange = debounce((
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value } = event.target;
    const numValue = parseFloat(value);
    const error = validateDimension(numValue, name as 'length' | 'width');

    setValidation(prev => ({
      ...prev,
      [name]: error
    }));

    if (!error) {
      setDimensions(prev => ({
        ...prev,
        [name]: numValue
      }));
    }
  }, 300);

  /**
   * Handles soil type selection with characteristics feedback
   */
  const handleSoilTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const value = event.target.value as SoilType;
    setSoilType(value);
    setValidation(prev => ({
      ...prev,
      soilType: null
    }));
  };

  /**
   * Handles sunlight condition selection with validation
   */
  const handleSunlightChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const value = event.target.value as SunlightCondition;
    setSunlight(value);
    setValidation(prev => ({
      ...prev,
      sunlight: null
    }));
  };

  /**
   * Calculates and updates capacity warnings based on space utilization
   */
  const updateCapacityWarning = useCallback((utilizationPercentage: number) => {
    if (utilizationPercentage > 90) {
      setCapacityWarning({
        level: 'error',
        message: t('warnings.space_critical')
      });
    } else if (utilizationPercentage > 75) {
      setCapacityWarning({
        level: 'warning',
        message: t('warnings.space_warning')
      });
    } else {
      setCapacityWarning({
        level: 'info',
        message: t('warnings.space_available')
      });
    }
  }, [t]);

  /**
   * Effect to trigger space calculation when all inputs are valid
   */
  useEffect(() => {
    const isValid = !Object.values(validation).some(error => error !== null);
    const hasAllValues = dimensions.length && dimensions.width && soilType && sunlight;

    if (isValid && hasAllValues) {
      const calculatedArea = dimensions.length * dimensions.width;
      updateCapacityWarning(spaceCalculation?.capacityPercentage || 0);
      onCalculate?.(dimensions);
    }
  }, [dimensions, soilType, sunlight, validation, updateCapacityWarning, onCalculate, spaceCalculation]);

  return (
    <Box component="form" noValidate aria-label={t('aria.space_calculator')}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            name="length"
            label={t('labels.length')}
            type="number"
            value={dimensions.length || ''}
            onChange={handleDimensionChange}
            error={!!validation.length}
            helperText={validation.length}
            inputProps={{
              min: MIN_DIMENSION,
              max: MAX_DIMENSION,
              'aria-label': t('aria.length_input')
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            name="width"
            label={t('labels.width')}
            type="number"
            value={dimensions.width || ''}
            onChange={handleDimensionChange}
            error={!!validation.width}
            helperText={validation.width}
            inputProps={{
              min: MIN_DIMENSION,
              max: MAX_DIMENSION,
              'aria-label': t('aria.width_input')
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!validation.soilType}>
            <InputLabel id="soil-type-label">{t('labels.soil_type')}</InputLabel>
            <Select
              labelId="soil-type-label"
              value={soilType}
              onChange={handleSoilTypeChange}
              aria-label={t('aria.soil_type_select')}
            >
              {Object.values(SoilType).map((type) => (
                <MenuItem key={type} value={type}>
                  {t(`soil_types.${type}`)}
                </MenuItem>
              ))}
            </Select>
            {validation.soilType && (
              <FormHelperText>{validation.soilType}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!validation.sunlight}>
            <InputLabel id="sunlight-label">{t('labels.sunlight')}</InputLabel>
            <Select
              labelId="sunlight-label"
              value={sunlight}
              onChange={handleSunlightChange}
              aria-label={t('aria.sunlight_select')}
            >
              {Object.values(SunlightCondition).map((condition) => (
                <MenuItem key={condition} value={condition}>
                  {t(`sunlight.${condition}`)}
                </MenuItem>
              ))}
            </Select>
            {validation.sunlight && (
              <FormHelperText>{validation.sunlight}</FormHelperText>
            )}
          </FormControl>
        </Grid>
      </Grid>

      {capacityWarning && (
        <Box mt={2}>
          <Alert 
            severity={capacityWarning.level}
            aria-live="polite"
          >
            {capacityWarning.message}
          </Alert>
        </Box>
      )}

      {spaceCalculation && (
        <Box mt={2}>
          <Typography variant="h6" gutterBottom>
            {t('labels.space_calculation')}
          </Typography>
          <Typography>
            {t('labels.total_area')}: {spaceCalculation.totalArea.toFixed(2)} {dimensions.unit}²
          </Typography>
          <Typography>
            {t('labels.usable_area')}: {spaceCalculation.usableArea.toFixed(2)} {dimensions.unit}²
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SpaceCalculator;