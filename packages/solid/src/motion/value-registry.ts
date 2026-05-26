import { type MotionValue, motionValue } from 'motion-dom'

/**
 * Per-element MV map. Replaces `visualElement.values` as the Solid-side
 * source of truth for which `MotionValue` drives each style / transform key
 * on an element.
 *
 * Two ownership classes:
 *
 * - **External** — MVs the user created via `createMotionValue` / motion's
 *   `motionValue()` and handed in via `style`. Registry tracks them but
 *   does NOT dispose them; lifetime belongs to the user.
 *
 * - **Transient** — MVs the registry created internally because an animate
 *   target referenced a key with no existing MV. Registry owns these and
 *   clears them on `dispose()`. Releasing references is what lets GC
 *   collect the MV once all subscribers have unsubscribed.
 */
export type ValueRegistry = {
  get(key: string): MotionValue | undefined
  has(key: string): boolean
  readonly size: number
  /**
   * Register a user-provided MV. If a transient previously claimed this key,
   * the transient is dropped (external becomes the new source of truth).
   */
  setExternal(key: string, mv: MotionValue): void
  /**
   * Return the MV for `key`, creating a transient initialised to `fallback`
   * if absent.
   */
  getOrCreateTransient(key: string, fallback: unknown): MotionValue
  entries(): IterableIterator<[string, MotionValue]>
  /** Drop registry-owned (transient) MVs. External MVs are untouched. */
  dispose(): void
}

export function createValueRegistry(): ValueRegistry {
  const values = new Map<string, MotionValue>()
  const transient = new Set<MotionValue>()

  return {
    get(key) {
      return values.get(key)
    },
    has(key) {
      return values.has(key)
    },
    setExternal(key, mv) {
      const existing = values.get(key)
      if (existing && transient.has(existing)) {
        transient.delete(existing)
      }
      values.set(key, mv)
    },
    getOrCreateTransient(key, fallback) {
      const existing = values.get(key)
      if (existing) return existing
      // Coerce `null` → `undefined` to match motion-dom's `ve.getValue`
      // behavior. With `motionValue(null)`, `mv.get()` returns `null` and
      // the keyframes resolver (which checks `currentValue !== undefined`)
      // skips the DOM-read branch — leaving `ve.baseTarget[key]` empty, so
      // a later removed-key fallback resolves to `null` instead of the
      // transform default. Coercing here keeps the registry's transient MV
      // semantically equivalent to one created via `ve.getValue`.
      const mv = motionValue(fallback === null ? undefined : fallback)
      values.set(key, mv)
      transient.add(mv)
      return mv
    },
    entries() {
      return values.entries()
    },
    get size() {
      return values.size
    },
    dispose() {
      transient.clear()
      values.clear()
    },
  }
}
