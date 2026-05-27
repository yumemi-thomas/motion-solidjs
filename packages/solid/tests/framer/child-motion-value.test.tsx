import { cleanup, render } from '@solidjs/testing-library'
import { frame, motionValue } from 'motion-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'

afterEach(() => cleanup())

const nextPostRender = () => new Promise<void>((resolve) => frame.postRender(() => resolve()))

// Ported from framer-motion's src/motion/__tests__/child-motion-value.test.tsx.
describe('framer parity — child as MotionValue', () => {
  it('accepts motion values as children', () => {
    const child = motionValue(1)
    const wrapper = render(() => <motion.div>{child}</motion.div>)

    expect(wrapper.container.firstElementChild?.textContent).toBe('1')
  })

  it('accepts motion values as children for motion.text inside an svg', () => {
    const child = motionValue(3)
    const wrapper = render(() => (
      <svg>
        <motion.text>{child}</motion.text>
      </svg>
    ))

    expect(wrapper.container.querySelector('text')?.textContent).toBe('3')
  })

  it('updates textContent when the motion value changes', async () => {
    const child = motionValue(1)
    const wrapper = render(() => <motion.div>{child}</motion.div>)

    child.set(2)
    await nextPostRender()

    expect(wrapper.container.firstElementChild?.textContent).toBe('2')
  })

  it('updates svg text when the motion value changes', async () => {
    const child = motionValue(3)
    const wrapper = render(() => (
      <svg>
        <motion.text>{child}</motion.text>
      </svg>
    ))

    child.set(4)
    await nextPostRender()

    expect(wrapper.container.querySelector('text')?.textContent).toBe('4')
  })
})
