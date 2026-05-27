import { cleanup, render } from '@solidjs/testing-library'
import { motionValue } from 'motion-dom'
import { createEffect, createSignal } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { MotionConfig, motion } from '@/components'
import { wait } from '../browser/helpers'

afterEach(() => cleanup())

// Ported from framer-motion's src/motion/__tests__/static-prop.test.tsx.
describe('framer parity — MotionConfig isStatic', () => {
  it('prevents rendering of animated values', async () => {
    const scale = motionValue(0)

    render(() => (
      <MotionConfig isStatic>
        <motion.div animate={{ scale: 2 }} transition={{ type: false }} style={{ scale }} />
      </MotionConfig>
    ))

    await wait(50)
    expect(scale.get()).toBe(0)
  })

  it('permits updating transform values via style', async () => {
    const [x, setX] = createSignal(100)
    const wrapper = render(() => (
      <MotionConfig isStatic>
        <motion.div data-testid="child" style={{ x: x() }} />
      </MotionConfig>
    ))

    setX(200)
    await Promise.resolve()

    expect(wrapper.getByTestId('child').style.transform).toBe('translateX(200px)')
  })

  it('removes unused styles', async () => {
    const [z, setZ] = createSignal<number | undefined>(100)
    const wrapper = render(() => (
      <MotionConfig isStatic>
        <motion.div data-testid="child" style={{ z: z() }} />
      </MotionConfig>
    ))

    expect(wrapper.getByTestId('child').style.transform).toBe('translateZ(100px)')

    setZ(undefined)
    await Promise.resolve()

    expect(wrapper.getByTestId('child').style.transform || 'none').toBe('none')
  })

  it('does not respond to updates in initial when isStatic is false', async () => {
    const [x, setX] = createSignal(100)
    const wrapper = render(() => (
      <MotionConfig isStatic={false}>
        <motion.div data-testid="child" initial={{ x: x() }} />
      </MotionConfig>
    ))

    setX(200)
    await Promise.resolve()

    expect(wrapper.getByTestId('child').style.transform).toBe('translateX(100px)')
  })

  it('responds to updates in initial when isStatic', async () => {
    const [x, setX] = createSignal(100)
    const wrapper = render(() => (
      <MotionConfig isStatic>
        <motion.div data-testid="child" initial={{ x: x() }} />
      </MotionConfig>
    ))

    setX(200)
    await Promise.resolve()

    expect(wrapper.getByTestId('child').style.transform).toBe('translateX(200px)')
  })

  it('does not override defined styles if initial values are removed', async () => {
    const [initial, setInitial] = createSignal<{ opacity: number } | undefined>({ opacity: 0.8 })
    const wrapper = render(() => (
      <MotionConfig isStatic>
        <motion.div data-testid="child" initial={initial()} style={{ opacity: 0.5 }} />
      </MotionConfig>
    ))

    expect(wrapper.getByTestId('child').style.opacity).toBe('0.8')

    setInitial(undefined)
    await Promise.resolve()

    expect(wrapper.getByTestId('child').style.opacity).toBe('0.5')
  })

  it('propagates changes in initial when isStatic', async () => {
    const [initial, setInitial] = createSignal('visible')
    const variants = {
      visible: { opacity: 1 },
      hidden: { opacity: 0 },
    }
    const wrapper = render(() => (
      <MotionConfig isStatic>
        <motion.div data-testid="parent" initial={initial()} variants={variants}>
          <motion.div data-testid="child" variants={variants} />
        </motion.div>
      </MotionConfig>
    ))

    setInitial('hidden')
    await Promise.resolve()

    expect(wrapper.getByTestId('parent').style.opacity).toBe('0')
    expect(wrapper.getByTestId('child').style.opacity).toBe('0')
  })

  it('prevents rendering of children via context', async () => {
    const scale = motionValue(0)

    render(() => (
      <MotionConfig isStatic>
        <motion.div animate={{ opacity: 0 }} transition={{ type: false }}>
          <motion.button animate={{ scale: 2 }} transition={{ type: false }} style={{ scale }} />
        </motion.div>
      </MotionConfig>
    ))

    await wait(50)
    expect(scale.get()).toBe(0)
  })

  it('reflects changes in attached motion values', async () => {
    const x = motionValue(10)
    const wrapper = render(() => {
      createEffect(() => x.set(20))
      return (
        <MotionConfig isStatic>
          <motion.div data-testid="child" style={{ x }} />
        </MotionConfig>
      )
    })

    await wait(40)
    expect(wrapper.getByTestId('child').style.transform).toBe('translateX(20px)')
  })
})
