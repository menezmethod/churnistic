'use client';

import { Theme } from '@mui/material';

type PaletteColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';

export const getGradientBackground = (theme: Theme, color: PaletteColor = 'primary') => `
  linear-gradient(135deg, ${theme.palette[color].main}, ${theme.palette[color].light})
`;

export const getGlassBackground = (theme: Theme, opacity: number = 0.8) => ({
  background:
    theme.palette.mode === 'dark'
      ? `rgba(18, 18, 18, ${opacity})`
      : `rgba(255, 255, 255, ${opacity})`,
  backdropFilter: 'blur(8px)',
});

export const getHoverTransform = (scale: number = 1.05) => ({
  transform: `scale(${scale})`,
  transition: 'transform 0.3s ease-in-out',
});

export const getShadowAnimation = (theme: Theme) => ({
  transition: 'box-shadow 0.3s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[8],
  },
});

export const getGradientText = (theme: Theme, color: PaletteColor = 'primary') => ({
  background: getGradientBackground(theme, color),
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
});

export const getGlowEffect = (
  theme: Theme,
  color: PaletteColor = 'primary',
  intensity: number = 20
) => ({
  boxShadow: `0 0 ${intensity}px ${theme.palette[color].main}`,
});

export const getBorderGradient = (theme: Theme, color: PaletteColor = 'primary') => ({
  border: '2px solid transparent',
  backgroundImage: `linear-gradient(${theme.palette.background.paper}, ${theme.palette.background.paper}), ${getGradientBackground(theme, color)}`,
  backgroundOrigin: 'border-box',
  backgroundClip: 'content-box, border-box',
});
