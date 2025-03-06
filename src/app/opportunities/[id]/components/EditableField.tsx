import {
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import {
  Box,
  IconButton,
  MenuItem,
  Select,
  TextField,
  alpha,
  useTheme,
  SxProps,
  Theme,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { useEffect, useState } from 'react';

export interface EditableFieldProps {
  field: {
    value: string | number | boolean | null;
    isEditing: boolean;
    type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'multiline' | 'title';
    options?: string[];
    optionLabels?: Record<string, string>;
  };
  onEdit: (value: string | number | boolean) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  className?: string;
  sx?: SxProps<Theme>;
  editable?: boolean;
  hideIcon?: boolean;
  isUpdating?: boolean;
  fieldKey?: string;
  placeholder?: string;
}

export const EditableField = ({
  field,
  onEdit,
  onStartEdit,
  onCancelEdit,
  className,
  sx = {},
  editable = true,
  hideIcon = false,
  isUpdating = false,
  fieldKey,
  placeholder,
}: EditableFieldProps) => {
  const theme = useTheme();
  const [localValue, setLocalValue] = useState<string | number | boolean>(
    field.value ?? ''
  );
  const [isHovered, setIsHovered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Define editor styles
  const editorStyles = {
    '.MuiOutlinedInput-root': {
      fontSize: '0.875rem',
      backgroundColor: alpha(theme.palette.background.default, 0.4),
    },
    '.MuiInputBase-input': {
      padding: '4px 8px',
    },
    width: '100%',
  };

  // Mouse event handlers for hover state
  const handleMouseEnter = () => {
    if (editable) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  useEffect(() => {
    setLocalValue(field.value ?? '');
  }, [field.value]);

  const validateValue = (value: string | number | boolean): boolean => {
    if (field.type === 'number' && typeof value === 'number') {
      if (isNaN(value)) {
        setError('Please enter a valid number');
        return false;
      }
    }

    setError(null);
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = field.type === 'number' ? Number(e.target.value) : e.target.value;
    setLocalValue(value);
    validateValue(value);
  };

  const handleSelectChange = (e: { target: { value: string } }) => {
    setLocalValue(e.target.value);
    validateValue(e.target.value);
  };

  const handleSubmit = () => {
    console.log(`Submitting edit for field ${fieldKey || 'unknown'}:`, {
      oldValue: field.value,
      newValue: localValue,
    });

    if (validateValue(localValue)) {
      onEdit(localValue);
    }
  };

  const handleStartEdit = () => {
    if (!editable) return;
    onStartEdit();
  };

  const handleCancel = () => {
    onCancelEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <Box className={className} sx={sx}>
      {field.isEditing ? (
        <Box sx={{ position: 'relative' }}>
          {field.type === 'select' && field.options ? (
            <Select
              fullWidth
              size="small"
              value={String(localValue)}
              onChange={handleSelectChange}
              sx={{
                '.MuiSelect-select': {
                  py: 1,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                },
                ...editorStyles,
              }}
              displayEmpty
              autoFocus
              error={!!error}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {field.options.map((option) => (
                <MenuItem key={option} value={option}>
                  {field.optionLabels?.[option] || option}
                </MenuItem>
              ))}
            </Select>
          ) : field.type === 'multiline' ? (
            <TextField
              fullWidth
              multiline
              minRows={2}
              maxRows={4}
              value={localValue}
              onChange={handleChange}
              variant="outlined"
              size="small"
              onKeyDown={handleKeyDown}
              placeholder={placeholder || `Enter ${fieldKey || 'value'}...`}
              autoFocus
              sx={editorStyles}
              error={!!error}
              helperText={error}
            />
          ) : (
            <TextField
              fullWidth
              value={localValue}
              onChange={handleChange}
              variant="outlined"
              size="small"
              onKeyDown={handleKeyDown}
              placeholder={placeholder || `Enter ${fieldKey || 'value'}...`}
              autoFocus
              type={field.type === 'number' ? 'number' : 'text'}
              InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
              sx={editorStyles}
              error={!!error}
              helperText={error}
            />
          )}
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <IconButton
              size="small"
              onClick={handleCancel}
              sx={{ color: 'text.secondary' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleSubmit}
              sx={{
                color: 'primary.main',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                },
              }}
            >
              <CheckIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      ) : (
        <Box
          onClick={editable ? handleStartEdit : undefined}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          sx={{
            position: 'relative',
            cursor: editable ? 'pointer' : 'default',
            display: 'inline-block',
            minHeight: '1.5em',
            padding: field.type === 'title' ? '0' : '0',
            borderRadius: '4px',
            transition: 'all 0.2s',
            fontWeight: field.type === 'title' ? 600 : 'normal',
            fontSize: field.type === 'title' ? '1.25rem' : '0.875rem',
            lineHeight: field.type === 'title' ? 1.6 : 1.4,
            color: field.value ? 'text.primary' : 'text.secondary',
            border: '1px solid transparent',
            '&:hover': {
              backgroundColor: editable
                ? alpha(theme.palette.primary.main, 0.04)
                : 'transparent',
              border: editable
                ? `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                : '1px solid transparent',
            },
          }}
        >
          {field.value !== null && field.value !== undefined && field.value !== '' ? (
            <>{field.value}</>
          ) : (
            <Box component="span" sx={{ fontStyle: 'italic', opacity: 0.6 }}>
              {placeholder || `Add ${fieldKey || 'value'}...`}
            </Box>
          )}
          {!hideIcon && editable && isHovered && (
            <Tooltip title="Edit" placement="top">
              <EditIcon
                sx={{
                  fontSize: '0.875rem',
                  ml: 0.5,
                  verticalAlign: 'middle',
                  opacity: 0.6,
                  color: 'primary.main',
                  transition: 'all 0.2s',
                  '&:hover': {
                    opacity: 1,
                    transform: 'scale(1.1)',
                  },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartEdit();
                }}
              />
            </Tooltip>
          )}
        </Box>
      )}
      {isUpdating && (
        <CircularProgress
          size={16}
          sx={{ ml: 1, verticalAlign: 'middle', color: 'primary.main' }}
        />
      )}
    </Box>
  );
};
