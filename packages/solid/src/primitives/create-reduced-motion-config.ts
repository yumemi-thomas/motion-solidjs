import { createMemo, type Accessor } from 'solid-js'
import { createMotionConfig } from '@/components/motion-config/context'
import { createReducedMotion } from './create-reduced-motion'

/**
 * Resolved reduced-motion preference: combines the OS-level
 * `prefers-reduced-motion` setting with the nearest `MotionConfig`'s
 * `reducedMotion` override (`'always'` / `'never'` / `'user'`).
 *
 * @example
 * ```tsx
 * const shouldReduce = createReducedMotionConfig()
 *
 * return (
 *   <motion.div
 *     animate={{ x: 100 }}
 *     transition={{ duration: shouldReduce() ? 0 : 0.6 }}
 *   />
 * )
 * ```
 */
export function createReducedMotionConfig(): Accessor<boolean | null> {
  const reducedMotionPreference = createReducedMotion()
  const config = createMotionConfig()

  const reducedMotionConfig = createMemo(() => {
    const reducedMotion = config().reducedMotion
    if (reducedMotion === 'never') return false
    if (reducedMotion === 'always') return true
    return reducedMotionPreference()
  })

  return reducedMotionConfig
}
