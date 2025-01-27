import { Edit, Check, Close } from '@mui/icons-material';
import {
  Box,
  IconButton,
  TextField,
  ClickAwayListener,
  CircularProgress,
  Tooltip,
  Alert,
  Snackbar,
} from '@mui/material';
import React, { useState, useCallback } from 'react';

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
}

export const InlineEdit: React.FC<InlineEditProps> = ({
  value: initialValue,
  onSave,
  label,
  disabled = false,
  children,
  type = 'text',
  validationRules = [],
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [value, setValue] = useState<string | number>(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const validate = useCallback(
    (val: string | number) => {
      for (const rule of validationRules) {
        if (!rule.validate(val)) {
          return rule.message;
        }
      }
      return null;
    },
    [validationRules]
  );

  const handleEdit = useCallback(() => {
    if (!disabled) {
      setIsEditing(true);
      setError(null);
    }
  }, [disabled]);

  const handleSave = useCallback(async () => {
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
    try {
      await onSave(value);
      setShowSuccess(true);
      setIsEditing(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save');
      setValue(initialValue);
    } finally {
      setIsLoading(false);
    }
  }, [value, initialValue, onSave, validate]);

  const handleCancel = useCallback(() => {
    setValue(initialValue);
    setIsEditing(false);
    setError(null);
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

  if (isEditing) {
    return (
      <Box sx={{ position: 'relative' }}>
        <ClickAwayListener onClickAway={handleSave}>
          <Box>
            <TextField
              autoFocus
              value={value}
              onChange={(e) => {
                const newValue =
                  type === 'number' ? Number(e.target.value) : e.target.value;
                setValue(newValue);
                const validationError = validate(newValue);
                setError(validationError);
              }}
              onKeyDown={handleKeyDown}
              label={label}
              variant="outlined"
              size="small"
              type={type}
              error={Boolean(error)}
              helperText={error}
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {isLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <>
                        <IconButton
                          size="small"
                          onClick={handleSave}
                          disabled={Boolean(error)}
                        >
                          <Check fontSize="small" color="success" />
                        </IconButton>
                        <IconButton size="small" onClick={handleCancel}>
                          <Close fontSize="small" color="error" />
                        </IconButton>
                      </>
                    )}
                  </Box>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'background.paper',
                },
              }}
            />
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
        }}
      >
        {children}
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
