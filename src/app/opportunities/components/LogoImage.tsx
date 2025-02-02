'use client';

import { Box, CircularProgress, Typography } from '@mui/material';
import Image from 'next/image';
import { useState } from 'react';

import { TypeColors } from '../utils/colorUtils';

interface LogoImageProps {
  logo?: { url?: string; type?: string };
  name: string;
  colors: TypeColors;
}

export function LogoImage({ logo, name, colors }: LogoImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
    justifyContent: 'center',
    position: 'relative' as const,
  };

  // Show fallback with initials
  if (!logo?.url || imageError) {
    return (
      <Box
        sx={{
          ...commonStyles,
          bgcolor: colors.alpha,
          borderRadius: 1,
          p: 1,
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
    <Box sx={commonStyles}>
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: colors.alpha,
            borderRadius: 1,
          }}
        >
          <CircularProgress size={24} sx={{ color: colors.primary }} />
        </Box>
      )}
      <Image
        src={logo.url}
        alt={name}
        width={80}
        height={80}
        onError={() => setImageError(true)}
        onLoadingComplete={() => setIsLoading(false)}
        style={{
          objectFit: 'contain',
          filter: 'brightness(0.9)',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.2s ease-in-out',
        }}
        priority={true}
      />
    </Box>
  );
}
