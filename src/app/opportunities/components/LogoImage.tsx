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
    height: { xs: 56, sm: 64, md: 80 },
    width: { xs: 56, sm: 64, md: 80 },
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
    p: 1,
  };

  // Show fallback with initials
  if (!logo?.url || imageError) {
    return (
      <Box
        sx={{
          ...commonStyles,
          bgcolor: !colors.icon ? colors.alpha : undefined, // Only show background if no icon
          borderRadius: !colors.icon ? 1 : undefined, // Only show border radius if no icon
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {colors.icon || (
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
          )}
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
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <Image
          src={logo.url}
          alt={name}
          fill
          sizes="(max-width: 600px) 56px, (max-width: 900px) 64px, 80px"
          onError={() => setImageError(true)}
          onLoadingComplete={() => setIsLoading(false)}
          style={{
            objectFit: 'contain',
            filter: 'brightness(0.9)',
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.2s ease-in-out',
          }}
          priority={true}
          quality={85}
        />
      </Box>
    </Box>
  );
}
