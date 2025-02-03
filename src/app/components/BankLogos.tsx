'use client';

import { Box, Container, Typography, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

import { LogoImage } from '@/app/opportunities/components/LogoImage';
import { getTypeColors } from '@/app/opportunities/utils/colorUtils';
import {
  usePublicOpportunities,
  PublicOpportunity,
} from '@/lib/hooks/usePublicOpportunities';

interface Bank {
  name: string;
  type: string;
  logo: {
    url: string;
    type: string;
  };
}

// Helper function to validate image URL
function isValidImageUrl(url: string): boolean {
  // Basic URL validation without network request
  return (
    url.startsWith('https://') &&
    url.length > 10 &&
    !url.includes('placeholder') &&
    !url.includes('default') &&
    !url.includes('unknown') &&
    !url.includes('null')
  );
}

export function BankLogos() {
  const theme = useTheme();
  const { opportunities = [] } = usePublicOpportunities();

  // Get unique banks with high-quality logos
  const uniqueBanks = opportunities
    .filter((opp: PublicOpportunity) => {
      // Only include opportunities with valid logos and names
      return opp.logo?.url && opp.name && isValidImageUrl(opp.logo.url);
    })
    .reduce((acc: Bank[], opp: PublicOpportunity) => {
      if (!acc.some((bank: Bank) => bank.name === opp.name) && opp.logo?.url) {
        acc.push({
          name: opp.name,
          type: opp.type || 'bank', // Default to 'bank' if type is missing
          logo: {
            url: opp.logo.url,
            type: 'icon', // Always use icon type for consistency
          },
        });
      }
      return acc;
    }, [])
    .slice(0, 10);

  // Duplicate the banks for infinite scroll effect
  const scrollingBanks = [...uniqueBanks, ...uniqueBanks];

  if (uniqueBanks.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        py: 6,
        bgcolor: 'transparent',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          align="center"
          sx={{
            mb: 4,
            fontWeight: 700,
            color: theme.palette.mode === 'dark' ? 'white' : 'text.primary',
          }}
        >
          Track Offers From Leading Banks
        </Typography>

        {/* Scrolling container */}
        <Box
          sx={{
            position: 'relative',
            '&::before, &::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: '100px',
              zIndex: 2,
              pointerEvents: 'none',
            },
            '&::before': {
              left: 0,
              background: `linear-gradient(to right, ${theme.palette.background.default}, transparent)`,
            },
            '&::after': {
              right: 0,
              background: `linear-gradient(to left, ${theme.palette.background.default}, transparent)`,
            },
          }}
        >
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: '-50%' }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              display: 'flex',
              gap: '32px',
              width: 'fit-content',
              padding: '16px 0',
            }}
          >
            {scrollingBanks.map((bank, index) => {
              const colors = getTypeColors(bank.type, theme);
              return (
                <Box
                  key={`${bank.name}-${index}`}
                  sx={{
                    width: 100,
                    height: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor:
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.03)',
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <LogoImage name={bank.name} colors={colors} logo={bank.logo} />
                </Box>
              );
            })}
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
}
