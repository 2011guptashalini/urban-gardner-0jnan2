import React, { useState, useCallback, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { debounce } from 'lodash';
import { ErrorBoundary } from 'react-error-boundary';
import Input from '../../common/Input/Input';
import Dropdown from '../../common/Dropdown/Dropdown';
import {
  MaintenanceTask,
  MaintenanceTaskRequest,
  TaskType,
  Frequency,
  TimeOfDay,
  Unit
} from '../../../types/maintenance';
import { useMaintenance } from '../../../hooks/useMaintenance';
import {
  FormContainer,
  FormSection,
  FormRow,
  ButtonGroup,
  SubmitButton,
  CancelButton,
  AIToggle,
  ErrorMessage,
  LoadingSpinner
} from './MaintenanceForm.styles';

interface MaintenanceFormProps {
  cropId: string;
  initialData?: MaintenanceTask;
  onSubmit: (task: MaintenanceTaskRequest) => void;
  onCancel: () => void;
  enableAI?: boolean;
  onAIError?: (error: Error) => void;
}

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({
  cropId,
  initialData,
  onSubmit,
  onCancel,
  enableAI = true,
  onAIError
}) => {
  // Form state management
  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<MaintenanceTaskRequest>({
    defaultValues: {
      cropId,
      taskType: initialData?.taskType || TaskType.Water,
      frequency: initialData?.frequency || Frequency.Daily,
      customFrequencyDays: initialData?.customFrequencyDays || null,
      amount: initialData?.amount || 0,
      unit: initialData?.unit || Unit.Milliliters,
      preferredTime: initialData?.preferredTime || TimeOfDay.Morning,
      useAiRecommendations: false
    }
  });

  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiConfidence, setAiConfidence] = useState(0);

  // Custom hook for maintenance operations
  const { createTask, updateTask, getAIRecommendations } = useMaintenance(cropId);

  // Watch form values for AI recommendations
  const watchedValues = watch();

  /**
   * Handles AI recommendation requests with debouncing
   */
  const handleAIRecommendation = useCallback(
    debounce(async (formData: Partial<MaintenanceTaskRequest>) => {
      if (!aiEnabled) return;

      try {
        setIsLoading(true);
        const recommendations = await getAIRecommendations();
        
        // Update form with AI recommendations
        if (recommendations && recommendations.length > 0) {
          const recommendation = recommendations[0];
          setValue('taskType', recommendation.taskType);
          setValue('frequency', recommendation.frequency);
          setValue('amount', recommendation.amount);
          setValue('unit', recommendation.unit);
          setValue('preferredTime', recommendation.preferredTime);
          setAiConfidence(recommendation.aiConfidence);
        }
      } catch (error) {
        console.error('AI recommendation failed:', error);
        onAIError?.(error);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [aiEnabled, getAIRecommendations, setValue, onAIError]
  );

  /**
   * Effect to trigger AI recommendations when form values change
   */
  useEffect(() => {
    if (aiEnabled && enableAI) {
      handleAIRecommendation(watchedValues);
    }
  }, [aiEnabled, enableAI, watchedValues, handleAIRecommendation]);

  /**
   * Handles form submission with optimistic updates
   */
  const onFormSubmit = async (data: MaintenanceTaskRequest) => {
    try {
      setIsLoading(true);
      
      const taskRequest: MaintenanceTaskRequest = {
        ...data,
        cropId,
        useAiRecommendations: aiEnabled
      };

      if (initialData?.id) {
        await updateTask(initialData.id, taskRequest);
      } else {
        await createTask(taskRequest);
      }

      onSubmit(taskRequest);
    } catch (error) {
      console.error('Task submission failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary
      fallback={<ErrorMessage>Failed to load maintenance form</ErrorMessage>}
      onError={onAIError}
    >
      <FormContainer onSubmit={handleSubmit(onFormSubmit)}>
        {enableAI && (
          <AIToggle>
            <Controller
              name="useAiRecommendations"
              control={control}
              render={({ field }) => (
                <Input
                  id="ai-toggle"
                  type="checkbox"
                  label="Use AI Recommendations"
                  checked={aiEnabled}
                  onChange={(e) => {
                    setAiEnabled(e.target.checked);
                    field.onChange(e.target.checked);
                  }}
                />
              )}
            />
            {aiEnabled && aiConfidence > 0 && (
              <span>AI Confidence: {(aiConfidence * 100).toFixed(1)}%</span>
            )}
          </AIToggle>
        )}

        <FormSection>
          <FormRow>
            <Controller
              name="taskType"
              control={control}
              rules={{ required: 'Task type is required' }}
              render={({ field }) => (
                <Dropdown
                  options={Object.values(TaskType)}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select task type"
                  error={errors.taskType?.message}
                />
              )}
            />
          </FormRow>

          <FormRow>
            <Controller
              name="frequency"
              control={control}
              rules={{ required: 'Frequency is required' }}
              render={({ field }) => (
                <Dropdown
                  options={Object.values(Frequency)}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select frequency"
                  error={errors.frequency?.message}
                />
              )}
            />
          </FormRow>

          {watch('frequency') === Frequency.Custom && (
            <FormRow>
              <Controller
                name="customFrequencyDays"
                control={control}
                rules={{ 
                  required: 'Custom frequency is required',
                  min: { value: 1, message: 'Minimum 1 day' },
                  max: { value: 90, message: 'Maximum 90 days' }
                }}
                render={({ field }) => (
                  <Input
                    id="custom-frequency"
                    type="number"
                    label="Custom Frequency (days)"
                    value={field.value?.toString() || ''}
                    onChange={field.onChange}
                    error={errors.customFrequencyDays?.message}
                  />
                )}
              />
            </FormRow>
          )}

          <FormRow>
            <Controller
              name="amount"
              control={control}
              rules={{ 
                required: 'Amount is required',
                min: { value: 0, message: 'Amount must be positive' }
              }}
              render={({ field }) => (
                <Input
                  id="amount"
                  type="number"
                  label="Amount"
                  value={field.value?.toString() || ''}
                  onChange={field.onChange}
                  error={errors.amount?.message}
                />
              )}
            />

            <Controller
              name="unit"
              control={control}
              rules={{ required: 'Unit is required' }}
              render={({ field }) => (
                <Dropdown
                  options={Object.values(Unit)}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select unit"
                  error={errors.unit?.message}
                />
              )}
            />
          </FormRow>

          <FormRow>
            <Controller
              name="preferredTime"
              control={control}
              rules={{ required: 'Preferred time is required' }}
              render={({ field }) => (
                <Dropdown
                  options={Object.values(TimeOfDay)}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select preferred time"
                  error={errors.preferredTime?.message}
                />
              )}
            />
          </FormRow>
        </FormSection>

        <ButtonGroup>
          <CancelButton type="button" onClick={onCancel}>
            Cancel
          </CancelButton>
          <SubmitButton type="submit" disabled={isLoading}>
            {isLoading ? <LoadingSpinner /> : initialData ? 'Update Task' : 'Create Task'}
          </SubmitButton>
        </ButtonGroup>
      </FormContainer>
    </ErrorBoundary>
  );
};

export default MaintenanceForm;