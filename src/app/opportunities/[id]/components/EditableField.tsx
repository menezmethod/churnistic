import {
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  AutoFixHigh as AIIcon,
} from '@mui/icons-material';
import { Box, IconButton, TextField, Typography, Tooltip } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import React, { useState, useRef, useEffect } from 'react';

interface EditableFieldProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  fieldName: string;
  multiline?: boolean;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2';
  canEdit?: boolean;
  aiEnabled?: boolean;
  onAIEnhance?: (value: string) => Promise<string>;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  value,
  onSave,
  fieldName,
  multiline = false,
  variant = 'body1',
  canEdit = false,
  aiEnabled = false,
  onAIEnhance,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
      setEditValue(value); // Reset to original value
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIEnhance = async () => {
    if (!onAIEnhance) return;

    setIsLoading(true);
    try {
      const enhancedValue = await onAIEnhance(editValue);
      setEditValue(enhancedValue);
    } catch (error) {
      console.error('AI enhancement failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value);
    }
  };

  if (isEditing) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          fullWidth
          multiline={multiline}
          minRows={multiline ? 3 : 1}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          inputRef={inputRef}
          disabled={isLoading}
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'background.paper',
            },
          }}
        />
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {aiEnabled && onAIEnhance && (
            <Tooltip title="AI Enhance">
              <IconButton
                onClick={handleAIEnhance}
                disabled={isLoading}
                size="small"
                sx={{
                  color: theme.palette.primary.main,
                  '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) },
                }}
              >
                <AIIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Save">
            <IconButton
              onClick={handleSave}
              disabled={isLoading}
              size="small"
              sx={{
                color: theme.palette.success.main,
                '&:hover': { backgroundColor: alpha(theme.palette.success.main, 0.1) },
              }}
            >
              <CheckIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Cancel">
            <IconButton
              onClick={() => {
                setIsEditing(false);
                setEditValue(value);
              }}
              disabled={isLoading}
              size="small"
              sx={{
                color: theme.palette.error.main,
                '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        '&:hover .edit-button': {
          opacity: 1,
        },
      }}
    >
      <Typography variant={variant}>{value}</Typography>
      {canEdit && (
        <Tooltip title={`Edit ${fieldName}`}>
          <IconButton
            onClick={() => setIsEditing(true)}
            size="small"
            className="edit-button"
            sx={{
              opacity: 0,
              transition: 'opacity 0.2s',
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              },
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};
