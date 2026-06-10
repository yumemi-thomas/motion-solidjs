import { frame } from 'motion-dom'
import { MotionGlobalConfig } from 'motion-utils'

import { createInstantLayoutTransition } from './create-instant-layout-transition'

/**
 * Monotonic guard shared across calls: a scheduled unlock only fires if no
 * newer instant transition started in the meantime. Module-level (rather than
 * per-primitive) because `MotionGlobalConfig.instantAnimations` is itself a
 * global — two components racing instant transitions must not unlock each
 * other early. Mirrors upstream's `unlockOnFrameRef` render-count check.
 */
let instantTransitionGeneration = 0

/**
 * Returns a `startTransition` function: state changes performed inside its
 * callback apply with all animations disabled (they snap to their end
 * state), unblocking two frames later. Equivalent of motion/react's
 * `useInstantTransition`.
 *
 * Unlike the React version there's no forced re-render — Solid applies the
 * callback's updates synchronously — so the two-frame unlock is scheduled
 * directly from the call.
 *
 * @example
 * ```tsx
 * const startInstantTransition = createInstantTransition()
 *
 * return (
 *   <button onClick={() => startInstantTransition(() => setLayout('grid'))}>
 *     Switch instantly
 *   </button>
 * )
 * ```
 */
export function createInstantTransition(): (callback: () => void) => void {
  const startInstantLayoutTransition = createInstantLayoutTransition()

  return (callback: () => void) => {
    startInstantLayoutTransition(() => {
      MotionGlobalConfig.instantAnimations = true

      callback()

      const generation = ++instantTransitionGeneration
      // Unblock after two animation frames, otherwise this will unblock too
      // soon (animations started by the callback begin on the next frame).
      // Matches upstream useInstantTransition.
      frame.postRender(() =>
        frame.postRender(() => {
          if (generation !== instantTransitionGeneration) return
          MotionGlobalConfig.instantAnimations = false
        }),
      )
    })
  }
}

/**
 * Re-enable animations after an instant transition without waiting for the
 * automatic two-frame unlock. Mirrors motion/react's
 * `disableInstantTransitions`.
 */
export function disableInstantTransitions() {
  MotionGlobalConfig.instantAnimations = false
}
