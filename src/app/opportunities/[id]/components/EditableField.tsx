import { Check, Close, Edit as EditIcon } from '@mui/icons-material';
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
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export interface EditableFieldProps {
  field: {
    value: string | number | boolean | null;
    isEditing: boolean;
    type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'multiline' | 'title';
    options?: string[];
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
}

export const EditableField = ({
  field,
  onEdit,
  onStartEdit,
  onCancelEdit,
  className,
  editable = true,
  hideIcon = false,
  isUpdating = false,
  fieldKey,
}: EditableFieldProps) => {
  const theme = useTheme();
  const [localValue, setLocalValue] = useState<string | number | boolean>(
    field.value ?? ''
  );
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalValue(field.value ?? '');
    setIsEditing(field.isEditing);
  }, [field.value, field.isEditing]);

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
      setIsEditing(false);
    }
  };

  const handleStartEdit = () => {
    if (!editable) return;
    setIsEditing(true);
    setError(null);
    onStartEdit();
  };

  const handleCancel = () => {
    setIsEditing(false);
    setLocalValue(field.value ?? '');
    setError(null);
    onCancelEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (field.type !== 'multiline') {
        e.preventDefault();
        handleSubmit();
      }
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const renderEditControl = () => {
    const commonProps = {
      value: localValue,
      onKeyDown: handleKeyDown,
      autoFocus: true,
      size: 'small' as const,
      fullWidth: true,
      error: Boolean(error),
      helperText: error,
      sx: {
        '& .MuiInputBase-root': {
          bgcolor: alpha(theme.palette.background.paper, 0.6),
          backdropFilter: 'blur(8px)',
          pr: '76px',
          fontSize: {
            xs: field.type === 'title' ? 'clamp(2.5rem, 6vw, 3.5rem)' : '0.875rem',
            sm: field.type === 'title' ? 'clamp(3rem, 7vw, 4.5rem)' : 'inherit',
          },
          fontWeight: field.type === 'title' ? 600 : 'inherit',
          minWidth: 'unset',
          width: '100%',
          borderRadius: 2,
          border: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.1),
          transition: 'all 0.2s ease-in-out',
          '&:hover, &:focus-within': {
            borderColor: alpha(theme.palette.primary.main, 0.3),
            bgcolor: alpha(theme.palette.background.paper, 0.8),
          },
          height: 'auto',
          minHeight: '40px',
          alignItems: 'flex-start',
          py: field.type === 'title' ? 0.5 : 0,
          lineHeight: field.type === 'title' ? 1.2 : 1.5,
        },
        '& .MuiInputBase-input': {
          py: { xs: 1, sm: 0.5 },
          px: 1.5,
          minHeight: 'auto',
          fontSize: 'inherit',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: field.type === 'multiline' ? 'unset' : 1,
          WebkitBoxOrient: 'vertical',
        },
        '& .MuiOutlinedInput-notchedOutline': {
          border: 'none',
        },
      },
    };

    if (field.type === 'select' && field.options) {
      return (
        <Select
          {...commonProps}
          value={String(localValue)}
          onChange={handleSelectChange}
          MenuProps={{
            PaperProps: {
              sx: {
                bgcolor: alpha(theme.palette.background.paper, 0.9),
                backdropFilter: 'blur(8px)',
                borderRadius: 2,
                border: '1px solid',
                borderColor: alpha(theme.palette.divider, 0.1),
                minWidth: 'unset !important',
                width: 'calc(100% - 32px)',
                maxWidth: '100%',
                overflow: 'auto',
              },
            },
          }}
        >
          {field.options.map((option: string) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      );
    }

    return (
      <TextField
        {...commonProps}
        type={field.type === 'number' ? 'number' : 'text'}
        multiline={field.type === 'multiline'}
        minRows={field.type === 'multiline' ? 3 : 1}
        onChange={handleChange}
        placeholder={field.type === 'multiline' ? 'Enter text here...' : ''}
      />
    );
  };

  return (
    <Box
      component={motion.div}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        position: 'relative',
        display: 'block',
        width: '100%',
        fontSize: field.type === 'title' ? '1.5rem' : 'inherit',
        fontWeight: field.type === 'title' ? 600 : 'inherit',
        minHeight: 'auto',
        '&:hover': {
          '& .edit-button': {
            opacity: hideIcon ? 0 : 1,
            visibility: hideIcon ? 'hidden' : 'visible',
          },
        },
      }}
      className={className}
      data-field-key={fieldKey}
    >
      {isEditing ? (
        <Box sx={{ position: 'relative' }}>
          {isUpdating && (
            <CircularProgress
              size={20}
              sx={{
                position: 'absolute',
                right: 40,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 3,
              }}
            />
          )}
          {renderEditControl()}
          <Box
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              gap: 0.5,
              zIndex: 2,
              backdropFilter: 'blur(8px)',
              bgcolor: alpha(theme.palette.background.paper, 0.8),
              p: 0.5,
              borderRadius: 1,
              boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.1)}`,
            }}
          >
            <Tooltip title="Save changes">
              <IconButton
                size="small"
                onClick={handleSubmit}
                disabled={Boolean(error) || isUpdating}
                sx={{
                  color: 'success.main',
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.success.main, 0.2),
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <Check fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Cancel editing">
              <IconButton
                size="small"
                onClick={handleCancel}
                disabled={isUpdating}
                sx={{
                  color: 'error.main',
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.error.main, 0.2),
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            cursor: editable ? 'pointer' : 'text',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            pr: hideIcon ? 2 : { xs: '28px', sm: '36px' },
            py: field.type === 'title' ? { xs: 1, sm: 1.5 } : 1,
            px: { xs: 1.5, sm: 2 },
            borderRadius: 2,
            border: '1px solid transparent',
            transition: 'all 0.2s ease-in-out',
            minHeight: '40px',
            lineHeight: field.type === 'title' ? 1.3 : 1.5,
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            width: '100%',
            maxWidth: '100%',
            '&:hover': {
              bgcolor: editable
                ? alpha(theme.palette.background.paper, 0.6)
                : 'transparent',
              borderColor: editable ? alpha(theme.palette.divider, 0.1) : 'transparent',
            },
          }}
          onClick={editable ? handleStartEdit : undefined}
        >
          {field.value || (editable ? '(Click to edit)' : '')}
          {isHovered && editable && !hideIcon && (
            <IconButton
              className="edit-button"
              size="small"
              sx={{
                position: 'absolute',
                right: 4,
                opacity: 0,
                visibility: 'hidden',
                transition: 'all 0.2s ease-in-out',
                color: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.background.paper, 0.9),
                boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.1)}`,
                backdropFilter: 'blur(8px)',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  transform: 'scale(1.05)',
                },
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      )}
    </Box>
  );
};
