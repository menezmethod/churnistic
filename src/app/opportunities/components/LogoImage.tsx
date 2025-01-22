'use client';

import { Box, Typography } from '@mui/material';
import { useState } from 'react';

import { TypeColors } from '../utils/colorUtils';

interface LogoImageProps {
  logo?: { url?: string; type?: string };
  name: string;
  colors: TypeColors;
}

export function LogoImage({ logo, name, colors }: LogoImageProps) {
  const [imageError, setImageError] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const commonStyles = {
    height: '100%',
    width: 'auto',
    maxWidth: '100%',
    display: 'flex',
    alignItems: 'center',
  };

  if (!logo?.url || imageError) {
    return (
      <Box
        sx={{
          ...commonStyles,
          justifyContent: 'flex-start',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {colors.icon}
          <Typography
            variant="caption"
            sx={{
              color: colors.primary,
              fontWeight: 600,
              textAlign: 'center',
              lineHeight: 1,
              mt: 0.5,
            }}
          >
            {getInitials(name)}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={logo.url}
      alt={name}
      onError={() => setImageError(true)}
      sx={{
        ...commonStyles,
        objectFit: 'contain',
        filter: 'brightness(0.9)',
      }}
    />
  );
}
