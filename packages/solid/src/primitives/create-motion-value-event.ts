import { onCleanup } from 'solid-js'
import type { MotionValue, MotionValueEventCallbacks } from 'motion-dom'

/**
 * Subscribe to `MotionValue` events (`"change"`, `"renderRequest"`, …) with
 * automatic Solid cleanup on owner disposal.
 *
 * @example
 * ```tsx
 * const x = createMotionValue(0)
 * createMotionValueEvent(x, 'change', (latest) => {
 *   console.log('x is now', latest)
 * })
 * ```
 */
export function createMotionValueEvent<V, EventName extends keyof MotionValueEventCallbacks<V>>(
  value: MotionValue<V>,
  event: EventName,
  callback: MotionValueEventCallbacks<V>[EventName],
) {
  const unlisten = value.on(event, callback)

  onCleanup(() => {
    unlisten()
  })

  return unlisten
}
