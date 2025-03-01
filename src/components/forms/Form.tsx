'use client';

import React, { useState, useRef, FormEvent, ReactNode } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Alert,
  Typography,
  Paper,
  Slide,
} from '@mui/material';
import { z } from 'zod';

export interface FormProps<T> {
  onSubmit: (data: T) => Promise<void>;
  children: ReactNode;
  title?: string;
  submitLabel?: string;
  resetLabel?: string;
  schema?: z.ZodType<T>;
  initialValues?: Partial<T>;
  successMessage?: string;
  showReset?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  submitProps?: React.ComponentProps<typeof Button>;
  resetProps?: React.ComponentProps<typeof Button>;
  isPaper?: boolean;
}

export function Form<T extends Record<string, any>>({
  onSubmit,
  children,
  title,
  submitLabel = 'Submit',
  resetLabel = 'Reset',
  schema,
  initialValues,
  successMessage = 'Form submitted successfully!',
  showReset = true,
  disabled = false,
  fullWidth = true,
  submitProps,
  resetProps,
  isPaper = true,
}: FormProps<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const submissionTimeRef = useRef<number>(0);
  
  // Prevent duplicate submissions in quick succession (debounce)
  const MIN_SUBMISSION_INTERVAL = 1000; // 1 second

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Reset states
    setError(null);
    setSuccess(false);
    setValidationErrors({});
    
    // Prevent double submissions
    const now = Date.now();
    if (now - submissionTimeRef.current < MIN_SUBMISSION_INTERVAL) {
      return;
    }
    submissionTimeRef.current = now;
    
    // Handle form data
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries()) as unknown as T;
    
    // Validate with Zod schema if provided
    if (schema) {
      try {
        schema.parse(data);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          const errors: Record<string, string> = {};
          validationError.errors.forEach((err) => {
            const path = err.path.join('.');
            errors[path] = err.message;
          });
          setValidationErrors(errors);
          setError('Please fix the validation errors');
          return;
        }
      }
    }
    
    // Submit the form
    setIsSubmitting(true);
    
    try {
      await onSubmit(data);
      setSuccess(true);
      setError(null);
      
      // Reset the form if needed
      if (initialValues) {
        formRef.current?.reset();
      }
      
      // After success, hide the success message after a delay
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleReset = () => {
    formRef.current?.reset();
    setError(null);
    setSuccess(false);
    setValidationErrors({});
  };
  
  // Inject validation errors as props to children
  const childrenWithValidation = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.props.name) {
      return React.cloneElement(child, {
        error: validationErrors[child.props.name],
      });
    }
    return child;
  });
  
  const formContent = (
    <Box 
      component="form" 
      onSubmit={handleSubmit} 
      ref={formRef}
      sx={{ width: fullWidth ? '100%' : 'auto' }}
      noValidate
    >
      {title && (
        <Typography variant="h5" component="h2" gutterBottom>
          {title}
        </Typography>
      )}
      
      {error && (
        <Slide direction="down" in={!!error} mountOnEnter unmountOnExit>
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        </Slide>
      )}
      
      {success && (
        <Slide direction="down" in={success} mountOnEnter unmountOnExit>
          <Alert 
            severity="success" 
            sx={{ mb: 2 }}
            onClose={() => setSuccess(false)}
          >
            {successMessage}
          </Alert>
        </Slide>
      )}
      
      {childrenWithValidation}
      
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting || disabled}
          sx={{ position: 'relative' }}
          {...submitProps}
        >
          {isSubmitting && (
            <CircularProgress
              size={24}
              sx={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                marginLeft: '-12px',
                marginTop: '-12px',
              }}
            />
          )}
          <span style={{ visibility: isSubmitting ? 'hidden' : 'visible' }}>
            {submitLabel}
          </span>
        </Button>
        
        {showReset && (
          <Button
            type="button"
            variant="outlined"
            onClick={handleReset}
            disabled={isSubmitting || disabled}
            {...resetProps}
          >
            {resetLabel}
          </Button>
        )}
      </Box>
    </Box>
  );
  
  if (isPaper) {
    return (
      <Paper 
        elevation={2} 
        sx={{ p: 3, borderRadius: 2 }}
      >
        {formContent}
      </Paper>
    );
  }
  
  return formContent;
} 