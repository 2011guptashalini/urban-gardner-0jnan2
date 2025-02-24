import React, { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import Input from '../../common/Input/Input';
import Dropdown from '../../common/Dropdown/Dropdown';
import { 
  BagSize, 
  CreateCropRequest, 
  MIN_QUANTITY, 
  MIN_GROW_BAGS,
  SPACE_CAPACITY_WARNING_THRESHOLD 
} from '../../../types/crops';

// Form validation schema
const validationSchema = yup.object().shape({
  name: yup.string()
    .required('Crop name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters'),
  quantityNeeded: yup.number()
    .required('Daily quantity needed is required')
    .min(MIN_QUANTITY, `Minimum quantity is ${MIN_QUANTITY}g`)
    .typeError('Please enter a valid number'),
  growBags: yup.number()
    .required('Number of grow bags is required')
    .min(MIN_GROW_BAGS, `Minimum grow bags is ${MIN_GROW_BAGS}`)
    .typeError('Please enter a valid number'),
  bagSize: yup.string()
    .required('Bag size is required')
    .oneOf(Object.values(BagSize), 'Invalid bag size')
});

interface CropFormProps {
  gardenId: string;
  initialValues?: CreateCropRequest;
  handleSubmit: (data: CreateCropRequest) => Promise<void>;
  isLoading: boolean;
}

interface FormData {
  name: string;
  quantityNeeded: number;
  growBags: number;
  bagSize: BagSize;
}

/**
 * Form component for creating and editing crops with validation and space management
 * Implements requirements F-002-RQ-001 and F-002-RQ-002
 */
const CropForm: React.FC<CropFormProps> = ({
  gardenId,
  initialValues,
  handleSubmit,
  isLoading
}) => {
  const { 
    register, 
    handleSubmit: handleFormSubmit, 
    formState: { errors }, 
    setValue,
    watch,
    trigger 
  } = useForm<FormData>({
    defaultValues: initialValues || {
      name: '',
      quantityNeeded: MIN_QUANTITY,
      growBags: MIN_GROW_BAGS,
      bagSize: BagSize.EIGHT_INCH
    },
    mode: 'onChange'
  });

  // Watch form values for space capacity warning
  const formValues = watch();

  /**
   * Checks if current crop plan approaches or exceeds space capacity
   * Implements requirement F-002-RQ-002
   */
  const checkSpaceCapacity = useCallback((data: FormData): boolean => {
    const totalArea = data.growBags * Number(data.bagSize.replace('"', ''));
    // This is a simplified calculation - actual implementation would use garden dimensions
    return totalArea / 100 > SPACE_CAPACITY_WARNING_THRESHOLD;
  }, []);

  /**
   * Handles form submission with validation and space capacity check
   * Implements requirements F-002-RQ-001 and F-002-RQ-002
   */
  const onSubmit = useCallback(async (data: FormData) => {
    try {
      // Validate form data
      await validationSchema.validate(data);

      // Check space capacity
      const isOverCapacity = checkSpaceCapacity(data);
      if (isOverCapacity) {
        const proceed = window.confirm(
          'Warning: This plan exceeds 90% of available space. Would you like to proceed?'
        );
        if (!proceed) return;
      }

      // Transform and submit data
      const cropRequest: CreateCropRequest = {
        gardenId,
        name: data.name,
        quantityNeeded: data.quantityNeeded,
        growBags: data.growBags,
        bagSize: data.bagSize
      };

      await handleSubmit(cropRequest);
    } catch (error) {
      console.error('Form validation error:', error);
    }
  }, [gardenId, handleSubmit, checkSpaceCapacity]);

  // Update form when initialValues change
  useEffect(() => {
    if (initialValues) {
      Object.entries(initialValues).forEach(([key, value]) => {
        setValue(key as keyof FormData, value);
      });
      trigger();
    }
  }, [initialValues, setValue, trigger]);

  return (
    <form onSubmit={handleFormSubmit(onSubmit)} noValidate>
      <Input
        id="crop-name"
        label="Crop Name"
        type="text"
        error={errors.name?.message}
        {...register('name')}
        disabled={isLoading}
        required
      />

      <Input
        id="quantity-needed"
        label="Daily Quantity Needed (g)"
        type="number"
        min={MIN_QUANTITY}
        step="1"
        error={errors.quantityNeeded?.message}
        {...register('quantityNeeded')}
        disabled={isLoading}
        required
      />

      <Input
        id="grow-bags"
        label="Number of Grow Bags"
        type="number"
        min={MIN_GROW_BAGS}
        step="1"
        error={errors.growBags?.message}
        {...register('growBags')}
        disabled={isLoading}
        required
      />

      <Dropdown
        options={Object.values(BagSize)}
        value={formValues.bagSize}
        onChange={(value) => setValue('bagSize', value as BagSize)}
        placeholder="Select bag size"
        disabled={isLoading}
        error={errors.bagSize?.message}
        ariaLabel="Bag size selection"
      />

      {checkSpaceCapacity(formValues) && (
        <div role="alert" className="warning-message">
          Warning: This plan will utilize over 90% of available space
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? 'Saving...' : 'Save Crop'}
      </button>
    </form>
  );
};

export default CropForm;