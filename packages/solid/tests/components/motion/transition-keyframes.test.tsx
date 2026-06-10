// Ported from motion/react: packages/framer-motion/src/motion/__tests__/transition-keyframes.test.tsx
// `rerender` → `createSignal`; jest-dom `toHaveStyle` → local expectStyle.
import { cleanup, render } from '@solidjs/testing-library'
import { checkVariantsDidChange, motionValue } from 'motion-dom'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { nextFrame } from '../../features/gestures/drag-test-utils'

afterEach(() => cleanup())

const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase()
function styleOf(el: Element, prop: string): string {
  const raw = (el as HTMLElement).style.getPropertyValue(prop)
  if (prop === 'transform' && raw === '') return 'none'
  return raw
}
function expectStyle(el: Element, decl: string) {
  const idx = decl.indexOf(':')
  const prop = decl.slice(0, idx).trim()
  const expected = decl.slice(idx + 1).trim()
  expect(norm(styleOf(el, prop))).toBe(norm(expected))
}

describe('keyframes transition', () => {
  it('keyframes as target', async () => {
    const element = await new Promise<Element>((resolve) => {
      const wrapper = render(() => (
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: [10, 200] }}
          transition={{ duration: 0.1 }}
          onAnimationComplete={() =>
            requestAnimationFrame(() => resolve(wrapper.container.firstChild as Element))
          }
        />
      ))
    })
    expectStyle(element, 'transform: translateX(200px)')
  })

  it('hasUpdated detects only changed keyframe arrays', () => {
    expect(checkVariantsDidChange('1', '2')).toBe(true)
    expect(checkVariantsDidChange(['1', '2', '3'], ['1', '2', '3'])).toBe(false)
    expect(checkVariantsDidChange(['1', '2', '3'], ['1', '2', '4'])).toBe(true)
  })

  it('keyframes with non-pixel values', async () => {
    const element = await new Promise<Element>((resolve) => {
      const wrapper = render(() => (
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: ['0%', '100%'] }}
          transition={{ duration: 0.1 }}
          onAnimationComplete={() =>
            requestAnimationFrame(() => resolve(wrapper.container.firstChild as Element))
          }
        />
      ))
    })
    expectStyle(element, 'width: 100%')
  })

  it('if initial={false}, take state of final keyframe', async () => {
    const x = motionValue(0)
    const xResult = await new Promise<number>((resolve) => {
      render(() => (
        <motion.div
          initial={false}
          animate="a"
          variants={{ a: { x: [0, 100] }, b: { x: [0, 100] } }}
          transition={{ ease: () => 0.5, duration: 10 }}
          style={{ x }}
        />
      ))
      setTimeout(() => resolve(x.get()), 50)
    })
    expect(xResult).toBe(100)
  })

  it('keyframes animation reruns when variants change and keyframes are the same', async () => {
    const x = motionValue(0)
    const [animate, setAnimate] = createSignal('a')
    render(() => (
      <motion.div
        initial={false}
        animate={animate()}
        variants={{ a: { x: [0, 100] }, b: { x: [0, 100], transition: { type: false } } }}
        transition={{ ease: () => 0.5, duration: 10 }}
        style={{ x }}
      />
    ))
    // Solid batches synchronous signal writes into one update, so unlike
    // React's discrete rerenders we must let each variant change flush before
    // the next to drive the a→b→a sequence.
    await nextFrame()
    setAnimate('b')
    await nextFrame()
    setAnimate('a')
    await new Promise((r) => setTimeout(r, 50))
    expect(x.get()).toBe(50)
  })

  it('issue #2855: keyframes with shared values across variants rerun on each change', async () => {
    const z = motionValue(0)
    const updateCounts: number[] = []
    const [animate, setAnimate] = createSignal('start')

    render(() => (
      <motion.div
        animate={animate()}
        variants={{ start: { rotateZ: [0, 10, 0] }, end: { rotateZ: [0, 10, 0] } }}
        transition={{ duration: 0.05, ease: 'linear' }}
        style={{ rotateZ: z }}
      />
    ))

    const recordAndReset = async () => {
      let count = 0
      const unsubscribe = z.on('change', () => count++)
      await new Promise((r) => setTimeout(r, 100))
      unsubscribe()
      updateCounts.push(count)
    }

    await recordAndReset()
    setAnimate('end')
    await recordAndReset()
    setAnimate('start')
    await recordAndReset()

    expect(updateCounts[0]).toBeGreaterThan(0)
    expect(updateCounts[1]).toBeGreaterThan(0)
    expect(updateCounts[2]).toBeGreaterThan(0)
  })

  it('times works as expected', async () => {
    const values = await new Promise<number[]>((resolve) => {
      const output: number[] = []
      render(() => (
        <motion.div
          animate={{ x: [50, 100, 200, 300] }}
          transition={{ duration: 0.1, times: [0, 0, 1, 1] }}
          onUpdate={(latest: { x: number }) => output.push(Math.round(latest.x))}
          onAnimationComplete={() => resolve(output)}
          style={{ 'will-change': 'auto' }}
        />
      ))
    })
    expect(values[0] >= 100).toBe(true)
    expect(values[values.length - 2] <= 200).toBe(true)
  })
})
