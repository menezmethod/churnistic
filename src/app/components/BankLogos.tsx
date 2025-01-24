'use client';

import { Box, Container, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';

import { LogoImage } from '@/app/opportunities/components/LogoImage';
import { getTypeColors } from '@/app/opportunities/utils/colorUtils';

const MAJOR_BANKS = [
  { name: 'Chase', type: 'bank' },
  { name: 'American Express', type: 'credit_card' },
  { name: 'Capital One', type: 'credit_card' },
  { name: 'Wells Fargo', type: 'bank' },
  { name: 'Citi', type: 'credit_card' },
  { name: 'Bank of America', type: 'bank' },
  { name: 'US Bank', type: 'bank' },
  { name: 'Charles Schwab', type: 'brokerage' },
  { name: 'Fidelity', type: 'brokerage' },
];

export function BankLogos() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        py: 6,
        bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50',
        borderTop: `1px solid ${theme.palette.divider}`,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          align="center"
          sx={{
            mb: 4,
            fontWeight: 700,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Track Offers From Leading Banks
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 4,
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {MAJOR_BANKS.map((bank, index) => {
            const colors = getTypeColors(bank.type, theme);
            return (
              <motion.div
                key={bank.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(colors.primary, 0.1),
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 16px ${alpha(colors.primary, 0.2)}`,
                    },
                  }}
                >
                  <LogoImage name={bank.name} colors={colors} logo={{ type: 'icon' }} />
                </Box>
              </motion.div>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}
