import { Edit as EditIcon } from '@mui/icons-material';
import {
  Box,
  IconButton,
  alpha,
  useTheme,
  Tooltip,
  SxProps,
  Theme,
  CircularProgress,
} from '@mui/material';
import { SystemStyleObject } from '@mui/system';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

import { EditableField } from './EditableField';

// New interface with improved props
interface EditableWrapperProps {
  // Core props
  value: string | number | boolean | null;
  onUpdate?: (value: string | number) => void;
  canEdit?: boolean;
  isGlobalEditMode?: boolean;
  isLoading?: boolean;

  // Field configuration
  label?: string;
  icon?: React.ReactNode;
  placeholder?: string;
  formatter?: (value: string | number) => string;
  inputType?: 'text' | 'number' | 'select' | 'multiline' | 'date' | 'boolean';
  selectOptions?: Array<{ value: string; label: string }>;

  // Legacy props for backward compatibility
  children?: React.ReactNode;
  fieldName?: string;
  type?: 'text' | 'number' | 'select' | 'multiline' | 'date' | 'boolean';
  options?: string[];
  optionLabels?: Record<string, string>;
  customStyles?: {
    wrapper?: SxProps<Theme>;
    overlay?: SxProps<Theme>;
    input?: SystemStyleObject<Theme>;
  };
  placement?: 'overlay' | 'below' | 'right';
  tooltip?: string;
  hideIcon?: boolean;
  showEmpty?: boolean;
}

export const EditableWrapper = ({
  // Core props
  value,
  onUpdate,
  canEdit = true,
  isGlobalEditMode = false,
  isLoading = false,

  // Field configuration
  label,
  icon,
  placeholder,
  formatter,
  inputType = 'text',
  selectOptions,

  // Legacy props
  children,
  fieldName,
  type,
  options,
  optionLabels,
  customStyles = {},
  placement = 'overlay',
  tooltip,
  hideIcon = false,
  showEmpty = false,
}: EditableWrapperProps) => {
  const theme = useTheme();
  const [hoveredField, setHoveredField] = useState<string | null>(null);

  // For backward compatibility
  const effectiveFieldName = fieldName || label || 'field';
  const effectiveInputType = type || inputType;
  const isHovered = hoveredField === effectiveFieldName;
  const showEdit = (isHovered || isGlobalEditMode) && canEdit;

  // Don't render if value is empty and we're not in global edit mode
  if (!value && !isGlobalEditMode && !showEmpty && !children) return null;

  // Convert array value to string for display
  const displayValue = Array.isArray(value) ? value.join(', ') : value;
  const formattedValue = formatter
    ? formatter(displayValue as string | number)
    : displayValue;

  const getOverlayStyles = () => {
    const baseStyles = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: alpha(theme.palette.background.paper, 0.8),
      backdropFilter: 'blur(4px)',
      borderRadius: 1,
      opacity: 0,
      transition: 'all 0.2s ease',
      cursor: canEdit ? 'pointer' : 'default',
      border: '1px dashed',
      borderColor: alpha(theme.palette.primary.main, 0.3),
      ...customStyles.overlay,
    };

    switch (placement) {
      case 'below':
        return {
          ...baseStyles,
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 1,
          minHeight: 48,
          zIndex: 1,
          boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`,
        };
      case 'right':
        return {
          ...baseStyles,
          position: 'absolute',
          top: 0,
          left: '100%',
          bottom: 0,
          marginLeft: 1,
          minWidth: 200,
          boxShadow: `4px 0 20px ${alpha(theme.palette.common.black, 0.1)}`,
        };
      default:
        return {
          ...baseStyles,
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        };
    }
  };

  const handleMouseEnter = () => {
    if (!isGlobalEditMode && canEdit) {
      setHoveredField(effectiveFieldName);
    }
  };

  const handleMouseLeave = () => {
    if (!isGlobalEditMode) {
      setHoveredField(null);
    }
  };

  const renderEditIcon = () => {
    if (hideIcon || !showEdit || placement !== 'overlay') return null;

    return (
      <Tooltip title={tooltip || 'Click to edit'} placement="top" arrow>
        <IconButton
          className="edit-icon"
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            opacity: 0,
            transition: 'opacity 0.2s ease',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.2),
              transform: 'scale(1.1)',
            },
          }}
        >
          {isLoading ? (
            <CircularProgress size={16} color="primary" />
          ) : (
            <EditIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
    );
  };

  // Generate content if children not provided
  const defaultContent = !children && (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {icon && <Box sx={{ color: 'primary.main' }}>{icon}</Box>}
      <Box sx={{ flex: 1 }}>
        {label && (
          <Box
            component="span"
            sx={{ fontSize: '0.75rem', color: 'text.secondary', display: 'block' }}
          >
            {label}
          </Box>
        )}
        <Box component="span" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
          {formattedValue || placeholder || '—'}
        </Box>
      </Box>
      {isLoading && !showEdit && <CircularProgress size={16} color="primary" />}
    </Box>
  );

  return (
    <Box
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        position: 'relative',
        width: '100%',
        '&:hover': canEdit
          ? {
              '& .edit-overlay': {
                opacity: 1,
              },
              '& .edit-icon': {
                opacity: 1,
              },
            }
          : {},
        ...customStyles.wrapper,
      }}
    >
      {children || defaultContent}
      <AnimatePresence>
        {showEdit && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: placement === 'below' ? -10 : 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="edit-overlay"
            sx={getOverlayStyles() as SxProps<Theme>}
          >
            <EditableField
              field={{
                value: displayValue,
                isEditing: false,
                type: effectiveInputType,
                options: selectOptions ? selectOptions.map((opt) => opt.value) : options,
                optionLabels: selectOptions
                  ? selectOptions.reduce(
                      (acc, curr) => {
                        acc[curr.value] = curr.label;
                        return acc;
                      },
                      {} as Record<string, string>
                    )
                  : optionLabels,
              }}
              onEdit={(newValue) => {
                if (typeof newValue === 'boolean') return;
                if (onUpdate) {
                  if (effectiveInputType === 'number' && typeof newValue === 'string') {
                    onUpdate(parseFloat(newValue));
                  } else {
                    onUpdate(newValue);
                  }
                } else if (fieldName) {
                  // Legacy support
                  console.warn(
                    'Using deprecated fieldName prop. Please update to use onUpdate(value) instead.'
                  );
                }
              }}
              onStartEdit={() => {}}
              onCancelEdit={() => {}}
              hideIcon={true}
              placeholder={placeholder}
              sx={
                {
                  width: '100%',
                  '& .MuiInputBase-root': {
                    width: '100%',
                    ...customStyles.input,
                  },
                } as SxProps<Theme>
              }
            />
          </Box>
        )}
      </AnimatePresence>
      {renderEditIcon()}
    </Box>
  );
};
