import { createEffect } from 'solid-js'
import { type MotionValue, motionValue } from 'motion-dom'

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
export function bridgeAccessor<T extends AnyResolvedKeyframe>(accessor: () => T): MotionValue<T> {
  const driver = motionValue(accessor())
  createEffect(() => {
    driver.set(accessor())
  })

  return driver
}
