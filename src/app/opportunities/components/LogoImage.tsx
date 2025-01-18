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

  if (!logo?.url || imageError) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 0.5,
        }}
      >
        {colors.icon}
        <Typography
          variant="caption"
          sx={{
            color: colors.primary,
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: 1,
          }}
        >
          {getInitials(name)}
        </Typography>
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
        height: '100%',
        width: 'auto',
        maxWidth: '100%',
        objectFit: 'contain',
        filter: 'brightness(0.9)',
        transition: 'all 0.3s',
      }}
    />
  );
}
