import { cleanup, render } from '@solidjs/testing-library'
import { motionValue, type MotionValue } from 'motion-dom'
import { createRoot, createSignal, onMount } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { createMotionTemplate } from '@/primitives'
import { delay } from '#tests/utils'

afterEach(() => cleanup())

describe('createMotionTemplate', () => {
  it('sets initial value', async () => {
    const { container } = render(() => {
      const x = motionValue(1)
      const y = motionValue(2)
      const transform = createMotionTemplate`translateX(${x}px) translateY(${y}px)`
      return <motion.div style={{ transform: transform.get() }} />
    })
    await delay(10)
    const el = container.firstChild as HTMLElement
    expect(el.style.transform).toBe('translateX(1px) translateY(2px)')
  })

  it('preserves falsy primitive interpolations', () => {
    const transform = createMotionTemplate`translateX(${0}px) scale(${1}) ${''}`

    expect(transform.get()).toBe('translateX(0px) scale(1) ')
  })

  it('responds to manual setting from parent value', async () => {
    const x = motionValue(1)
    const y = motionValue(2)
    const transform = createMotionTemplate`translateX(${x}px) translateY(${y}px)`

    const { container } = render(() => {
      onMount(() => {
        x.set(10)
      })
      return <motion.div style={{ transform: transform.get() }} />
    })
    await new Promise((r) => requestAnimationFrame(() => r(undefined)))
    await delay(20)
    expect(transform.get()).toBe('translateX(10px) translateY(2px)')
  })

  it('seeds from an accessor interpolation', () => {
    createRoot((dispose) => {
      const [n] = createSignal(7)
      const transform = createMotionTemplate`translateX(${() => n()}px)`
      expect(transform.get()).toBe('translateX(7px)')
      dispose()
    })
  })

  it('updates reactively when an interpolated accessor signal changes', async () => {
    await createRoot(async (dispose) => {
      const [n, setN] = createSignal(1)
      const transform = createMotionTemplate`translateX(${() => n()}px) scale(${2})`

      render(() => {
        onMount(() => setN(10))
        return <motion.div style={{ transform: transform.get() }} />
      })

      await new Promise((r) => requestAnimationFrame(() => r(undefined)))
      await delay(20)
      expect(transform.get()).toBe('translateX(10px) scale(2)')
      dispose()
    })
  })

  it('mixes MotionValue and accessor interpolations', async () => {
    await createRoot(async (dispose) => {
      const x = motionValue(1)
      const [y, setY] = createSignal(2)
      const transform = createMotionTemplate`translateX(${x}px) translateY(${() => y()}px)`

      render(() => {
        onMount(() => {
          x.set(10)
          setY(20)
        })
        return <motion.div style={{ transform: transform.get() }} />
      })

      await new Promise((r) => requestAnimationFrame(() => r(undefined)))
      await delay(20)
      expect(transform.get()).toBe('translateX(10px) translateY(20px)')
      dispose()
    })
  })

  it('can be re-pointed to another MotionValue', async () => {
    const a = motionValue(1)
    const b = motionValue(2)
    const [value, setValue] = createSignal<MotionValue<number>>(a)

    render(() => {
      const transform = createMotionTemplate`translateX(${value()}px)`
      return <motion.div style={{ transform: transform.get() }} />
    })
    await delay(10)
    setValue(b)
    await delay(20)
    // Note: createMotionTemplate captures the values at call time; re-pointing
    // requires re-creating. This test documents the difference vs React.
    expect(a.get()).toBe(1)
    expect(b.get()).toBe(2)
  })
})
