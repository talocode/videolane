import React from 'react';
import { TALOCODE } from '../theme';

interface CTAProps {
  text: string;
  link: string;
  delay?: number;
}

export const CTA: React.FC<CTAProps> = ({ text, link, delay = 0 }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        opacity: 1,
        transform: 'scale(1)',
        transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      }}
    >
      <div style={{
        fontFamily: TALOCODE.font.bold,
        fontSize: '72px',
        color: TALOCODE.colors.accent,
        textAlign: 'center',
        marginBottom: '16px',
      }}>
        {text}
      </div>
      <div style={{
        fontFamily: TALOCODE.font.family,
        fontSize: '24px',
        color: TALOCODE.colors.dim,
        textAlign: 'center',
      }}>
        {link}
      </div>
    </div>
  );
};

export default CTA;
