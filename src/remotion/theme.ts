export const TALOCODE = {
  colors: {
    dark: '#171718',
    surface: '#232326',
    border: '#37373c',
    accent: '#00d4aa',
    gold: '#ffd166',
    text: '#e8e8e8',
    dim: '#9ca3af',
    white: '#ffffff',
    red: '#ef4444',
    green: '#22c55e',
  },
  font: {
    family: "'DejaVu Sans', sans-serif",
    bold: "'DejaVu Sans Bold', 'DejaVu Sans', sans-serif",
    mono: "'DejaVu Sans Mono', monospace",
  },
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
    xxl: 64,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 16,
  },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.3)',
    md: '0 4px 12px rgba(0,0,0,0.4)',
    lg: '0 8px 32px rgba(0,0,0,0.5)',
  },
  animation: {
    spring: {
      friction: 12,
      mass: 1,
      stiffness: 120,
      damping: 10,
    },
    easing: {
      easeOutExpo: [0.16, 1, 0.3, 1],
      easeInOutCubic: [0.65, 0, 0.35, 1],
      easeOutBack: [0.34, 1.56, 0.64, 1],
      easeInOutQuart: [0.77, 0, 0.175, 1],
      springDamping: {
        mass: 0.8,
        stiffness: 200,
        damping: 15,
      },
    },
    staggerDelay: 0.1,
    entranceDuration: 0.5,
    exitDuration: 0.3,
    transitionDuration: 0.5,
  },
} as const;

export default TALOCODE;