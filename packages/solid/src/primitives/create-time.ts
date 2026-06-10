import { motionValue } from 'motion-dom'

import { createAnimationFrame } from '@/primitives/create-animation-frame'

/**
 * `MotionValue<number>` that updates each animation frame with the
 * milliseconds elapsed since creation. Useful as a driver for time-based
 * transforms. Pauses when the surrounding `MotionConfig` has `isStatic`,
 * like `useTime` in motion/react.
 *
 * @example
 * ```tsx
 * const time = createTime()
 * const rotate = createTransform(time, (t) => (t / 20) % 360)
 *
 * return <motion.div style={{ rotate }} />
 * ```
 */
export function createTime() {
  const time = motionValue(0)
  createAnimationFrame((t) => time.set(t))
  return time
}
