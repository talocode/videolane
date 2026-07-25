import { RemotionConfig } from '@remotion/cli';

const config: RemotionConfig = {
  srcDir: 'src/remotion',
  outDir: 'out',
  rendererFunctionName: 'renderer',
  webpackOverride: (config) => {
    return config;
  },
};

export default config;
