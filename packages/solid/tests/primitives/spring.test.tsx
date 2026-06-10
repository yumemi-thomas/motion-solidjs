import { cleanup, render } from '@solidjs/testing-library'
import { motionValue, type MotionValue } from 'motion-dom'
import { createRoot, createSignal, onMount } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { createSpring } from '@/primitives'
import { delay } from '#tests/utils'

afterEach(() => cleanup())

describe('createSpring', () => {
  it('creates a motion value seeded from a primitive', () => {
    createRoot((dispose) => {
      const value = createSpring(10)
      expect(value.get()).toBe(10)
      dispose()
    })
  })

  it('creates a motion value seeded from another motion value', () => {
    createRoot((dispose) => {
      const source = motionValue(20)
      const value = createSpring(source)
      expect(value.get()).toBe(20)
      dispose()
    })
  })

  it('seeds from an accessor source', () => {
    createRoot((dispose) => {
      const [n] = createSignal(30)
      const value = createSpring(() => n())
      expect(value.get()).toBe(30)
      dispose()
    })
  })
})

describe('createSpring — reactive accessor source', () => {
  it('retargets the spring when the accessor signal changes', async () => {
    const samples: number[] = []
    let value!: MotionValue<number>
    let setN!: (n: number) => void

    render(() => {
      const [n, _setN] = createSignal(0)
      setN = _setN
      value = createSpring(() => n(), { stiffness: 200, damping: 24 })
      value.on('change', (v) => samples.push(v))
      // Defer the signal change until after the bridge + attach effects
      // have run, otherwise the retarget fires before the spring subscribes.
      onMount(() => {
        setN(100)
      })
      return null
    })

    await delay(500)
    // Spring should have produced intermediate samples on the way to 100.
    expect(samples.length).toBeGreaterThan(1)
    expect(samples[0]).not.toBe(0)
    expect(samples[0]).not.toBe(100)
    expect(value.get()).toBeGreaterThan(0)
  })

  it('settles at the latest accessor value', async () => {
    let value!: MotionValue<number>
    let setN!: (n: number) => void

    render(() => {
      const [n, _setN] = createSignal(0)
      setN = _setN
      value = createSpring(() => n(), { stiffness: 1000, damping: 50 })
      onMount(() => setN(100))
      return null
    })

    await delay(800)
    expect(value.get()).toBeCloseTo(100, 0)
  })
})
