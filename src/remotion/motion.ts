export function spring(duration = 0.5, fps = 30) {
  const totalFrames = Math.round(duration * fps);
  return {
    type: 'spring',
    config: {
      mass: 0.8,
      stiffness: 200,
      damping: 15,
      velocity: 0,
      restDelta: 0.01,
      restSpeed: 0.01,
    },
    totalFrames,
  };
}

export function fadeIn(duration = 0.5, fps = 30) {
  return {
    opacity: { from: 0, to: 1 },
    totalFrames: Math.round(duration * fps),
  };
}

export function slideUp(duration = 0.5, fps = 30, distance = 40) {
  return {
    transform: { from: `translateY(${distance}px)`, to: 'translateY(0)' },
    totalFrames: Math.round(duration * fps),
  };
}

export function scaleIn(duration = 0.5, fps = 30, from = 0.9) {
  return {
    transform: { from: `scale(${from})`, to: 'scale(1)' },
    totalFrames: Math.round(duration * fps),
  };
}

export function slideLeft(duration = 0.5, fps = 30, distance = 60) {
  return {
    transform: { from: `translateX(-${distance}px)`, to: 'translateX(0)' },
    totalFrames: Math.round(duration * fps),
  };
}

export function slideRight(duration = 0.5, fps = 30, distance = 60) {
  return {
    transform: { from: `translateX(${distance}px)`, to: 'translateX(0)' },
    totalFrames: Math.round(duration * fps),
  };
}

export function zoomIn(duration = 0.5, fps = 30, from = 1.1) {
  return {
    transform: { from: `scale(${from})`, to: 'scale(1)' },
    opacity: { from: 0, to: 1 },
    totalFrames: Math.round(duration * fps),
  };
}

export function zoomOut(duration = 0.5, fps = 30, to = 1.1) {
  return {
    transform: { from: 'scale(1)', to: `scale(${to})` },
    opacity: { from: 1, to: 0 },
    totalFrames: Math.round(duration * fps),
  };
}

export function typewriter(duration = 0.3, fps = 30) {
  return {
    opacity: { from: 0, to: 1 },
    totalFrames: Math.round(duration * fps),
  };
}

export function stagger(delay = 0.1, fps = 30) {
  return {
    delayFrames: Math.round(delay * fps),
  };
}

export function fadeOut(duration = 0.3, fps = 30) {
  return {
    opacity: { from: 1, to: 0 },
    totalFrames: Math.round(duration * fps),
  };
}

export function crossfade(duration = 0.5, fps = 30) {
  return {
    durationFrames: Math.round(duration * fps),
  };
}

export const animationPresets = {
  cardEnter: (fps = 30) => ({
    spring: spring(0.5, fps),
    fadeIn: fadeIn(0.5, fps),
    slideUp: slideUp(0.5, fps, 30),
  }),
  heroEnter: (fps = 30) => ({
    scaleIn: scaleIn(0.6, fps, 1.2),
    fadeIn: fadeIn(0.6, fps),
  }),
  featureEnter: (fps = 30, index = 0) => ({
    slideLeft: slideLeft(0.5, fps, 40),
    fadeIn: fadeIn(0.5, fps),
    stagger: stagger(0.1 * index, fps),
  }),
  ctaEnter: (fps = 30) => ({
    spring: spring(0.5, fps),
    scaleIn: scaleIn(0.5, fps, 1.15),
    fadeIn: fadeIn(0.5, fps),
  }),
  exitFast: (fps = 30) => ({
    fadeOut: fadeOut(0.2, fps),
  }),
  transition: (fps = 30) => ({
    crossfade: crossfade(0.5, fps),
  }),
};

export default {
  spring,
  fadeIn,
  fadeOut,
  slideUp,
  slideLeft,
  slideRight,
  scaleIn,
  zoomIn,
  zoomOut,
  typewriter,
  stagger,
  crossfade,
  animationPresets,
};