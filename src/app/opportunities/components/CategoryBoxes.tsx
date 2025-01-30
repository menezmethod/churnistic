'use client';

import {
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  TrendingUp,
} from '@mui/icons-material';
import { Box, Paper, Typography, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';

interface CategoryBoxProps {
  selectedType: string | null;
  onTypeChange: (type: string | null) => void;
  totalCounts: Record<string, number>;
}

const categories = [
  {
    id: 'credit_card',
    title: 'Credit Cards',
    subtitle: 'Sign-up bonuses and rewards',
    icon: CreditCardIcon,
    color: '#FF6B6B',
    hoverColor: '#FF8787',
  },
  {
    id: 'bank',
    title: 'Bank Accounts',
    subtitle: 'High-yield savings and checking',
    icon: BankIcon,
    color: '#4ECDC4',
    hoverColor: '#6EE7E0',
  },
  {
    id: 'brokerage',
    title: 'Brokerage Accounts',
    subtitle: 'Investment and trading bonuses',
    icon: TrendingUp,
    color: '#45B7D1',
    hoverColor: '#65D7F1',
  },
];

export default function CategoryBoxes({
  selectedType,
  onTypeChange,
  totalCounts,
}: CategoryBoxProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
        },
        gap: 2,
        my: 3,
      }}
    >
      {categories.map((category) => {
        const isSelected = selectedType === category.id;
        const count = totalCounts[category.id] || 0;
        const Icon = category.icon;

        return (
          <motion.div
            key={category.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Paper
              onClick={() => onTypeChange(isSelected ? null : category.id)}
              sx={{
                p: 2,
                cursor: 'pointer',
                borderRadius: 2,
                bgcolor: isSelected
                  ? isDark
                    ? alpha(category.color, 0.2)
                    : alpha(category.color, 0.1)
                  : isDark
                    ? alpha(theme.palette.background.paper, 0.6)
                    : 'background.paper',
                border: '1px solid',
                borderColor: isSelected
                  ? isDark
                    ? alpha(category.color, 0.3)
                    : alpha(category.color, 0.2)
                  : isDark
                    ? alpha(theme.palette.divider, 0.1)
                    : 'divider',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: isDark
                    ? alpha(category.hoverColor, 0.2)
                    : alpha(category.hoverColor, 0.1),
                  borderColor: isDark
                    ? alpha(category.hoverColor, 0.3)
                    : alpha(category.hoverColor, 0.2),
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    bgcolor: isDark
                      ? alpha(category.color, 0.2)
                      : alpha(category.color, 0.1),
                    color: category.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      color: isSelected ? category.color : 'text.primary',
                    }}
                  >
                    {category.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: isSelected ? alpha(category.color, 0.8) : 'text.secondary',
                    }}
                  >
                    {category.subtitle}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    bgcolor: isDark
                      ? alpha(category.color, 0.1)
                      : alpha(category.color, 0.05),
                    color: category.color,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {count}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </motion.div>
        );
      })}
    </Box>
  );
}
