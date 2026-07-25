import React from 'react';
import { TALOCODE } from '../theme';

interface SubtitleProps {
  text: string;
  size?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  delay?: number;
}

export const Subtitle: React.FC<SubtitleProps> = ({
  text,
  size = 32,
  color = TALOCODE.colors.dim,
  align = 'center',
  delay = 0,
}) => {
  return (
    <div
      style={{
        fontFamily: TALOCODE.font.family,
        fontSize: size,
        color,
        textAlign: align,
        opacity: 1,
        transform: 'translateY(0)',
        transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      }}
    >
      {text}
    </div>
  );
};

export default Subtitle;
