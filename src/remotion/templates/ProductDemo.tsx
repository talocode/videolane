import React from 'react';
import { Scene } from '../components/Scene';
import { Title } from '../components/Title';
import { Subtitle } from '../components/Subtitle';
import { Feature } from '../components/Feature';
import { CTA } from '../components/CTA';
import { Background } from '../components/Background';
import { TALOCODE } from '../theme';

interface ProductDemoProps {
  productName: string;
  tagline: string;
  features: { text: string; subtitle: string }[];
  ctaText: string;
  ctaLink: string;
}

export const ProductDemo: React.FC<ProductDemoProps> = ({
  productName,
  tagline,
  features,
  ctaText,
  ctaLink,
}) => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Background variant="mesh" />

      {/* Hook */}
      <Scene background="dark">
        <Title text={productName} size={96} color={TALOCODE.colors.accent} delay={0} />
        <Subtitle text={tagline} size={36} delay={0.2} />
      </Scene>

      {/* Problem */}
      <Scene background="dark">
        <Title text="Tired of broken tools?" size={64} delay={0} />
        <Subtitle text="There is a better way." size={28} delay={0.3} />
      </Scene>

      {/* Features */}
      {features.map((f, i) => (
        <Scene key={i} background="dark">
          <Feature
            text={f.text}
            subtitle={f.subtitle}
            index={i}
            transition={i % 2 === 0 ? 'slide-left' : 'slide-right'}
          />
        </Scene>
      ))}

      {/* CTA */}
      <Scene background="accent">
        <CTA text={ctaText} link={ctaLink} delay={0} />
      </Scene>
    </div>
  );
};

export default ProductDemo;
