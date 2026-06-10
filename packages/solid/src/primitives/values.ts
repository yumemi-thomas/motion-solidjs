// Short MotionValue helpers. Larger helpers (createTransform, createScroll)
// live in their own files.
import { createEffect, getOwner, onCleanup } from 'solid-js'
import {
  type FollowValueOptions,
  type FrameData,
  type MotionValue,
  type MotionValueEventCallbacks,
  type SpringOptions,
  attachFollow,
  cancelFrame,
  collectMotionValues,
  frame,
  isMotionValue,
  motionValue as createMotionValue,
} from 'motion-dom'
import { motionValue, isMotionValue as isMV } from 'motion-dom'
import type { MotionValue as MV } from 'motion-dom'

import { type MaybeAccessor, isAccessor, resolveAccessor } from '@/types'

// ---------- Animation-frame helper (only consumer of `frame.update` here) ----------
type FrameCallback = (timestamp: number, delta: number) => void

function createAnimationFrame(callback: FrameCallback) {
  let initialTimestamp = 0
  const provideTimeSinceStart = ({ timestamp, delta }: FrameData) => {
    if (!initialTimestamp) initialTimestamp = timestamp
    callback(timestamp - initialTimestamp, delta)
  }
  frame.update(provideTimeSinceStart, true)
  onCleanup(() => cancelFrame(provideTimeSinceStart))
}

// ---------- createCombinedMotionValue ----------

/**
 * Low-level primitive: returns a `MotionValue<T>` whose value is recomputed
 * from `combineValues()` whenever a subscribed source emits. Callers wire
 * sources up explicitly via the returned `subscribe(values)`. Most consumers
 * want `createTransform` / `createComputed` / `createMotionTemplate` instead.
 */
export function createCombinedMotionValue<T>(combineValues: () => T) {
  const value = motionValue(combineValues())

  /**
   * Create a function that will update the template motion value with the latest values.
   * This is pre-bound so whenever a motion value updates it can schedule its
   * execution in Framesync. If it's already been scheduled it won't be fired twice
   * in a single frame.
   */
  const updateValue = () => value.set(combineValues())

  const scheduleUpdate = () => frame.preRender(updateValue, false, true)
  let subscriptions: VoidFunction[]

  const subscribe = (values: MotionValue[]) => {
    subscriptions = values.map((v) => v.on('change', scheduleUpdate))
  }
  const unsubscribe = () => {
    subscriptions.forEach((unsubscribe) => unsubscribe())
    cancelFrame(updateValue)
  }

  if (getOwner()) {
    onCleanup(() => {
      unsubscribe()
    })
  }
  return {
    subscribe,
    unsubscribe,
    value,
    updateValue,
  }
}

// ---------- createMotionTemplate ----------

/**
 * Combine multiple motion values into a single string-valued motion value
 * using template-literal syntax. Interpolated values may be `MotionValue`s,
 * plain numbers/strings, or Solid accessors (`() => value`) — accessors make
 * that segment of the template update reactively.
 *
 * ```tsx
 * const shadowX = createSpring(0)
 * const shadowY = createMotionValue(0)
 * const shadow = createMotionTemplate`drop-shadow(${shadowX}px ${shadowY}px 20px rgba(0,0,0,0.3))`
 *
 * return <motion.div style={{ filter: shadow }} />
 * ```
 *
 * @public
 */
export function createMotionTemplate(
  fragments: TemplateStringsArray,
  ...values: Array<MaybeAccessor<string | number> | MotionValue>
) {
  // Accessors become driver MotionValues so the combined value can subscribe.
  const resolved = values.map((value) => (isAccessor(value) ? bridgeAccessor(value) : value))

  /**
   * Build the string by interleaving the literal fragments with the current
   * value of each interpolated motion value.
   */
  const numFragments = fragments.length

  function buildValue() {
    let output = ''

    for (let i = 0; i < numFragments; i++) {
      output += fragments[i]
      const value = resolved[i]
      if (value !== undefined && value !== null) {
        output += isMotionValue(value) ? value.get() : value
      }
    }

    return output
  }
  const { value, subscribe } = createCombinedMotionValue(buildValue)

  subscribe(resolved.filter(isMotionValue))

  return value
}

// ---------- createComputed ----------

/**
 * Derives a `MotionValue` from a computation that reads other MotionValues.
 * Dependencies are auto-tracked via `collectMotionValues`, and re-tracked on
 * every Solid effect run, so dependency sets can change between updates.
 *
 * @example
 * ```tsx
 * const x = createMotionValue(0)
 * const y = createMotionValue(0)
 * const distance = createComputed(() => Math.hypot(x.get(), y.get()))
 * ```
 */
export function createComputed<T>(computed: () => T): MotionValue<T> {
  /**
   * Open session of collectMotionValues. Any MotionValue that calls get()
   * will be saved into this array.
   */
  collectMotionValues.current = []

  const { value, subscribe, unsubscribe, updateValue } = createCombinedMotionValue<T>(computed)

  subscribe(collectMotionValues.current)

  collectMotionValues.current = undefined

  createEffect(() => {
    unsubscribe()
    collectMotionValues.current = []
    updateValue()
    subscribe(collectMotionValues.current)
    collectMotionValues.current = undefined
  })

  return value
}

// ---------- createMotionValueEvent ----------

/**
 * Subscribe to `MotionValue` events (`"change"`, `"renderRequest"`, …) with
 * automatic Solid cleanup on owner disposal.
 *
 * @example
 * ```tsx
 * const x = createMotionValue(0)
 * createMotionValueEvent(x, 'change', (latest) => {
 *   console.log('x is now', latest)
 * })
 * ```
 */
export function createMotionValueEvent<V, EventName extends keyof MotionValueEventCallbacks<V>>(
  value: MotionValue<V>,
  event: EventName,
  callback: MotionValueEventCallbacks<V>[EventName],
) {
  const unlisten = value.on(event, callback)

  onCleanup(() => {
    unlisten()
  })

  return unlisten
}

// ---------- createTime ----------

/**
 * `MotionValue<number>` that updates each animation frame with the
 * milliseconds elapsed since creation. Useful as a driver for time-based
 * transforms.
 *
 * @example
 * ```tsx
 * const time = createTime()
 * const rotate = createTransform(time, (t) => (t / 20) % 360)
 *
 * return <motion.div style={{ rotate }} />
 * ```
 */
export function createTime() {
  const time = motionValue(0)
  createAnimationFrame((t) => time.set(t))
  return time
}

// ---------- createVelocity ----------

/**
 * Create a MotionValue that updates when the provided MotionValue's
 * velocity changes.
 *
 * ```tsx
 * const x = createMotionValue(0)
 * const xVelocity = createVelocity(x)
 * const xAcceleration = createVelocity(xVelocity)
 * ```
 *
 * @public
 */
export function createVelocity(value: MotionValue<number>): MotionValue<number> {
  const velocity = createMotionValue(value.getVelocity())

  const updateVelocity = () => {
    const latest = value.getVelocity()
    velocity.set(latest)

    /**
     * If there's still velocity, schedule another check next frame so the
     * returned MotionValue keeps tracking until the source comes to rest.
     */
    if (latest) {
      frame.update(updateVelocity)
    }
  }

  createMotionValueEvent(value, 'change', () => {
    // Schedule the velocity read for the end of the current frame so the
    // source motion value has settled before we sample.
    frame.update(updateVelocity, false, true)
  })

  return velocity
}

// ---------- createFollowValue / createSpring ----------

type AnyResolvedKeyframe = string | number

/**
 * Bridges a Solid accessor into a driver `MotionValue` that re-reads the
 * accessor inside a tracked effect, so any MotionValue consumer downstream
 * updates whenever the accessor's reactive dependencies change.
 *
 * The read lives in its own effect on purpose. For follow/spring sources this
 * means the in-flight animation keeps its momentum — feeding the accessor
 * straight into the `attachFollow` effect would tear down and re-create the
 * animation on every change, restarting it and dropping spring velocity.
 */
function bridgeAccessor<T extends AnyResolvedKeyframe>(accessor: () => T): MV<T> {
  const driver = motionValue(accessor())
  createEffect(() => {
    driver.set(accessor())
  })

  return driver
}

/**
 * Normalises a follow `source` into something `attachFollow` can track. A
 * Solid accessor (`() => value`) is bridged into a driver `MotionValue`;
 * plain values and existing `MotionValue`s pass through untouched.
 */
function resolveFollowSource<T extends AnyResolvedKeyframe>(
  source: MaybeAccessor<T> | MV<T>,
): T | MV<T> {
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
  source: MaybeAccessor<T> | MV<T>,
  options: MaybeAccessor<FollowValueOptions> = {},
) {
  const resolved = resolveFollowSource(source)
  const value = motionValue(isMV(resolved) ? resolved.get() : resolved)

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
  source: MaybeAccessor<number> | MV<number>,
  config?: MaybeAccessor<SpringOptions>,
): MV<number>
export function createSpring(
  source: MaybeAccessor<string> | MV<string>,
  config?: MaybeAccessor<SpringOptions>,
): MV<string>
export function createSpring(
  source: MaybeAccessor<string | number> | MV<string> | MV<number>,
  config: MaybeAccessor<SpringOptions> = {},
) {
  const resolved = resolveFollowSource(source)
  const value = motionValue(isMV(resolved) ? resolved.get() : resolved)

  createEffect(() => {
    const cleanup = attachFollow(value, resolved, { type: 'spring', ...resolveAccessor(config) })
    onCleanup(() => {
      cleanup?.()
    })
  })

  return value
}
