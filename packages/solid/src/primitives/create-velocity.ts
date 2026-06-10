import { type MotionValue, frame, motionValue } from 'motion-dom'

import { createMotionValueEvent } from '@/primitives/create-motion-value-event'

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
  const velocity = motionValue(value.getVelocity())

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
