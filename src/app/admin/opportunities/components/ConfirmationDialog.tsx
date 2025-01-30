'use client';

import { Warning as WarningIcon, Close as CloseIcon } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useTheme,
  alpha,
  IconButton,
  PaperProps,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// Add type definition at top
type AnimatedPaperProps = PaperProps & {
  initial?: React.ComponentProps<typeof motion.div>['initial'];
  animate?: React.ComponentProps<typeof motion.div>['animate'];
  exit?: React.ComponentProps<typeof motion.div>['exit'];
  transition?: React.ComponentProps<typeof motion.div>['transition'];
};

export const ConfirmationDialog = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) => {
  const theme = useTheme();

  return (
    <AnimatePresence>
      {open && (
        <Dialog
          open={open}
          onClose={onCancel}
          PaperComponent={({ children, ...paperProps }: AnimatedPaperProps) => {
            const motionProps = {
              initial: paperProps.initial,
              animate: paperProps.animate,
              exit: paperProps.exit,
              transition: paperProps.transition,
              style: { ...paperProps.style, borderRadius: 16, overflow: 'hidden' },
            };
            return <motion.div {...motionProps}>{children}</motion.div>;
          }}
          PaperProps={
            {
              initial: { opacity: 0, y: -20 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0, y: 20 },
              transition: { duration: 0.2 },
            } as AnimatedPaperProps
          }
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: 3,
              boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
            },
          }}
        >
          <DialogTitle
            sx={{
              pb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              pr: 6,
              background: alpha(theme.palette.error.main, 0.05),
            }}
          >
            <WarningIcon
              sx={{
                color: theme.palette.error.main,
                fontSize: 24,
              }}
            />
            {title}
            <IconButton
              onClick={onCancel}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <DialogContentText>{message}</DialogContentText>
          </DialogContent>
          <DialogActions
            sx={{
              px: 3,
              pb: 3,
              pt: 2,
              background: theme.palette.background.paper,
            }}
          >
            <Button
              onClick={onCancel}
              variant="outlined"
              sx={{
                borderRadius: 2,
                px: 3,
                borderColor: alpha(theme.palette.divider, 0.5),
                '&:hover': {
                  borderColor: alpha(theme.palette.divider, 0.8),
                  bgcolor: alpha(theme.palette.action.hover, 0.05),
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              color="error"
              variant="contained"
              sx={{
                borderRadius: 2,
                px: 3,
                boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.2)}`,
                '&:hover': {
                  boxShadow: `0 6px 16px ${alpha(theme.palette.error.main, 0.3)}`,
                },
              }}
            >
              Confirm Purge
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </AnimatePresence>
  );
};
