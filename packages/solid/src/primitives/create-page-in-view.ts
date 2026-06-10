import { createSignal, onCleanup, onMount, type Accessor } from 'solid-js'

/**
 * Reactive accessor for whether the page (browser tab) is currently visible,
 * driven by the document's `visibilitychange` event. Equivalent of
 * motion/react's `usePageInView`. SSR-safe: the listener attaches in
 * `onMount`, and the accessor reads `true` until then.
 *
 * @example
 * ```tsx
 * const pageInView = createPageInView()
 *
 * return <motion.div animate={{ opacity: pageInView() ? 1 : 0 }} />
 * ```
 */
export function createPageInView(): Accessor<boolean> {
  const [isInView, setIsInView] = createSignal(true)

  onMount(() => {
    const handleVisibilityChange = () => setIsInView(!document.hidden)

    if (document.hidden) {
      handleVisibilityChange()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    onCleanup(() => document.removeEventListener('visibilitychange', handleVisibilityChange))
  })

  return isInView
}
