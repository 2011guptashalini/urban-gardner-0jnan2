import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import Input from '../../common/Input/Input';
import { BagSize } from '../../../types/crops';
import { useCrops } from '../../../hooks/useCrops';

// Constants for validation and calculations
const MIN_QUANTITY = 1;
const MAX_QUANTITY = 100;
const YIELD_ACCURACY_THRESHOLD = 0.1; // 10% accuracy requirement
const CAPACITY_WARNING_THRESHOLD = 0.9; // 90% capacity warning
const CALCULATION_RETRY_ATTEMPTS = 3;

interface YieldCalculatorProps {
  cropId: string;
  onYieldCalculated: (yield_: number) => void;
  onCapacityWarning: (warning: string) => void;
  onError: (error: string) => void;
}

/**
 * YieldCalculator component for calculating and displaying estimated crop yields
 * Implements requirements F-002-RQ-001 and F-002-RQ-002
 * @version 1.0.0
 */
const YieldCalculator: React.FC<YieldCalculatorProps> = ({
  cropId,
  onYieldCalculated,
  onCapacityWarning,
  onError
}) => {
  // State management
  const [bagSize, setBagSize] = useState<BagSize>(BagSize.EIGHT_INCH);
  const [quantity, setQuantity] = useState<number>(MIN_QUANTITY);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Custom hook for crop operations
  const { calculateYield, validateSpaceCapacity } = useCrops();

  /**
   * Memoized bag size options for consistent rendering
   */
  const bagSizeOptions = useMemo(() => [
    { value: BagSize.EIGHT_INCH, label: '8" (20 cm)' },
    { value: BagSize.TEN_INCH, label: '10" (25 cm)' },
    { value: BagSize.TWELVE_INCH, label: '12" (30 cm)' },
    { value: BagSize.FOURTEEN_INCH, label: '14" (35 cm)' }
  ], []);

  /**
   * Debounced yield calculation to prevent excessive API calls
   */
  const debouncedCalculateYield = useCallback(
    debounce(async () => {
      await calculateEstimatedYield();
    }, 500),
    [bagSize, quantity]
  );

  /**
   * Handles grow bag size changes with validation
   */
  const handleBagSizeChange = useCallback((value: string) => {
    if (Object.values(BagSize).includes(value as BagSize)) {
      setBagSize(value as BagSize);
      debouncedCalculateYield();
    } else {
      onError('Invalid bag size selected');
    }
  }, [debouncedCalculateYield, onError]);

  /**
   * Manages grow bag quantity changes with capacity validation
   */
  const handleQuantityChange = useCallback((value: string) => {
    const numValue = parseInt(value, 10);
    
    if (isNaN(numValue) || numValue < MIN_QUANTITY || numValue > MAX_QUANTITY) {
      onError(`Quantity must be between ${MIN_QUANTITY} and ${MAX_QUANTITY}`);
      return;
    }

    // Validate space capacity
    const spaceUtilization = validateSpaceCapacity(numValue, bagSize);
    if (spaceUtilization > CAPACITY_WARNING_THRESHOLD) {
      onCapacityWarning('Garden space capacity is approaching its limit');
    }

    setQuantity(numValue);
    debouncedCalculateYield();
  }, [bagSize, debouncedCalculateYield, onCapacityWarning, onError, validateSpaceCapacity]);

  /**
   * Calculates estimated yield with accuracy validation and retry mechanism
   */
  const calculateEstimatedYield = async () => {
    if (isLoading || !bagSize || !quantity) return;

    setIsLoading(true);
    try {
      const result = await calculateYield(cropId);
      
      if (result.isErr()) {
        throw new Error(result.error.message);
      }

      const yield_ = result.value;
      const accuracy = Math.abs(yield_ - quantity) / quantity;

      if (accuracy > YIELD_ACCURACY_THRESHOLD) {
        if (retryCount < CALCULATION_RETRY_ATTEMPTS) {
          setRetryCount(prev => prev + 1);
          setTimeout(calculateEstimatedYield, 1000);
          return;
        }
        onError(`Yield calculation accuracy exceeds ${YIELD_ACCURACY_THRESHOLD * 100}% threshold`);
      } else {
        onYieldCalculated(yield_);
        setRetryCount(0);
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to calculate yield');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset retry count when inputs change
  useEffect(() => {
    setRetryCount(0);
  }, [bagSize, quantity]);

  return (
    <div className="yield-calculator">
      <Input
        id="bag-size"
        name="bagSize"
        label="Grow Bag Size"
        type="text"
        value={bagSize}
        onChange={handleBagSizeChange}
        disabled={isLoading}
        required
        validationRules={[
          {
            type: 'custom',
            value: (value: string) => Object.values(BagSize).includes(value as BagSize),
            message: 'Please select a valid bag size'
          }
        ]}
      />

      <Input
        id="quantity"
        name="quantity"
        label="Number of Grow Bags"
        type="number"
        value={quantity.toString()}
        onChange={handleQuantityChange}
        disabled={isLoading}
        required
        min={MIN_QUANTITY}
        max={MAX_QUANTITY}
        validationRules={[
          {
            type: 'min',
            value: MIN_QUANTITY,
            message: `Minimum quantity is ${MIN_QUANTITY}`
          },
          {
            type: 'max',
            value: MAX_QUANTITY,
            message: `Maximum quantity is ${MAX_QUANTITY}`
          }
        ]}
      />

      {isLoading && (
        <div className="calculation-status">
          Calculating yield{retryCount > 0 ? ` (Attempt ${retryCount}/${CALCULATION_RETRY_ATTEMPTS})` : ''}...
        </div>
      )}
    </div>
  );
};

export default YieldCalculator;