import { createEffect } from 'solid-js'
import { type MotionValue, collectMotionValues } from 'motion-dom'

import { createCombinedMotionValue } from '@/primitives/create-combined-motion-value'

/**
 * Derives a `MotionValue` from a computation that reads other MotionValues.
 * Dependencies are auto-tracked via `collectMotionValues`, and re-tracked on
 * every Solid effect run, so dependency sets can change between updates.
 *
 * NOTE: `solid-js` exports an unrelated `createComputed` (an eager, void
 * reactive computation) — take care not to auto-import the wrong one.
 * `createTransform(fn)` is the canonical form of this primitive (it matches
 * motion/react's `useTransform(fn)` and delegates here). Reach for either
 * only when MotionValues are involved; a computation over plain signals
 * feeding JSX is `createMemo` territory.
 *
 * @example
 * ```tsx
 * const x = createMotionValue(0)
 * const y = createMotionValue(0)
 * const distance = createComputed(() => Math.hypot(x.get(), y.get()))
 * ```
 */
export function createComputed<T>(computed: () => T): MotionValue<T> {
  /**
   * Open session of collectMotionValues. Any MotionValue that calls get()
   * will be saved into this array.
   */
  collectMotionValues.current = []

  const { value, subscribe, unsubscribe, updateValue } = createCombinedMotionValue<T>(computed)

  subscribe(collectMotionValues.current)

  collectMotionValues.current = undefined

  createEffect(() => {
    unsubscribe()
    collectMotionValues.current = []
    updateValue()
    subscribe(collectMotionValues.current)
    collectMotionValues.current = undefined
  })

  return value
}
