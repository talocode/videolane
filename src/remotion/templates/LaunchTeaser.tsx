import React from 'react';
import { Scene } from '../components/Scene';
import { Title } from '../components/Title';
import { Subtitle } from '../components/Subtitle';
import { Feature } from '../components/Feature';
import { CTA } from '../components/CTA';
import { Background } from '../components/Background';
import { TALOCODE } from '../theme';

interface LaunchTeaserProps {
  productName: string;
  tagline: string;
  features: string[];
  ctaText: string;
  ctaLink: string;
}

export const LaunchTeaser: React.FC<LaunchTeaserProps> = ({
  productName,
  tagline,
  features,
  ctaText,
  ctaLink,
}) => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Background variant="mesh" />

      {/* Teaser */}
      <Scene background="dark">
        <Title text="Something big is coming" size={64} color={TALOCODE.colors.gold} delay={0} />
      </Scene>

      {/* Reveal */}
      <Scene background="accent">
        <Title text={productName} size={96} color={TALOCODE.colors.text} delay={0} />
        <Subtitle text={tagline} size={36} delay={0.2} />
      </Scene>

      {/* Features */}
      {features.map((f, i) => (
        <Scene key={i} background="dark">
          <Feature text={f} index={i} transition={i % 2 === 0 ? 'slide-left' : 'slide-right'} />
        </Scene>
      ))}

      {/* CTA */}
      <Scene background="accent">
        <CTA text={ctaText} link={ctaLink} delay={0} />
      </Scene>
    </div>
  );
};

export default LaunchTeaser;
