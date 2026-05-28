// Ported from motion/react: packages/framer-motion/src/motion/__tests__/delay.test.tsx
// Each case asserts that with a 1s delay (and instant/short transitions) the
// value has NOT moved by the next frame. `rerender` is dropped (Solid wires the
// animation on mount); `requestAnimationFrame(...)` → `await nextFrame()`.
import { cleanup, render } from '@solidjs/testing-library'
import { motionValue, stagger } from 'motion-dom'
import type { Variants } from 'motion-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { nextFrame } from '../../features/gestures/drag-test-utils'

afterEach(() => cleanup())

describe('delay attr', () => {
  it('in transition prop', async () => {
    const x = motionValue(0)
    render(() => (
      <motion.div animate={{ x: 10 }} transition={{ delay: 1, type: false }} style={{ x }} />
    ))
    await nextFrame()
    expect(x.get()).toBe(0)
  })

  it('value-specific delay on instant transition', async () => {
    const x = motionValue(0)
    render(() => (
      <motion.div animate={{ x: 10 }} transition={{ x: { delay: 1, type: false } }} style={{ x }} />
    ))
    await nextFrame()
    expect(x.get()).toBe(0)
  })

  it('value-specific delay on animation', async () => {
    const x = motionValue(0)
    render(() => <motion.div animate={{ x: 10 }} transition={{ x: { delay: 1 } }} style={{ x }} />)
    await nextFrame()
    expect(x.get()).toBe(0)
  })

  it('in animate.transition', async () => {
    const x = motionValue(0)
    render(() => (
      <motion.div animate={{ x: 10, transition: { delay: 1, type: false } }} style={{ x }} />
    ))
    await nextFrame()
    expect(x.get()).toBe(0)
  })

  it('in variant', async () => {
    const x = motionValue(0)
    render(() => (
      <motion.div
        variants={{ visible: { x: 10, transition: { delay: 1, type: false } } }}
        animate="visible"
        style={{ x }}
      />
    ))
    await nextFrame()
    expect(x.get()).toBe(0)
  })

  it('in variant children via delayChildren', async () => {
    const x = motionValue(0)
    const parent: Variants = {
      visible: { x: 10, transition: { delay: 0, delayChildren: 1, type: false } },
    }
    const child: Variants = { visible: { x: 10, transition: { type: false } } }
    render(() => (
      <motion.div variants={parent} animate="visible">
        <motion.div variants={child} style={{ x }} />
      </motion.div>
    ))
    await nextFrame()
    expect(x.get()).toBe(0)
  })

  it('in variant children via staggerChildren', async () => {
    const x = motionValue(0)
    const parent: Variants = {
      visible: { x: 10, transition: { delay: 0, staggerChildren: 1, type: false } },
    }
    const child: Variants = { visible: { x: 10, transition: { type: false } } }
    render(() => (
      <motion.div variants={parent} animate="visible">
        <motion.div variants={child} />
        <motion.div variants={child} style={{ x }} />
      </motion.div>
    ))
    await nextFrame()
    expect(x.get()).toBe(0)
  })

  it('in variant children via delayChildren: stagger(interval)', async () => {
    const x = motionValue(0)
    const parent: Variants = {
      visible: { x: 10, transition: { delay: 0, delayChildren: stagger(1), type: false } },
    }
    const child: Variants = { visible: { x: 10, transition: { type: false } } }
    render(() => (
      <motion.div variants={parent} animate="visible">
        <motion.div variants={child} />
        <motion.div variants={child} style={{ x }} />
      </motion.div>
    ))
    await nextFrame()
    expect(x.get()).toBe(0)
  })
})
