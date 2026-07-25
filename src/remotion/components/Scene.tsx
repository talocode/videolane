import React from 'react';
import { TALOCODE } from '../theme';

interface SceneProps {
  children: React.ReactNode;
  background?: 'dark' | 'surface' | 'accent' | 'gold' | 'custom';
  customColor?: string;
  transition?: 'fade' | 'slide-left' | 'slide-right' | 'zoom' | 'none';
}

export const Scene: React.FC<SceneProps> = ({
  children,
  background = 'dark',
  customColor,
  transition = 'none',
}) => {
  const bgColor = background === 'accent' ? TALOCODE.colors.accent
    : background === 'gold' ? TALOCODE.colors.gold
    : background === 'surface' ? TALOCODE.colors.surface
    : background === 'custom' ? customColor || TALOCODE.colors.dark
    : TALOCODE.colors.dark;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
};

export default Scene;
