import React from 'react';
import { Scene } from '../components/Scene';
import { Title } from '../components/Title';
import { Subtitle } from '../components/Subtitle';
import { Feature } from '../components/Feature';
import { CTA } from '../components/CTA';
import { Background } from '../components/Background';
import { TALOCODE } from '../theme';

interface SelfHealingDemoProps {
  steps: { text: string; subtitle: string }[];
}

export const SelfHealingDemo: React.FC<SelfHealingDemoProps> = ({ steps }) => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Background variant="mesh" />

      {/* Hook */}
      <Scene background="accent">
        <Title text="Go agent go" size={96} color={TALOCODE.colors.text} delay={0} />
        <Subtitle text="The future of building" size={36} delay={0.2} />
      </Scene>

      {/* Steps */}
      {steps.map((s, i) => (
        <Scene key={i} background="dark">
          <Feature text={s.text} subtitle={s.subtitle} index={i} />
        </Scene>
      ))}

      {/* CTA */}
      <Scene background="accent">
        <CTA text="Ship faster" link="github.com/talocode" delay={0} />
      </Scene>
    </div>
  );
};

export default SelfHealingDemo;
