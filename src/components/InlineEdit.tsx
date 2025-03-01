import { Edit, Check, Close, Refresh } from '@mui/icons-material';
import {
  Box,
  IconButton,
  TextField,
  ClickAwayListener,
  CircularProgress,
  Tooltip,
  Alert,
  Snackbar,
  Typography,
} from '@mui/material';
import React, { useState, useCallback, useEffect, useRef } from 'react';

interface ValidationRule {
  validate: (value: string | number) => boolean;
  message: string;
}

interface InlineEditProps {
  value: string | number;
  onSave: (value: string | number) => Promise<void>;
  label?: string;
  disabled?: boolean;
  children: React.ReactNode;
  type?: 'text' | 'number';
  validationRules?: ValidationRule[];
  formatValue?: (value: string | number) => string;
  maxRetries?: number;
  retryDelay?: number;
}

export const InlineEdit: React.FC<InlineEditProps> = ({
  value: initialValue,
  onSave,
  label,
  disabled = false,
  children,
  type = 'text',
  validationRules = [],
  formatValue,
  maxRetries = 3,
  retryDelay = 1000,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [value, setValue] = useState<string | number>(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  
  // Use a ref to track if a save operation is in progress
  const isSaving = useRef(false);
  
  // Update value when initialValue changes
  useEffect(() => {
    if (!isEditing) {
      setValue(initialValue);
    }
  }, [initialValue, isEditing]);

  const validate = useCallback(
    (val: string | number) => {
      if (validationRules.length === 0) return null;
      
      for (const rule of validationRules) {
        if (!rule.validate(val)) {
          return rule.message;
        }
      }
      return null;
    },
    [validationRules]
  );

  // Debounced validation to avoid triggering on every keystroke
  useEffect(() => {
    if (!isDirty) return;
    
    const timer = setTimeout(() => {
      const validationError = validate(value);
      setError(validationError);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [value, validate, isDirty]);

  const handleEdit = useCallback(() => {
    if (!disabled) {
      setIsEditing(true);
      setError(null);
      setIsDirty(false);
    }
  }, [disabled]);

  const handleSave = useCallback(async () => {
    // Prevent multiple simultaneous save operations
    if (isSaving.current) return;
    
    if (value === initialValue) {
      setIsEditing(false);
      return;
    }

    const validationError = validate(value);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);
    isSaving.current = true;
    
    try {
      await onSave(value);
      setShowSuccess(true);
      setIsEditing(false);
      setRetryCount(0);
      setIsDirty(false);
    } catch (error) {
      console.error("Error saving:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save';
      
      // Handle retry logic
      if (retryCount < maxRetries) {
        setError(`Save failed: ${errorMessage}. Retrying...`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          handleSave();
        }, retryDelay);
      } else {
        setError(`Save failed after ${maxRetries} attempts: ${errorMessage}`);
        // Don't reset value if error occurs, allow user to try again with their changes
      }
    } finally {
      setIsLoading(false);
      isSaving.current = false;
    }
  }, [value, initialValue, onSave, validate, retryCount, maxRetries, retryDelay]);

  const handleRetry = useCallback(() => {
    setRetryCount(0);
    setError(null);
    handleSave();
  }, [handleSave]);

  const handleCancel = useCallback(() => {
    setValue(initialValue);
    setIsEditing(false);
    setError(null);
    setRetryCount(0);
    setIsDirty(false);
  }, [initialValue]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSave();
      } else if (event.key === 'Escape') {
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  // Handle proper click-away behavior
  const handleClickAway = useCallback(() => {
    // Only save on click-away if there are no validation errors
    // and the value has changed
    if (value !== initialValue && !error) {
      handleSave();
    } else {
      handleCancel();
    }
  }, [handleSave, handleCancel, value, initialValue, error]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = type === 'number' ? Number(e.target.value) : e.target.value;
    setValue(newValue);
    setIsDirty(true);
  }, [type]);

  const displayValue = formatValue ? formatValue(initialValue) : initialValue;

  if (isEditing) {
    return (
      <Box sx={{ position: 'relative' }}>
        <ClickAwayListener onClickAway={handleClickAway}>
          <Box>
            <TextField
              autoFocus
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              label={label}
              variant="outlined"
              size="small"
              type={type}
              error={Boolean(error)}
              helperText={error}
              disabled={isLoading}
              fullWidth
              InputProps={{
                endAdornment: (
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    {isLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <>
                        <IconButton
                          size="small"
                          onClick={handleSave}
                          disabled={Boolean(error) || !isDirty}
                          color="primary"
                        >
                          <Check fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={handleCancel} color="error">
                          <Close fontSize="small" />
                        </IconButton>
                        {error && (
                          <IconButton size="small" onClick={handleRetry} color="warning">
                            <Refresh fontSize="small" />
                          </IconButton>
                        )}
                      </>
                    )}
                  </Box>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'background.paper',
                },
                minWidth: '200px',
              }}
            />
            {error && (
              <Typography 
                variant="caption" 
                color="error" 
                sx={{ display: 'block', mt: 1 }}
              >
                {error}
              </Typography>
            )}
          </Box>
        </ClickAwayListener>
      </Box>
    );
  }

  return (
    <>
      <Box
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleEdit}
        sx={{
          position: 'relative',
          cursor: disabled ? 'default' : 'pointer',
          '&:hover': {
            backgroundColor: disabled ? 'transparent' : 'action.hover',
          },
          borderRadius: 1,
          p: 1,
          transition: 'background-color 0.2s',
        }}
      >
        {children || displayValue}
        {isHovered && !disabled && (
          <Tooltip title="Click to edit">
            <IconButton
              size="small"
              sx={{
                position: 'absolute',
                right: -32,
                top: '50%',
                transform: 'translateY(-50%)',
                opacity: 0.7,
                '&:hover': {
                  opacity: 1,
                },
              }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled">
          Successfully saved changes
        </Alert>
      </Snackbar>
    </>
  );
};
