import React from 'react';
import { TALOCODE } from '../theme';

interface TitleProps {
  text: string;
  size?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  delay?: number;
}

export const Title: React.FC<TitleProps> = ({
  text,
  size = 72,
  color = TALOCODE.colors.text,
  align = 'center',
  delay = 0,
}) => {
  return (
    <div
      style={{
        fontFamily: TALOCODE.font.bold,
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

export default Title;