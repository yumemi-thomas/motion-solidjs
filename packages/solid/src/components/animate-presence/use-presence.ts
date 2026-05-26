import { type Accessor } from 'solid-js'
import { injectAnimatePresence } from './presence'

export type UsePresenceResult = [Accessor<boolean>, VoidFunction]

/**
 * Reactive accessor that reads `true` while the component is mounted and
 * `false` once `<AnimatePresence>` has begun exiting it. Returns `true`
 * when called outside an `<AnimatePresence>` boundary.
 *
 * @example
 * ```tsx
 * function Item() {
 *   const isPresent = useIsPresent()
 *   return <div>{isPresent() ? 'visible' : 'leaving'}</div>
 * }
 * ```
 */
export function useIsPresent(): Accessor<boolean> {
  const presence = injectAnimatePresence(null)
  return () => presence?.motionDomPresenceContext?.isPresent ?? true
}

/**
 * Read the `custom` prop forwarded by the nearest `<AnimatePresence>`.
 * Useful for variant resolvers that need per-exit data.
 *
 * @example
 * ```tsx
 * <AnimatePresence custom={direction()}>
 *   <Slide />
 * </AnimatePresence>
 *
 * function Slide() {
 *   const dir = usePresenceData<number>()
 *   return <motion.div exit={{ x: dir() === 1 ? 100 : -100 }} />
 * }
 * ```
 */
export function usePresenceData<T = unknown>(): Accessor<T | undefined> {
  const presence = injectAnimatePresence(null)
  return () => presence?.custom as T | undefined
}

/**
 * Returns `[isPresent, safeToRemove]`. The second tuple slot is a no-op in
 * the Solid port — exit timing is owned by transition-group — but the shape
 * mirrors framer-motion for parity.
 *
 * @example
 * ```tsx
 * const [isPresent] = usePresence()
 * createEffect(() => console.log('present:', isPresent()))
 * ```
 */
export function usePresence(): UsePresenceResult {
  return [useIsPresent(), () => {}]
}
