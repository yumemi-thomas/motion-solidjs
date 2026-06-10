export { M, m, type MotionCreateOptions, type MotionProps } from './motion'
// `motion` / `Motion` live in a separate module so consumers that only
// use `m`/`M` can tree-shake out `domMax` (and `HTMLVisualElement`).
export { Motion, motion } from './motion-max'
export { default as AnimatePresence } from './animate-presence/animate-presence'
export type {
  AnimatePresenceProps,
  SolidAnimatePresenceProps,
} from './animate-presence/animate-presence'
export { useIsPresent, usePresence, usePresenceData } from './animate-presence/use-presence'
export type { UsePresenceResult } from './animate-presence/use-presence'
export { default as MotionConfig } from './motion-config/motion-config'
export * from './reorder'
export { default as RowValue } from './row-value'
export { LazyMotion } from './lazy-motion/lazy-motion'
export type { LazyMotionProps } from './lazy-motion/lazy-motion'
