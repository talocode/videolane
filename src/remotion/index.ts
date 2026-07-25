import { Composition, registerRoot } from 'remotion';
import { ProductDemo } from './templates/ProductDemo';
import { LaunchTeaser } from './templates/LaunchTeaser';
import { SelfHealingDemo } from './templates/SelfHealingDemo';

export const RemotionVideo: React.FC<{
  template: string;
  productName?: string;
  tagline?: string;
  features?: string[];
  ctaText?: string;
  ctaLink?: string;
}> = ({ template, productName = 'Talocode', tagline = 'Open-source tools for AI-native development', features = [], ctaText = 'Ship faster', ctaLink = 'github.com/talocode' }) => {
  switch (template) {
    case 'product-demo':
      return <ProductDemo productName={productName} tagline={tagline} features={features.map((f, i) => ({ text: f, subtitle: '' }))} ctaText={ctaText} ctaLink={ctaLink} />;
    case 'launch':
      return <LaunchTeaser productName={productName} tagline={tagline} features={features} ctaText={ctaText} ctaLink={ctaLink} />;
    case 'self-healing':
      return <SelfHealingDemo steps={features.map((f, i) => ({ text: f, subtitle: '' }))} />;
    default:
      return <ProductDemo productName={productName} tagline={tagline} features={[]} ctaText={ctaText} ctaLink={ctaLink} />;
  }
};

export const compositions = {
  'ProductDemo': {
    component: ProductDemo,
    durationInFrames: 150,
    fps: 30,
    width: 1920,
    height: 1080,
  },
  'LaunchTeaser': {
    component: LaunchTeaser,
    durationInFrames: 150,
    fps: 30,
    width: 1920,
    height: 1080,
  },
  'SelfHealingDemo': {
    component: SelfHealingDemo,
    durationInFrames: 150,
    fps: 30,
    width: 1920,
    height: 1080,
  },
};

registerRoot(RemotionVideo);
