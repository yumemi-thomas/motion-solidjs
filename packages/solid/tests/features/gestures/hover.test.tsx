// Ported from motion/react: packages/framer-motion/src/gestures/__tests__/hover.test.tsx
import { cleanup, render } from '@solidjs/testing-library'
import { motionValue } from 'motion-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { motion } from '@/components'
import { delay } from '#tests/utils'
import { nextFrame, pointerDown, pointerEnter, pointerLeave, pointerUp } from './drag-test-utils'

afterEach(() => cleanup())

describe('hover', () => {
  it('hover event listeners fire', async () => {
    const hoverIn = vi.fn()
    const hoverOut = vi.fn()

    const wrapper = render(() => (
      <motion.div data-testid="m" onHoverStart={hoverIn} onHoverEnd={hoverOut} />
    ))

    await nextFrame()

    const element = wrapper.getByTestId('m')
    pointerEnter(element)
    pointerLeave(element)
    await nextFrame()

    expect(hoverIn).toHaveBeenCalledTimes(1)
    expect(hoverOut).toHaveBeenCalledTimes(1)
  })

  it('filters touch events', async () => {
    const hoverIn = vi.fn()
    const hoverOut = vi.fn()

    const wrapper = render(() => (
      <motion.div data-testid="m" onHoverStart={hoverIn} onHoverEnd={hoverOut} />
    ))

    const element = wrapper.getByTestId('m')
    pointerEnter(element, { pointerType: 'touch' })
    pointerLeave(element, { pointerType: 'touch' })
    await nextFrame()

    expect(hoverIn).not.toHaveBeenCalled()
    expect(hoverOut).not.toHaveBeenCalled()
  })

  it('whileHover applied', async () => {
    const opacity = motionValue(1)

    const wrapper = render(() => (
      <motion.div
        data-testid="m"
        whileHover={{ opacity: 0 }}
        transition={{ type: false }}
        style={{ opacity }}
      />
    ))

    // Let the mount-time animation settle (matches upstream's double rerender).
    await nextFrame()
    await nextFrame()

    pointerEnter(wrapper.getByTestId('m'))
    await delay(15)

    expect(opacity.get()).toBe(0)
  })

  it('whileHover applied as variant', async () => {
    const opacity = motionValue(1)

    const wrapper = render(() => (
      <motion.div
        data-testid="m"
        whileHover="hidden"
        variants={{ hidden: { opacity: 0.5 } }}
        transition={{ type: false }}
        style={{ opacity }}
      />
    ))

    await nextFrame()
    await nextFrame()

    pointerEnter(wrapper.getByTestId('m'))
    await delay(15)

    expect(opacity.get()).toBe(0.5)
  })

  it('whileHover propagates to children', async () => {
    const opacity = motionValue(1)

    const wrapper = render(() => (
      <motion.div
        data-testid="parent"
        whileHover="hidden"
        variants={{ hidden: { opacity: 0.8 } }}
        transition={{ type: false }}
      >
        <motion.div
          data-testid="child"
          variants={{ hidden: { opacity: 0.2 } }}
          transition={{ type: false }}
          style={{ opacity }}
        />
      </motion.div>
    ))

    await nextFrame()
    await nextFrame()

    pointerEnter(wrapper.getByTestId('parent'))
    await delay(15)

    expect(opacity.get()).toBe(0.2)
  })

  it('whileHover is unapplied when hover ends', async () => {
    const opacity = motionValue(1)

    const wrapper = render(() => (
      <motion.div
        data-testid="m"
        whileHover={{ opacity: 0.5 }}
        transition={{ type: false }}
        style={{ opacity }}
      />
    ))

    await nextFrame()
    await nextFrame()

    const element = wrapper.getByTestId('m')
    pointerEnter(element)
    await delay(15)
    expect(opacity.get()).toBe(0.5)

    pointerLeave(element)
    await delay(15)
    expect(opacity.get()).toBe(1)
  })

  // motion-dom's hover() defers pointerleave until pointerup if a press
  // started on the element (mobile UX behaviour) — when the pointer is
  // released outside the element after press, hover should deactivate.
  it('whileHover deactivates on release outside element after press', async () => {
    const opacity = motionValue(1)

    const wrapper = render(() => (
      <motion.div
        data-testid="m"
        whileHover={{ opacity: 0.5 }}
        transition={{ type: false }}
        style={{ opacity }}
      />
    ))

    await nextFrame()
    await nextFrame()

    const element = wrapper.getByTestId('m')
    pointerEnter(element)
    await delay(15)
    expect(opacity.get()).toBe(0.5)

    pointerDown(element)
    pointerLeave(element)
    await nextFrame()
    // Hover should still be active because the pointer is still pressed.
    expect(opacity.get()).toBe(0.5)

    pointerUp(element)
    await delay(15)
    expect(opacity.get()).toBe(1)
  })
})
