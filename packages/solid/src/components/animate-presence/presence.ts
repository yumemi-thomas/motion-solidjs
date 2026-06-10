import type { PresenceContextProps } from 'motion-dom'
import { createContext } from '@/utils'

/**
 * Per-Presence registry value supplied to descendant motion children.
 *
 * Each `<motion.*>` inside an `<AnimatePresence>` boundary registers a
 * `runExit` closure during attach. When transition-group asks the Presence
 * to exit a subtree root, Presence walks its registry, collects every
 * descendant's runExit, fires them in parallel, and resolves transition-
 * group's `done` when the combined Promise.all settles.
 */
export interface PresenceContext {
  initial?: boolean
  custom?: any
  motionDomPresenceContext?: PresenceContextProps
  /**
   * Register a motion child with this Presence. Returns an unregister
   * callback the child should call on unmount (when not via Presence-
   * driven teardown).
   */
  register?: (element: Element, runExit: () => Promise<void>) => () => void
  /**
   * Called by transition-group's onExit handler with the root element
   * being removed. Walks the registry for every motion descendant of
   * `root` (including `root` itself), fires their runExit closures in
   * parallel, and resolves once they settle. Caller chains its `done`
   * to the returned promise.
   */
  beforeUnmount?: (root: Element) => Promise<void>
  /**
   * Register a one-shot runEnter closure (motion children call this from
   * their attach() when inside a Presence — the closure replays the
   * initial animation so the entry transition runs from the `initial`
   * variant rather than jumping to `animate`).
   */
  registerEnter?: (element: Element, runEnter: () => void) => void
  /**
   * Called by transition-group's onEnter handler. Walks the registry for
   * every motion descendant of `root` (deferred to a microtask so the
   * registrations have fired) and dispatches each runEnter.
   */
  beforeMount?: (root: Element) => void
}

export const [injectAnimatePresence, provideAnimatePresence] =
  createContext<PresenceContext>('AnimatePresenceContext')
