import {
  AccountBalance,
  AccountBalanceWallet,
  CreditCard,
  MonetizationOn,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';

import { FirestoreOpportunity } from '@/types/opportunity';

import { EditableWrapper } from './EditableWrapper';
import { LogoImage } from '../../components/LogoImage';

interface HeaderSectionProps {
  opportunity: FirestoreOpportunity;
  isGlobalEditMode?: boolean;
  onUpdate?: (field: string, value: string | number | string[]) => void;
  canModify?: boolean;
}

export function HeaderSection({
  opportunity,
  isGlobalEditMode = false,
  onUpdate,
  canModify = false,
}: HeaderSectionProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Create adapter functions to match the expected signature
  const handleNameUpdate = (value: string | number) => {
    if (onUpdate) {
      onUpdate('name', value);
    }
  };

  const handleOfferLinkUpdate = (value: string | number) => {
    if (onUpdate) {
      onUpdate('offer_link', value);
    }
  };

  return (
    <Paper
      elevation={0}
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      sx={{
        p: 4,
        borderRadius: 3,
        bgcolor: isDark ? alpha(theme.palette.background.paper, 0.6) : 'background.paper',
        border: '1px solid',
        borderColor: isDark ? alpha(theme.palette.divider, 0.1) : 'divider',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(8px)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 4,
          left: 0,
          right: 0,
          bottom: 0,
          background: isDark
            ? 'radial-gradient(circle at top right, rgba(25, 118, 210, 0.05), transparent 70%)'
            : 'radial-gradient(circle at top right, rgba(25, 118, 210, 0.08), transparent 70%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} md={8}>
          <Box display="flex" alignItems="center" gap={2}>
            <LogoImage
              logo={opportunity.logo}
              name={opportunity.name}
              colors={{
                primary: theme.palette.primary.main,
                light: theme.palette.primary.light,
                dark: theme.palette.primary.dark,
                alpha: alpha(theme.palette.primary.main, 0.1),
                icon:
                  opportunity.type === 'credit_card' ? (
                    <CreditCard sx={{ fontSize: '2.5rem', color: 'primary.main' }} />
                  ) : opportunity.type === 'brokerage' ? (
                    <AccountBalanceWallet
                      sx={{ fontSize: '2.5rem', color: 'primary.main' }}
                    />
                  ) : (
                    <AccountBalance sx={{ fontSize: '2.5rem', color: 'primary.main' }} />
                  ),
              }}
            />
            <Box>
              <EditableWrapper
                fieldName="name"
                value={opportunity.name}
                type="text"
                isGlobalEditMode={isGlobalEditMode}
                onUpdate={handleNameUpdate}
                customStyles={{
                  wrapper: {
                    width: '100%',
                  },
                  input: {
                    fontSize: '2rem',
                    fontWeight: 700,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '0.02em',
                    mb: 1,
                  },
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    mb: 1,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '0.02em',
                  }}
                >
                  {opportunity.name}
                </Typography>
              </EditableWrapper>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip
                  icon={
                    opportunity.type === 'credit_card' ? (
                      <CreditCard />
                    ) : opportunity.type === 'brokerage' ? (
                      <AccountBalanceWallet />
                    ) : (
                      <AccountBalance />
                    )
                  }
                  label={opportunity.type.replace('_', ' ').toUpperCase()}
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                    transition: 'all 0.3s',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.15),
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    },
                  }}
                />
                <Chip
                  icon={<MonetizationOn />}
                  label={`$${opportunity.value.toLocaleString()}`}
                  color="success"
                  sx={{
                    fontWeight: 600,
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                    },
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: { xs: 'flex-start', md: 'flex-end' },
              gap: 2,
            }}
          >
            <EditableWrapper
              fieldName="offer_link"
              value={opportunity.offer_link || ''}
              type="text"
              isGlobalEditMode={isGlobalEditMode}
              onUpdate={handleOfferLinkUpdate}
              canEdit={canModify}
              placeholder="Add offer link"
              hideIcon={!canModify}
              showEmpty={isGlobalEditMode}
              preserveOriginalStyle={true}
              customStyles={{
                wrapper: {
                  width: '100%',
                },
                input: {
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
                  color: 'white',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 12px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                  },
                },
              }}
            >
              {opportunity.offer_link ? (
                <Button
                  variant="contained"
                  size="large"
                  component={motion.a}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href={opportunity.offer_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    width: '100%',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
                    transition: 'all 0.3s',
                    overflow: 'hidden',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: -100,
                      width: '70px',
                      height: '100%',
                      background: 'rgba(255, 255, 255, 0.3)',
                      transform: 'skewX(-15deg)',
                      transition: 'all 0.6s',
                      filter: 'blur(5px)',
                    },
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 12px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                      '&::before': {
                        left: '200%',
                      },
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    View Offer
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                    >
                      →
                    </motion.div>
                  </Box>
                </Button>
              ) : (
                <Button
                  variant="contained"
                  disabled
                  size="large"
                  sx={{
                    width: '100%',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                  }}
                >
                  No Link Available
                </Button>
              )}
            </EditableWrapper>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
