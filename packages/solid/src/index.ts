export { animate, inView, scroll } from 'motion'
export {
  arc,
  buildTransform,
  delay,
  isMotionValue,
  motionValue,
  resolveMotionValue,
  spring,
  stagger,
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
