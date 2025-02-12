import { Edit as EditIcon } from '@mui/icons-material';
import { Box, IconButton, alpha, useTheme, Tooltip, SxProps, Theme } from '@mui/material';
import { SystemStyleObject } from '@mui/system';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

import { EditableField } from './EditableField';

interface EditableWrapperProps {
  children: React.ReactNode;
  fieldName: string;
  value: string | number | boolean | null;
  type: 'text' | 'number' | 'select' | 'multiline' | 'date' | 'boolean';
  options?: string[];
  isGlobalEditMode?: boolean;
  onUpdate?: (field: string, value: string | number | string[]) => void;
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
  children,
  fieldName,
  value,
  type = 'text',
  options,
  isGlobalEditMode = false,
  onUpdate,
  customStyles = {},
  placement = 'overlay',
  tooltip,
  hideIcon = false,
  showEmpty = false,
}: EditableWrapperProps) => {
  const theme = useTheme();
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const isHovered = hoveredField === fieldName;
  const showEdit = isHovered || isGlobalEditMode;

  // Don't render if value is empty and we're not in global edit mode
  if (!value && !isGlobalEditMode && !showEmpty) return null;

  // Convert array value to string for display
  const displayValue = Array.isArray(value) ? value.join(', ') : value;

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
      cursor: 'pointer',
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
    if (!isGlobalEditMode) {
      setHoveredField(fieldName);
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
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  };

  return (
    <Box
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        position: 'relative',
        width: 'fit-content',
        '&:hover': {
          '& .edit-overlay': {
            opacity: 1,
          },
          '& .edit-icon': {
            opacity: 1,
          },
        },
        ...customStyles.wrapper,
      }}
    >
      {children}
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
                type,
                options,
              }}
              onEdit={(newValue) => {
                if (typeof newValue === 'boolean') return;
                onUpdate?.(fieldName, newValue);
              }}
              onStartEdit={() => {}}
              onCancelEdit={() => {}}
              hideIcon={true}
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
