import { animate } from 'motion'
import { frame, motionValue } from 'motion-dom'
import { describe, expect, it, vi } from 'vitest'

// Ported from framer-motion's value/__tests__/motion-value.test.ts.
describe('framer parity — motionValue animation events', () => {
  it('fires animationStart', () => {
    const value = motionValue(0)
    const callback = vi.fn()

    value.on('animationStart', callback)
    animate(value, 2)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('fires animationCancel', () => {
    const value = motionValue(0)
    const callback = vi.fn()

    value.on('animationCancel', callback)
    animate(value, 1)
    animate(value, 2)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('fires animationComplete', async () => {
    const value = motionValue(0)
    const callback = vi.fn()

    value.on('animationComplete', callback)
    animate(value, 1, { duration: 0.01 })

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('stops animation when all change listeners are removed', async () => {
    const value = motionValue(0)
    const unsubscribeA = value.on('change', (latest) => latest)
    const unsubscribeB = value.on('change', (latest) => latest)

    animate(value, 100)
    expect(value.isAnimating()).toBe(true)

    unsubscribeA()
    expect(value.isAnimating()).toBe(true)
    unsubscribeB()

    await new Promise<void>((resolve) => frame.postRender(() => resolve()))
    expect(value.isAnimating()).toBe(false)
  })
})
