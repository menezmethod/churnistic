import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { z } from 'zod';

import { opportunitySchema } from '@/lib/validations/opportunity';
import { Opportunity } from '@/types/opportunity';
import { supabase } from '@/lib/supabase/client';

type NotificationState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
};

type ValidationErrors = {
  [key: string]: string;
};

// Helper function to update nested object values
function updateNestedValue(obj: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split('.');
  let current = obj as Record<string, unknown>;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    // Handle array indices
    if (key.match(/^\d+$/)) {
      const index = parseInt(key);
      if (!Array.isArray(current)) {
        current = {} as Record<string, unknown>;
      }
      if (!current[index]) {
        current[index] = {};
      }
      current = current[index] as Record<string, unknown>;
    } else {
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }
  }

  const lastKey = keys[keys.length - 1];
  if (lastKey.match(/^\d+$/)) {
    const index = parseInt(lastKey);
    if (!Array.isArray(current)) {
      current = {} as Record<string, unknown>;
    }
    current[index] = value;
  } else {
    current[lastKey] = value;
  }
}

export function useOpportunityForm(initialData?: Partial<Opportunity>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<Opportunity>({
    created_at: Date.now(),
    type: 'bank',
    name: '',
    offer_link: '',
    value: 0,
    status: 'approved',
    isStaged: false,
    logo: {
      type: 'url',
      url: '',
    },
    bonus: {
      title: '',
      description: '',
      requirements: {
        title: '',
        description: '',
        minimum_deposit: 0,
        trading_requirements: '',
        holding_period: '',
        spending_requirement: {
          amount: 0,
          timeframe: '',
        },
      },
      additional_info: '',
      tiers: [],
    },
    details: {
      monthly_fees: {
        amount: '',
        waiver_details: '',
      },
      account_type: '',
      account_category: 'personal',
      availability: {
        type: 'Nationwide',
        states: [],
      },
      credit_inquiry: '',
      credit_score: {
        min: 0,
        recommended: 0,
      },
      household_limit: '',
      early_closure_fee: '',
      chex_systems: '',
      expiration: '',
      under_5_24: {
        required: false,
        details: '',
      },
      annual_fees: {
        amount: '',
        waived_first_year: false,
      },
      foreign_transaction_fees: {
        percentage: '',
        waived: false,
      },
      minimum_credit_limit: '',
      rewards_structure: {
        base_rewards: '',
        bonus_categories: [],
        welcome_bonus: '',
      },
      options_trading: 'No',
      ira_accounts: 'No',
    },
    ...(initialData || {}),
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info',
  });

  const showNotification = (message: string, severity: NotificationState['severity']) => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  const validateField = (field: string, value: unknown) => {
    try {
      // Create a partial schema for the field
      const fieldSchema = z.object({
        [field]: z.any(),
      });

      // Validate the field
      fieldSchema.parse({ [field]: value });

      // Clear error if validation passes
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors[0]?.message || 'Invalid value';
        setErrors((prev) => ({
          ...prev,
          [field]: errorMessage,
        }));
        showNotification(errorMessage, 'error');
      }
      return false;
    }
  };

  const handleChange = (path: string, value: unknown) => {
    setFormData((prevData) => {
      const newData = { ...prevData };
      updateNestedValue(newData as Record<string, unknown>, path, value);
      return newData;
    });

    // Validate the field
    validateField(path, value);
  };

  const validateForm = () => {
    try {
      opportunitySchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: ValidationErrors = {};
        error.errors.forEach((err) => {
          if (err.path) {
            newErrors[err.path.join('.')] = err.message;
          }
        });
        setErrors(newErrors);
        showNotification('Please fix the validation errors before proceeding', 'error');
      }
      return false;
    }
  };

  // Use React Query's useMutation hook for creating opportunities
  const createOpportunityMutation = useMutation({
    mutationFn: async (data: Opportunity) => {
      const { data: result, error } = await supabase
        .from('opportunities')
        .insert([data])
        .select()
        .single();
        
      if (error) throw error;
      return result as Opportunity;
    },
    onSuccess: (result) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      showNotification('Opportunity created successfully!', 'success');
      
      // Redirect to the individual opportunity page after a short delay
      setTimeout(() => {
        router.push(`/opportunities/${result.id}`);
      }, 1500);
    },
    onError: (error) => {
      console.error('Error creating opportunity:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setSubmitError(errorMessage);
      showNotification(errorMessage, 'error');
    },
  });

  // Use React Query's useMutation hook for updating opportunities
  const updateOpportunityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Opportunity> }) => {
      const { data: result, error } = await supabase
        .from('opportunities')
        .update(data)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return result as Opportunity;
    },
    onSuccess: (result) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['opportunity', result.id] });
      showNotification('Opportunity updated successfully!', 'success');
    },
    onError: (error) => {
      console.error('Error updating opportunity:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setSubmitError(errorMessage);
      showNotification(errorMessage, 'error');
    },
  });

  const handleSubmit = async () => {
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    if (formData.id) {
      // Update existing opportunity
      await updateOpportunityMutation.mutateAsync({ 
        id: formData.id, 
        data: formData 
      });
    } else {
      // Create new opportunity
      await createOpportunityMutation.mutateAsync(formData);
    }
  };

  return {
    formData,
    errors,
    isSubmitting: createOpportunityMutation.isPending || updateOpportunityMutation.isPending,
    submitError,
    notification,
    handleChange,
    handleSubmit,
    hideNotification,
    validateField,
    validateForm,
  };
}
