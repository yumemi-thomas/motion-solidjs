import { createEffect, onCleanup } from 'solid-js'
import {
  type FollowValueOptions,
  type MotionValue,
  type SpringOptions,
  attachFollow,
  isMotionValue,
  motionValue,
} from 'motion-dom'

import { type MaybeAccessor, isAccessor, resolveAccessor } from '@/types'
import { bridgeAccessor } from '@/primitives/bridge-accessor'

type AnyResolvedKeyframe = string | number

/**
 * Normalises a follow `source` into something `attachFollow` can track. A
 * Solid accessor (`() => value`) is bridged into a driver `MotionValue`;
 * plain values and existing `MotionValue`s pass through untouched.
 */
function resolveFollowSource<T extends AnyResolvedKeyframe>(
  source: MaybeAccessor<T> | MotionValue<T>,
): T | MotionValue<T> {
  return isAccessor(source) ? bridgeAccessor(source) : source
}

/**
 * Returns a `MotionValue` that tracks `source` through the animation defined
 * by `options` (any transition shape: tween, spring, inertia, …). When
 * `options` is a getter the follow is re-attached as the config changes.
 *
 * `source` may be a plain value, a `MotionValue`, or a Solid accessor
 * (`() => value`) — passing an accessor makes the follow retarget reactively.
 *
 * @example
 * ```tsx
 * const x = createMotionValue(0)
 * const smoothX = createFollowValue(x, { type: 'tween', duration: 0.3 })
 *
 * // Reactive accessor source
 * const [pct, setPct] = createSignal(0)
 * const smoothPct = createFollowValue(() => pct(), { type: 'tween', duration: 0.3 })
 *
 * return <motion.div style={{ x: smoothX }} />
 * ```
 */
export function createFollowValue<T extends AnyResolvedKeyframe>(
  source: MaybeAccessor<T> | MotionValue<T>,
  options: MaybeAccessor<FollowValueOptions> = {},
) {
  const resolved = resolveFollowSource(source)
  const value = motionValue(isMotionValue(resolved) ? resolved.get() : resolved)

  let cleanup: VoidFunction | undefined

  createEffect(() => {
    cleanup = attachFollow(value, resolved, resolveAccessor(options))
    onCleanup(() => {
      cleanup?.()
    })
  })

  return value
}

/**
 * Spring-smoothed `MotionValue` that follows `source`. `source` may be a
 * plain value (becomes the spring target), another `MotionValue` (the spring
 * chases its current value), or a Solid accessor (`() => value`) — passing an
 * accessor retargets the spring reactively as its dependencies change.
 * `config` may be a getter — passing a reactive config re-attaches the spring
 * with the new physics.
 *
 * @example
 * ```tsx
 * const x = createMotionValue(0)
 * const smoothX = createSpring(x, { stiffness: 200, damping: 20 })
 *
 * // Reactive accessor source
 * const [text, setText] = createSignal('')
 * const ratio = createSpring(() => text().length / LIMIT, { stiffness: 200, damping: 24 })
 *
 * return (
 *   <motion.div
 *     style={{ x: smoothX }}
 *     onClick={() => x.set(x.get() + 100)}
 *   />
 * )
 * ```
 */
export function createSpring(
  source: MaybeAccessor<number> | MotionValue<number>,
  config?: MaybeAccessor<SpringOptions>,
): MotionValue<number>
export function createSpring(
  source: MaybeAccessor<string> | MotionValue<string>,
  config?: MaybeAccessor<SpringOptions>,
): MotionValue<string>
export function createSpring(
  source: MaybeAccessor<string | number> | MotionValue<string> | MotionValue<number>,
  config: MaybeAccessor<SpringOptions> = {},
) {
  const resolved = resolveFollowSource(source)
  const value = motionValue(isMotionValue(resolved) ? resolved.get() : resolved)

  createEffect(() => {
    const cleanup = attachFollow(value, resolved, { type: 'spring', ...resolveAccessor(config) })
    onCleanup(() => {
      cleanup?.()
    })
  })

  return value
}
