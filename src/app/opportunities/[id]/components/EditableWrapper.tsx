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
  Typography,
} from '@mui/material';
import { SystemStyleObject, CSSObject } from '@mui/system';
import { useState, useEffect } from 'react';

import { EditableField } from './EditableField';

// New interface with improved props
export interface EditableWrapperProps {
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
  preserveOriginalStyle?: boolean; // Add a flag to preserve original styling
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
  preserveOriginalStyle = false, // Default to false for backward compatibility
}: EditableWrapperProps) => {
  const theme = useTheme();
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string | number | boolean>(
    value !== null && value !== undefined ? value : ''
  );

  // For backward compatibility
  const effectiveFieldName = fieldName || label || 'field';
  const effectiveInputType = type || inputType;
  const isHovered = hoveredField === effectiveFieldName;
  // Only show edit controls if the field is hovered or in global edit mode, and editing is allowed
  const shouldShowEdit = (isHovered || isGlobalEditMode) && canEdit;

  // Update editValue when value changes externally
  useEffect(() => {
    setEditValue(value !== null && value !== undefined ? value : '');
  }, [value]);

  // Don't render if value is empty and we're not in global edit mode
  if (!value && !isGlobalEditMode && !showEmpty && !children) return null;

  // Convert array value to string for display
  const displayValue = Array.isArray(value) ? value.join(', ') : value;
  const formattedValue = formatter
    ? formatter(displayValue as string | number)
    : displayValue;

  // In global edit mode, show placeholder text for empty fields
  const displayText =
    isGlobalEditMode && !formattedValue
      ? placeholder || `Add ${label || fieldName}...`
      : formattedValue;

  // Make sure fields are editable appropriately
  const isEffectivelyEditable = canEdit || (isGlobalEditMode && canEdit);

  const handleMouseEnter = () => {
    if (canEdit) {
      setHoveredField(effectiveFieldName);
    }
  };

  const handleMouseLeave = () => {
    setHoveredField(null);
  };

  const handleStartEdit = () => {
    if (isEffectivelyEditable) {
      setIsEditing(true);
      setEditValue(value ?? '');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSubmitEdit = (newValue: string | number | boolean) => {
    setIsEditing(false);

    // Only trigger updates for strings and numbers
    if (onUpdate && (typeof newValue === 'string' || typeof newValue === 'number')) {
      onUpdate(newValue);
    }
  };

  const renderEditIcon = () => {
    if (hideIcon || !canEdit) return null;

    // Don't render the edit icon if we're not hovering and not in global edit mode
    if (!shouldShowEdit) return null;

    return (
      <Tooltip title={tooltip || 'Edit'} placement="top">
        <IconButton
          size="small"
          onClick={handleStartEdit}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            opacity: isHovered ? 1 : isGlobalEditMode ? 0.7 : 0,
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
      {icon && <Box color="primary.main">{icon}</Box>}
      {label && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem' }}
        >
          {label}
        </Typography>
      )}
    </Box>
  );

  // If we're in editing mode, show the EditableField
  if (isEditing) {
    return (
      <Box
        sx={{
          position: 'relative',
          ...customStyles.wrapper,
        }}
      >
        {defaultContent}
        <EditableField
          field={{
            value: editValue,
            isEditing: true,
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
          onEdit={handleSubmitEdit}
          onStartEdit={() => {}} // No-op since we're already editing
          onCancelEdit={handleCancelEdit}
          fieldKey={effectiveFieldName}
          placeholder={placeholder}
          isUpdating={isLoading}
        />
      </Box>
    );
  }

  // Prepare box styles for below and right placements
  const getInputBoxStyles = (): SxProps<Theme> => {
    // Create the base styles
    const baseStyles = {
      p: 0,
      borderRadius: 1,
      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      backgroundColor: alpha(theme.palette.background.paper, 0.06),
      flex: 1,
      transition: 'all 0.2s ease',
    };

    // Conditionally add styles in a type-safe way
    const conditionalStyles: CSSObject = {};

    if (isEffectivelyEditable) {
      conditionalStyles.cursor = 'pointer';
    }

    if (!formattedValue) {
      conditionalStyles.color = 'text.secondary';
      conditionalStyles.fontStyle = 'italic';
    }

    // Handle hover pseudo-selector properly
    if (isEffectivelyEditable) {
      conditionalStyles['&:hover'] = {
        bgcolor: alpha(theme.palette.primary.main, 0.05),
        borderColor: alpha(theme.palette.primary.main, 0.2),
      };
    }

    if (isHovered && isEffectivelyEditable) {
      conditionalStyles.borderColor = alpha(theme.palette.primary.main, 0.2);
      conditionalStyles.boxShadow = `0 0 0 1px ${alpha(theme.palette.primary.main, 0.1)}`;
    }

    // Combine all styles
    return {
      ...baseStyles,
      ...conditionalStyles,
      ...(customStyles.input || {}),
    } as SxProps<Theme>;
  };

  const getBoxStyles = (): SxProps<Theme> => {
    // Start with base styles
    const baseStyles = {
      position: 'relative',
      width: '100%',
    };

    // If preserving original style, just return base + custom
    if (preserveOriginalStyle) {
      return {
        ...baseStyles,
        ...(customStyles.overlay || {}),
      } as SxProps<Theme>;
    }

    // Build additional styles
    const additionalStyles: CSSObject = {
      cursor: isEffectivelyEditable ? 'pointer' : 'default',
      display: 'flex',
      flexDirection: 'column',
      padding: 0,
      borderRadius: 1,
      backgroundColor: alpha(theme.palette.background.paper, 0.05),
      border: '1px solid transparent',
      transition: 'all 0.2s ease',
    };

    if (!formattedValue) {
      additionalStyles.color = 'text.secondary';
      additionalStyles.fontStyle = 'italic';
    }

    // Handle hover pseudo-selector properly
    if (isEffectivelyEditable) {
      additionalStyles['&:hover'] = {
        bgcolor: alpha(theme.palette.primary.main, 0.05),
        borderColor: isHovered ? alpha(theme.palette.primary.main, 0.3) : undefined,
      };
    }

    if (isHovered && isEffectivelyEditable) {
      additionalStyles.borderColor = alpha(theme.palette.primary.main, 0.2);
      additionalStyles.boxShadow = `0 0 0 1px ${alpha(theme.palette.primary.main, 0.1)}`;
    }

    // Combine all styles
    return {
      ...baseStyles,
      ...additionalStyles,
      ...(customStyles.overlay || {}),
    } as SxProps<Theme>;
  };

  // If we're using the overlay placement
  if (placement === 'overlay') {
    return (
      <Box
        className="hover-container"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        sx={{
          position: 'relative',
          ...customStyles.wrapper,
        }}
        data-testid={`editable-field-${effectiveFieldName}`}
      >
        {defaultContent}
        <Box
          sx={getBoxStyles()}
          onClick={isEffectivelyEditable ? handleStartEdit : undefined}
        >
          {children || (
            <Box component="span" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
              {displayText}
            </Box>
          )}
        </Box>
        {renderEditIcon()}
      </Box>
    );
  }

  // Below or right placement
  return (
    <Box
      className="hover-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        ...customStyles.wrapper,
      }}
      data-testid={`editable-field-${effectiveFieldName}`}
    >
      {defaultContent}
      <Box
        sx={{
          mt: placement === 'below' ? 1 : 0,
          ml: placement === 'right' ? 2 : 0,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box
          sx={getInputBoxStyles()}
          onClick={isEffectivelyEditable ? handleStartEdit : undefined}
        >
          {children || displayText}
        </Box>
        {shouldShowEdit && !hideIcon && (
          <Tooltip title={tooltip || 'Edit'}>
            <IconButton
              size="small"
              onClick={handleStartEdit}
              sx={{
                opacity: isHovered ? 1 : isGlobalEditMode ? 0.7 : 0,
                transition: 'opacity 0.2s ease',
              }}
            >
              {isLoading ? (
                <CircularProgress size={16} color="primary" />
              ) : (
                <EditIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};
