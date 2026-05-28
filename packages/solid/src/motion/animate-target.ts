import type {
  AnimationPlaybackControlsWithThen,
  TargetAndTransition,
  Transition,
  ValueAnimationTransition,
} from 'motion-dom'
import {
  animateMotionValue,
  frame,
  getValueTransition,
  positionalKeys,
  resolveTransition,
} from 'motion-dom'
import type { MotionHandle } from '@/motion/create-motion'
import { getAnimationMotionValue, shouldReduceMotion } from '@/motion/motion-handle-feature-methods'

// Solid-side replacement for motion-dom's `animateTarget(ve, target, opts)`.
// Uses `mv.start(animateMotionValue(...))` so completion waits for queued
// `frame.update` side-effects (transitionEnd must not race ahead of motion's
// queued `mv.set`). Protected-keys state is threaded explicitly rather than
// read off `ve.animationState`. Per-key `mv.jump` for transitionEnd stops
// in-flight tweens and keeps `ve.latestValues` consistent via MV subscribers.

/** Minimal shape required from the per-type animation state for gating. */
interface ProtectedKeysState {
  protectedKeys: Record<string, true>
  needsAnimating: Record<string, boolean>
}

export interface AnimateTargetOptions {
  delay?: number
  transitionOverride?: Transition
  /** Per-type state machine slice — when present, applies the protected-keys gate. */
  protectedState?: ProtectedKeysState
}

function shouldBlockAnimation(state: ProtectedKeysState, key: string): boolean {
  const shouldBlock = Object.hasOwn(state.protectedKeys, key) && state.needsAnimating[key] !== true
  state.needsAnimating[key] = false
  return shouldBlock
}

export function animateTarget(
  handle: MotionHandle,
  targetAndTransition: TargetAndTransition,
  options: AnimateTargetOptions = {},
): Promise<unknown>[] {
  const { delay = 0, transitionOverride, protectedState } = options
  const { transition, transitionEnd, ...target } = targetAndTransition

  const defaultTransition = handle.options.transition
  let resolvedTransition = transition
    ? resolveTransition(transition, defaultTransition)
    : defaultTransition
  const reduceMotion = resolvedTransition?.reduceMotion
  const skipAnimations = resolvedTransition?.skipAnimations
  if (transitionOverride) resolvedTransition = transitionOverride

  const completions: Promise<unknown>[] = []
  // `animateMotionValue` scopes WAAPI to the VE when present; without it we
  // get a JSAnimation and paints flow through MV subscribers. Captured here
  // so the hot loop doesn't re-read.
  let ve = handle.visualElement

  // `transition.path = arc()` (motion-dom 12.40, upstream PR #3699) routes
  // x/y through a `MotionPath` that drives a curved trajectory. It claims
  // `target.x`/`target.y` (deleting them from `target`) and pushes its own
  // progress animation into `pathAnimations`; the per-key loop below then
  // skips x/y. A VE is required: the path reads `ve.latestValues` for
  // continuity and writes to `ve`-registered MVs (including a private
  // `pathRotation` channel composed onto user `rotate`).
  const path = resolvedTransition?.path
  if (path) {
    if (!ve) ve = handle.ensureVisualElement()
    if (ve) {
      const pathAnimations: AnimationPlaybackControlsWithThen[] = []
      path.animateVisualElement(ve, target, resolvedTransition, delay, pathAnimations)
      // `AnimationPlaybackControlsWithThen.then` takes `VoidFunction` not a
      // value-receiving fulfilment handler, so it doesn't match `PromiseLike`
      // structurally. Wrap into a real Promise so Promise.all in the consumer
      // (features/animation.ts) doesn't have to widen its element type.
      for (const anim of pathAnimations) {
        completions.push(
          new Promise<void>((resolve) =>
            anim.then(
              () => resolve(),
              () => resolve(),
            ),
          ),
        )
      }
    }
  }

  for (const [key, valueTarget] of Object.entries(target)) {
    if (valueTarget === undefined) continue
    if (protectedState && shouldBlockAnimation(protectedState, key)) continue

    const fallback = handle.latestValues[key] ?? null
    const mv = getAnimationMotionValue(handle, key, fallback)

    const valueTransition: ValueAnimationTransition = {
      delay,
      ...getValueTransition(resolvedTransition ?? {}, key),
    }
    if (skipAnimations) valueTransition.skipAnimations = true

    // Value-stable bail: if the MV is already at the target value and not
    // animating, re-assert via `mv.set` on the next frame and skip creating a
    // tween. The re-assert beats any stale transitionEnd callback from a
    // previously-running animation.
    const currentValue = mv.get()
    if (
      currentValue !== undefined &&
      !mv.isAnimating() &&
      !Array.isArray(valueTarget) &&
      valueTarget === currentValue &&
      !valueTransition.velocity
    ) {
      frame.update(() => mv.set(valueTarget))
      continue
    }

    const reduce = reduceMotion ?? shouldReduceMotion(handle)
    const effectiveTransition: ValueAnimationTransition =
      reduce && positionalKeys.has(key) ? { ...valueTransition, type: false } : valueTransition

    completions.push(mv.start(animateMotionValue(key, mv, valueTarget, effectiveTransition, ve)))
  }

  if (transitionEnd) {
    const applyTransitionEnd = () =>
      frame.update(() => {
        for (const [key, value] of Object.entries(transitionEnd)) {
          if (value === undefined) continue
          const mv = getAnimationMotionValue(handle, key, value)
          mv.jump(value)
        }
      })
    if (completions.length) {
      Promise.all(completions).then(applyTransitionEnd)
    } else {
      applyTransitionEnd()
    }
  }

  return completions
}
