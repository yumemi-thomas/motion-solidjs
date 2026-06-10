// Solid-native primitive surface. Functions follow the `create*` naming
// convention. React-style `useX` compatibility aliases are intentionally not
// exported.

// --- Engine primitives ---
export * from '@/motion/create-motion'
export { useMotion } from './use-motion'
export type { UseMotionOptions, UseMotionResult } from './use-motion'

// --- MotionValue primitives ---
export { motionValue as createMotionValue } from 'motion-dom'
export {
  createCombinedMotionValue,
  createComputed,
  createFollowValue,
  createMotionTemplate,
  createMotionValueEvent,
  createSpring,
  createTime,
  createVelocity,
} from './values'
export { createTransform } from './create-transform'
export { createWillChange } from './create-will-change'

// --- Scroll & viewport ---
export { createScroll } from './create-scroll'
export type { CreateScrollOptions } from './create-scroll'
export { ScrollOffset, offsetToViewTimelineRange } from './scroll-offsets'
export { createInView } from './create-in-view'
export type { CreateInViewOptions } from './create-in-view'
export { createPageInView } from './create-page-in-view'

// --- Animation primitives ---
export { createAnimate } from './create-animate'
export { createAnimateMini } from './create-animate-mini'
export { createInstantLayoutTransition } from './create-instant-layout-transition'
export { createInstantTransition, disableInstantTransitions } from './create-instant-transition'
export { createResetProjection } from './create-reset-projection'
export { createReducedMotion } from './create-reduced-motion'
export { createAnimationFrame, type FrameCallback } from './create-animation-frame'
export { createCycle, type Cycle, type CycleState } from './create-cycle'
export { createReducedMotionConfig } from './create-reduced-motion-config'

// --- Manual / gesture controls ---
export { DragControls, createDragControls } from './create-drag-controls'
export { createLayoutGroup, createLayoutGroupProvider } from './create-layout-group'
export type { LayoutGroupProps } from './create-layout-group'
