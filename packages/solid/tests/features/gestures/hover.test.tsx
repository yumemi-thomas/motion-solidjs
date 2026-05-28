// Ported from motion/react: packages/framer-motion/src/gestures/__tests__/hover.test.tsx
import { cleanup, render } from '@solidjs/testing-library'
import { frame, isDragging, motionValue } from 'motion-dom'
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

  // --- Ported from motion/react hover.test.tsx (cases not previously covered) ---

  it('Correctly uses transition applied to initial', async () => {
    const opacity = motionValue(0.9)
    const result = await new Promise<number>((resolve) => {
      let hasMousedOut = false
      const onComplete = () => {
        frame.postRender(() => hasMousedOut && resolve(opacity.get()))
      }
      const wrapper = render(() => (
        <motion.div
          data-testid="m"
          whileHover="hidden"
          variants={{
            initial: { opacity: 0.9, transition: { type: false } },
            hidden: { opacity: 0.5, transition: { type: false }, transitionEnd: { opacity: 0.75 } },
          }}
          style={{ opacity }}
          onAnimationComplete={onComplete}
        />
      ))
      pointerEnter(wrapper.getByTestId('m'))
      void nextFrame().then(() => {
        setTimeout(() => {
          hasMousedOut = true
          pointerLeave(wrapper.getByTestId('m'))
        }, 10)
      })
    })
    expect(result).toBe(0.9)
  })

  it('whileHover is unapplied after drag ends when pointer left element during drag', async () => {
    const opacity = motionValue(1)
    const wrapper = render(() => (
      <motion.div
        data-testid="m"
        whileHover={{ opacity: 0.5 }}
        transition={{ type: false }}
        style={{ opacity }}
      />
    ))
    const element = wrapper.getByTestId('m')

    pointerEnter(element)
    await nextFrame()
    expect(opacity.get()).toBe(0.5)

    pointerDown(element)
    isDragging.x = true

    pointerLeave(element)
    await nextFrame()
    expect(opacity.get()).toBe(0.5)

    isDragging.x = false
    pointerUp(element)
    await nextFrame()
    expect(opacity.get()).toBe(1)
  })

  it('whileHover remains active when pointer is over element after drag ends', async () => {
    const opacity = motionValue(1)
    const wrapper = render(() => (
      <motion.div
        data-testid="m"
        whileHover={{ opacity: 0.5 }}
        transition={{ type: false }}
        style={{ opacity }}
      />
    ))
    const element = wrapper.getByTestId('m')

    pointerEnter(element)
    await nextFrame()
    expect(opacity.get()).toBe(0.5)

    pointerDown(element)
    isDragging.x = true

    isDragging.x = false
    pointerUp(element)
    await nextFrame()
    expect(opacity.get()).toBe(0.5)
  })

  it('whileHover stays active during press and deactivates on release outside element', async () => {
    const opacity = motionValue(1)
    const wrapper = render(() => (
      <motion.div
        data-testid="m"
        whileHover={{ opacity: 0.5 }}
        transition={{ type: false }}
        style={{ opacity }}
      />
    ))
    const element = wrapper.getByTestId('m')

    pointerEnter(element)
    await nextFrame()
    expect(opacity.get()).toBe(0.5)

    pointerDown(element)
    pointerLeave(element)
    await nextFrame()
    expect(opacity.get()).toBe(0.5)

    pointerUp(element)
    await nextFrame()
    expect(opacity.get()).toBe(1)
  })

  it('whileHover stays active during press when pointer leaves before drag starts', async () => {
    const opacity = motionValue(1)
    const wrapper = render(() => (
      <motion.div
        data-testid="m"
        drag
        whileHover={{ opacity: 0.5 }}
        transition={{ type: false }}
        style={{ opacity }}
      />
    ))
    const element = wrapper.getByTestId('m')

    pointerEnter(element)
    await nextFrame()
    expect(opacity.get()).toBe(0.5)

    pointerDown(element)
    pointerLeave(element)
    await nextFrame()
    expect(opacity.get()).toBe(0.5)

    pointerUp(element)
    await nextFrame()
    expect(opacity.get()).toBe(1)
  })

  it("whileHover only animates values that aren't being controlled by a higher-priority gesture", async () => {
    const opacity = motionValue(1)
    const scale = motionValue(1)
    const wrapper = render(() => (
      <motion.div
        data-testid="m"
        whileHover="hovering"
        whileTap="tapping"
        variants={{ hovering: { opacity: 0.5, scale: 0.5 }, tapping: { scale: 2 } }}
        transition={{ type: false }}
        style={{ opacity, scale }}
      />
    ))
    const element = wrapper.getByTestId('m')

    await nextFrame()
    pointerDown(element)

    await nextFrame()
    pointerEnter(element)

    await nextFrame()
    expect([opacity.get(), scale.get()]).toEqual([0.5, 2])
  })
})
