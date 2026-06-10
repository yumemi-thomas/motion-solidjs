import type { MotionValue } from 'motion-dom'
import { createSignal, untrack } from 'solid-js'

import type { MotionHandle } from './create-motion'
import type { PresenceRegistration, PresenceRegistrationLifecycle } from './presence-registration'
import type { createStyleWriterLifecycle } from './style-writer-lifecycle'
import type { ValueRegistry } from './value-registry'

/**
 * The per-handle machinery that only matters once animations can run: the
 * MotionValue registry, the registry-driven style writer, and AnimatePresence
 * exit/enter registration.
 *
 * Bare `m` (rendered before any feature bundle) is static — exactly like
 * motion/react, where no VisualElement exists and style MotionValues don't
 * live-update until a LazyMotion bundle resolves. Keeping these modules out
 * of the core import graph also keeps motion-dom's `MotionValue` class and
 * frameloop out of the bare-`m` bundle.
 *
 * Feature bundles (domMin / domAnimation / domMax) carry the implementation
 * (see `FeatureBundle.machinery`) and install it here once, globally.
 */
export interface MotionMachinery {
  createValueRegistry(): ValueRegistry
  createStyleWriterLifecycle: typeof createStyleWriterLifecycle
  createPresenceRegistration(
    handle: MotionHandle,
    lifecycle: PresenceRegistrationLifecycle,
  ): PresenceRegistration
}

const [machinery, setMachinery] = createSignal<MotionMachinery | undefined>(undefined)

/**
 * Reactive accessor for the installed machinery. Reading it inside a tracked
 * scope (e.g. the attrs computation) subscribes that scope to the single
 * install event — the Solid analogue of motion/react re-rendering when lazy
 * features resolve.
 */
export const motionMachinery = machinery

export function installMotionMachinery(implementation: MotionMachinery): void {
  if (untrack(machinery)) return
  setMachinery(() => implementation)
}

const emptyValues = new Map<string, MotionValue>()

/**
 * Registry stub used before machinery installs. Read paths behave as "no
 * values registered"; the write paths that must hand back a real MotionValue
 * are only reachable from feature code, which can't run without machinery.
 */
export const inertValueRegistry: ValueRegistry = {
  get: () => undefined,
  has: () => false,
  size: 0,
  setExternal: () => {},
  setStatic: () => {
    throw new Error('motion-solidjs: value registry written before features loaded')
  },
  getOrCreateTransient: () => {
    throw new Error('motion-solidjs: value registry written before features loaded')
  },
  entries: () => emptyValues.entries(),
  dispose: () => {},
}
