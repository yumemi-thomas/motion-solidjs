import type { MotionValue } from 'motion-dom'
import { createSignal, onCleanup } from 'solid-js'

/**
 * Render a MotionValue as a motion component's text child. Mirrors
 * `motion-react/render/dom/use-motion-value-child.ts`:
 * - return the current `.get()` for initial render
 * - subscribe to `change` and update reactively so the DOM textContent
 *   tracks subsequent `.set(...)` calls
 *
 * React's port writes to `element.textContent` directly via a DOM
 * reference; in Solid we can do the same thing more idiomatically by
 * returning a signal that `<Dynamic>{accessor}</Dynamic>` re-evaluates on
 * change.
 */
export function useMotionValueChild(value: MotionValue<number | string>) {
  const [latest, setLatest] = createSignal<number | string>(value.get())
  const unsub = value.on('change', (next) => setLatest(next))
  onCleanup(unsub)
  return latest
}
