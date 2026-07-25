import React from 'react';
import { TALOCODE } from '../theme';

interface FeatureProps {
  text: string;
  subtitle?: string;
  icon?: string;
  index?: number;
  transition?: 'slide-left' | 'slide-right' | 'fade' | 'zoom';
}

export const Feature: React.FC<FeatureProps> = ({
  text,
  subtitle,
  icon,
  index = 0,
  transition = 'slide-left',
}) => {
  const delay = index * 0.1;
  const direction = index % 2 === 0 ? 'translateX(-40px)' : 'translateX(40px)';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        opacity: 1,
        transform: 'translateX(0)',
        transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      }}
    >
      {icon && (
        <div style={{
          fontSize: '48px',
          marginBottom: '16px',
          color: TALOCODE.colors.accent,
        }}>
          {icon}
        </div>
      )}
      <div style={{
        fontFamily: TALOCODE.font.bold,
        fontSize: '48px',
        color: TALOCODE.colors.text,
        textAlign: 'center',
        marginBottom: subtitle ? '12px' : '0',
      }}>
        {text}
      </div>
      {subtitle && (
        <div style={{
          fontFamily: TALOCODE.font.family,
          fontSize: '24px',
          color: TALOCODE.colors.dim,
          textAlign: 'center',
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default Feature;
