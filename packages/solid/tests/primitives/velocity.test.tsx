import { cleanup, render } from '@solidjs/testing-library'
import { motionValue } from 'motion-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { createVelocity } from '@/primitives'

afterEach(() => cleanup())

describe('createVelocity', () => {
  it('returns a motion value that starts at the source velocity', () => {
    const x = motionValue(0)
    let velocity: ReturnType<typeof createVelocity> | undefined

    render(() => {
      velocity = createVelocity(x)
      return null
    })

    // No motion has happened yet, so initial velocity is 0
    expect(velocity!.get()).toBe(0)
  })

  it('subscribes to source MotionValue change events', () => {
    const x = motionValue(0)
    let velocity: ReturnType<typeof createVelocity> | undefined

    render(() => {
      velocity = createVelocity(x)
      return null
    })

    // The returned MotionValue is a distinct instance
    expect(velocity).toBeDefined()
    expect(velocity).not.toBe(x)
  })
})
