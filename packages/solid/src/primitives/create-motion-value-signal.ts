import { createSignal } from 'solid-js'
import type { Accessor } from 'solid-js'
import type { MotionValue } from 'motion-dom'

import { createMotionValueEvent } from '@/primitives/create-motion-value-event'

/**
 * Mirror a `MotionValue` into a Solid signal so it can be read in tracked
 * scopes (`createMemo`, JSX, effects). MotionValues update on motion's
 * frameloop outside Solid's reactive graph; this is the deliberate bridge
 * across that boundary, unsubscribed on owner disposal.
 *
 * A value driven by an animation or drag pushes ~60 updates per second
 * through the graph while it moves — fine for a readout or a derived flag,
 * worth knowing before hanging heavy memos off it. (Same shape as Solid's
 * `from`, with the initial value read synchronously.)
 *
 * @example
 * ```tsx
 * const x = createMotionValue(0)
 * const x$ = createMotionValueSignal(x)
 * const isFar = createMemo(() => Math.abs(x$()) > 100)
 *
 * return <span>{x$().toFixed(1)}</span>
 * ```
 */
export function createMotionValueSignal<T>(value: MotionValue<T>): Accessor<T> {
  const [signal, setSignal] = createSignal(value.get())
  createMotionValueEvent(value, 'change', (latest) => setSignal(() => latest))
  return signal
}
