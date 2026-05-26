import { createSignal, onCleanup, onMount } from 'solid-js'
import type { MotionValue } from 'motion-dom'

export interface RowValueProps<T> {
  value: MotionValue<T>
}

/**
 * Renders a `MotionValue`'s current value as text, updating live as the
 * value changes. Useful for displaying animated counters, progress, or
 * any scalar motion value inside JSX without manual subscriptions.
 *
 * @example
 * ```tsx
 * const count = motionValue(0)
 * animate(count, 100, { duration: 2 })
 * return <RowValue value={count} />
 * ```
 */
export default function RowValue<T>(props: RowValueProps<T>) {
  const [value, setValue] = createSignal<T>()

  onMount(() => {
    setValue(() => props.value.get())
    const unsubscribe = props.value.on('change', (next) => setValue(() => next))
    onCleanup(unsubscribe)
  })

  return <>{String(value() ?? '')}</>
}
