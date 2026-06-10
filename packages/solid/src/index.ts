export { animate, animateMini, distance, distance2D, inView, scroll, scrollInfo } from 'motion'
// WAAPI-only sequence runner — lives only in the mini bundle upstream.
export { animateSequence } from 'motion/mini'
export {
  arc,
  buildTransform,
  cancelFrame,
  delay,
  frame,
  hover,
  isMotionValue,
  mix,
  motionValue,
  press,
  resolveMotionValue,
  spring,
  stagger,
  transform,
  visualElementStore,
} from 'motion-dom'
export type {
  AnimationPlaybackControls,
  ArcOptions,
  MotionPath,
  MotionValue,
  PanInfo,
  PathInterpolator,
  PathState,
  VariantLabels,
  Variants,
} from 'motion-dom'
export { delay as delayInMs, addScaleCorrector, attachFollow, attachSpring } from 'motion-dom'
export { MotionGlobalConfig } from 'motion-utils'
export { wrap } from 'motion-utils'

export * from './components'
export { default as LayoutGroup } from './components/layout-group'
export * from './components/context'

export * from './primitives'
export type * from './types'
export * from './utils'

export { domAnimation, domMax, domMin } from '@/features'
export { motionGlobalConfig } from './config'
