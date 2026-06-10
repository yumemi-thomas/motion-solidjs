import { createSignal, untrack } from 'solid-js'

import type { MotionHandle } from './create-motion'
import type { PresenceRegistration, PresenceRegistrationLifecycle } from './presence-registration'

/**
 * The per-handle machinery that only matters once animations can run:
 * AnimatePresence exit/enter registration. Value tracking and style writing
 * live on motion-dom's VisualElement, which feature bundles construct via
 * their `renderer`.
 *
 * Bare `m` (rendered before any feature bundle) is static — exactly like
 * motion/react, where no VisualElement exists and style MotionValues don't
 * live-update until a LazyMotion bundle resolves. Keeping these modules out
 * of the core import graph also keeps motion-dom's frameloop and presence
 * wiring out of the bare-`m` bundle.
 *
 * Feature bundles (domMin / domAnimation / domMax) carry the implementation
 * (see `FeatureBundle.machinery`) and install it here once, globally.
 */
export interface MotionMachinery {
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
