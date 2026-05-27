// Feature-only methods extracted from `createMotionHandle`. Imported only by
// feature code (features/animation.ts, animate-target.ts, features/gestures/*)
// — never by `create-motion.ts` — so bare `m.div` consumers don't pay the
// bytes for animation-only logic. State reads off the public `MotionHandle`
// surface; extra state (e.g. the prefers-reduced-motion signal) is lazily
// constructed on first feature call-in.

import {
  hasReducedMotionListener,
  initPrefersReducedMotion,
  type AnyResolvedKeyframe,
  type MotionValue,
  prefersReducedMotion,
} from 'motion-dom'
import { type Accessor, createRoot, createSignal, onCleanup } from 'solid-js'
import type { MotionHandle } from './create-motion'

// Module-level singleton prefers-reduced-motion signal.
// Singleton because the listener-init tests assert matchMedia stays un-init'd
// unless a consumer reaches the `'user'` config branch; per-handle would
// over- or under-init in races.
// `createRoot` because `onCleanup` (paired with `addEventListener`) needs a
// Solid owner, and the first feature consumer reaches this from
// `queueMicrotask` outside any owner. The root is held for the page; test
// hook `__disposeSystemReducedMotion()` disposes explicitly.
const systemReducedMotion: {
  signal?: Accessor<boolean>
  dispose?: () => void
} = {}

function getSystemReducedMotion(): boolean {
  if (systemReducedMotion.signal) return systemReducedMotion.signal()
  const result = createRoot((dispose) => {
    const [signal, setSignal] = createSignal(false)
    if (typeof window !== 'undefined' && window.matchMedia) {
      if (!hasReducedMotionListener.current) initPrefersReducedMotion()
      setSignal(prefersReducedMotion.current ?? false)
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      const handler = (e: MediaQueryListEvent) => setSignal(e.matches)
      mq.addEventListener('change', handler)
      onCleanup(() => mq.removeEventListener('change', handler))
    }
    return { signal, dispose }
  })
  systemReducedMotion.signal = result.signal
  systemReducedMotion.dispose = result.dispose
  return result.signal()
}

/**
 * Get or create the MotionValue that drives an animated key, registering it with both the
 * Solid-side registry (source of truth for `m`-without-VE flows) and the
 * VE (for motion-dom's render pipeline when a feature has lazily
 * constructed one). Mirrors `visualElement.getValue(key, fallback)` but
 * lets animation dispatch stay clear of direct VE coupling.
 *
 * Extracted from `createMotionHandle`. Lived on the handle as a method
 * until the bytes were tracked back to `m`'s import graph — only animation
 * dispatch ever reads it, and dispatch is in the feature path. Moving the
 * impl here keeps it out of `m.div`'s bundle.
 */
export function getAnimationMotionValue(
  handle: MotionHandle,
  key: string,
  fallback: AnyResolvedKeyframe | null | undefined,
): MotionValue {
  const visualElement = handle.visualElement
  const fromVE = visualElement?.values.get(key)
  const registry = handle.getValueRegistry()
  const fromRegistry = registry.get(key)
  if (fromVE) {
    // Sync into the registry on first encounter so future Solid-side
    // consumers find the MV without going through the VE.
    if (!fromRegistry) {
      registry.setExternal(key, fromVE)
    }
    return fromVE
  }
  if (visualElement) {
    const value = visualElement.getValue(key, fallback)
    registry.setExternal(key, value)
    return value
  }
  if (fromRegistry) {
    return fromRegistry
  }
  const mv = registry.getOrCreateTransient(key, fallback)
  handle.visualElement?.addValue(key, mv)
  handle.attachStyleWriter(mv)
  return mv
}

/**
 * Reactive prefers-reduced-motion + motion-config composition. Mirrors
 * motion-dom's `visualElement.shouldReduceMotion` but stays Solid-reactive:
 * a system preference change re-fires consumers, and a runtime change to
 * `motionConfig.reducedMotion` reflects on the next read.
 *
 * The config short-circuits for `'never'`/`'always'` so the singleton is
 * not touched in those modes — important for the listener-init tests
 * which assert matchMedia stays un-init'd when the config wins outright.
 */
export function shouldReduceMotion(handle: MotionHandle): boolean {
  const config = handle.options.motionConfig?.reducedMotion
  if (config === 'always') return true
  if (config === 'never') return false
  return getSystemReducedMotion()
}
