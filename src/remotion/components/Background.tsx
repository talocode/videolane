import React from 'react';
import { TALOCODE } from '../theme';

interface BackgroundProps {
  variant?: 'gradient' | 'mesh' | 'solid' | 'grain';
  color?: string;
  secondColor?: string;
}

export const Background: React.FC<BackgroundProps> = ({
  variant = 'gradient',
  color = TALOCODE.colors.dark,
  secondColor = TALOCODE.colors.surface,
}) => {
  const style: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  };

  if (variant === 'gradient') {
    style.background = `linear-gradient(135deg, ${color} 0%, ${secondColor} 100%)`;
  } else if (variant === 'mesh') {
    style.background = color;
    style.backgroundImage = `radial-gradient(circle at 20% 50%, ${secondColor} 0%, transparent 50%), radial-gradient(circle at 80% 50%, ${TALOCODE.colors.accent}20 0%, transparent 50%)`;
  } else if (variant === 'grain') {
    style.background = color;
    style.opacity = '0.95';
  } else {
    style.background = color;
  }

  return <div style={style} />;
};

export default Background;
