import {
  hasReducedMotionListener,
  initPrefersReducedMotion,
  prefersReducedMotion,
} from 'motion-dom'
import { createSignal, onCleanup, onMount, type Accessor } from 'solid-js'

/**
 * Reactive `prefers-reduced-motion` accessor. Delegates listener init to
 * motion-dom so `prefersReducedMotion.current` stays consistent with what
 * upstream framer-motion observes; layers a Solid signal on top so each
 * caller gets a reactive subscription.
 *
 * @example
 * ```tsx
 * const reduced = createReducedMotion()
 *
 * return (
 *   <motion.div
 *     animate={{ scale: 1.2 }}
 *     transition={{ duration: reduced() ? 0 : 0.4 }}
 *   />
 * )
 * ```
 */
export function createReducedMotion(options: { window?: Window } = {}): Accessor<boolean> {
  // Seed from the motion-dom global so the first synchronous read isn't
  // `false` purely because onMount hasn't fired yet.
  const [reducedMotion, setReducedMotion] = createSignal(prefersReducedMotion.current ?? false)

  onMount(() => {
    if (!hasReducedMotionListener.current) {
      initPrefersReducedMotion()
    }
    setReducedMotion(prefersReducedMotion.current ?? false)

    // Match only the `reduce` value — not any other non-`no-preference` state.
    const targetWindow = options.window ?? window
    if (!targetWindow.matchMedia) return
    const mediaQuery = targetWindow.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', update)
    onCleanup(() => mediaQuery.removeEventListener('change', update))
  })

  return reducedMotion
}
