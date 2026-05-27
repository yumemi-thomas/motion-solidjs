import { cleanup, render } from '@solidjs/testing-library'
import { motionValue, type MotionValue } from 'motion-dom'
import { createSignal, onMount } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { createFollowValue, createMotionValueEvent } from '@/primitives/values'
import { delay } from '#tests/utils'

// motion-dom's MotionValue exposes its internal `events` SubscriptionManager
// only as an underscored private field. Reading `events.change.getSize()` is
// the established way to assert "exactly N subscribers attached" (mirrors
// upstream's `(a as any).events.change.getSize()` in use-follow-value.test.tsx).
// Wrapped in a typed helper here so the rest of the file stays cast-free.
interface MVWithEvents {
  events: { change: { getSize(): number } }
}
function subscriberCount(mv: MotionValue<number>): number {
  return (mv as unknown as MVWithEvents).events.change.getSize()
}

afterEach(() => cleanup())

describe('createFollowValue — construction', () => {
  it('seeds from a primitive number', () => {
    let x!: MotionValue<number>
    render(() => {
      x = createFollowValue(0)
      return null
    })
    expect(x.get()).toBe(0)
  })

  it('seeds from a primitive string with a unit', () => {
    let x!: MotionValue<string>
    render(() => {
      x = createFollowValue('0%')
      return null
    })
    expect(x.get()).toBe('0%')
  })

  it('seeds from a number MotionValue', () => {
    const source = motionValue(0)
    let x!: MotionValue<number>
    render(() => {
      x = createFollowValue(source)
      return null
    })
    expect(x.get()).toBe(0)
  })

  it('seeds from a string MotionValue with a unit', () => {
    const source = motionValue('0%')
    let x!: MotionValue<string>
    render(() => {
      x = createFollowValue(source)
      return null
    })
    expect(x.get()).toBe('0%')
  })
})

describe('createFollowValue — tracks source changes', () => {
  it('animates between source values when the source moves', async () => {
    const samples: number[] = []
    let follower!: MotionValue<number>

    render(() => {
      const source = motionValue(0)
      follower = createFollowValue(source)
      follower.on('change', (v) => samples.push(v))
      // Defer the set until after the createEffect inside createFollowValue
      // has attached, otherwise the change fires before the follower
      // subscribes and nothing animates.
      onMount(() => {
        source.set(100)
      })
      return null
    })

    await delay(500)
    // Spring should have produced intermediate samples on the way to 100.
    expect(samples.length).toBeGreaterThan(1)
    // First sample is mid-flight, neither endpoint. Mirrors the upstream
    // assertion (`expect(resolved).not.toBe(0)/(100)`).
    expect(samples[0]).not.toBe(0)
    expect(samples[0]).not.toBe(100)
  })

  it('jump() bypasses animation', async () => {
    const samples: number[] = []
    let follower!: MotionValue<number>

    render(() => {
      const source = motionValue(0)
      follower = createFollowValue(source)
      follower.on('change', (v) => {
        if (samples.length < 10) samples.push(v)
      })
      follower.jump(100)
      return null
    })

    await delay(50)
    expect(samples).toEqual([100])
  })
})

describe('createFollowValue — accessor source', () => {
  it('seeds from an accessor', () => {
    let x!: MotionValue<number>
    render(() => {
      const [n] = createSignal(5)
      x = createFollowValue(() => n())
      return null
    })
    expect(x.get()).toBe(5)
  })

  it('retargets when the accessor signal changes', async () => {
    const samples: number[] = []
    let follower!: MotionValue<number>
    let setN!: (n: number) => void

    render(() => {
      const [n, _setN] = createSignal(0)
      setN = _setN
      follower = createFollowValue(() => n())
      follower.on('change', (v) => samples.push(v))
      onMount(() => setN(100))
      return null
    })

    await delay(500)
    expect(samples.length).toBeGreaterThan(1)
    expect(samples[0]).not.toBe(0)
    expect(samples[0]).not.toBe(100)
  })
})

describe('createFollowValue — animation events', () => {
  it('fires animationStart when the source moves', async () => {
    let started = false

    render(() => {
      const source = motionValue(0)
      const follower = createFollowValue(source, {
        type: 'spring',
        stiffness: 100,
        damping: 10,
      })
      createMotionValueEvent(follower, 'animationStart', () => {
        started = true
      })
      onMount(() => {
        source.set(100)
      })
      return null
    })

    await delay(100)
    expect(started).toBe(true)
  })

  it('fires animationComplete when the spring settles', async () => {
    let completed = false

    render(() => {
      const source = motionValue(0)
      const follower = createFollowValue(source, {
        type: 'spring',
        stiffness: 1000,
        damping: 50,
      })
      createMotionValueEvent(follower, 'animationComplete', () => {
        completed = true
      })
      onMount(() => {
        source.set(100)
      })
      return null
    })

    await delay(800)
    expect(completed).toBe(true)
  })
})

describe('createFollowValue — accepts transition shapes', () => {
  it('accepts a spring config', () => {
    let x!: MotionValue<number>
    render(() => {
      x = createFollowValue(0, { type: 'spring', stiffness: 300, damping: 20, mass: 1 })
      return null
    })
    expect(x.get()).toBe(0)
  })

  it('accepts a tween config', () => {
    let x!: MotionValue<number>
    render(() => {
      x = createFollowValue(0, { type: 'tween', duration: 0.5, ease: 'easeInOut' })
      return null
    })
    expect(x.get()).toBe(0)
  })

  it('accepts a delay', () => {
    let x!: MotionValue<number>
    render(() => {
      x = createFollowValue(0, { type: 'spring', delay: 0.5 })
      return null
    })
    expect(x.get()).toBe(0)
  })

  it('accepts repeat config', () => {
    let x!: MotionValue<number>
    render(() => {
      x = createFollowValue(0, {
        type: 'tween',
        duration: 0.2,
        repeat: 2,
        repeatType: 'reverse',
      })
      return null
    })
    expect(x.get()).toBe(0)
  })
})

describe('createFollowValue — lifecycle', () => {
  it('detaches from the previous source when the source accessor swaps', async () => {
    const a = motionValue(0)
    const b = motionValue(0)

    const [target, setTarget] = createSignal<MotionValue<number>>(a)

    render(() => {
      // Read the accessor inside the render scope so changing `target()`
      // re-runs the attach effect inside createFollowValue.
      createFollowValue(target())
      return null
    })

    setTarget(b)
    await Promise.resolve()
    setTarget(a)
    await Promise.resolve()
    setTarget(b)
    await Promise.resolve()
    setTarget(a)
    await Promise.resolve()

    // Each attachFollow registers exactly one subscriber on the source;
    // when the source swaps, the previous attachFollow's cleanup
    // unsubscribes. So `a` should only ever have one outstanding
    // subscriber even after multiple swaps back.
    expect(subscriberCount(a)).toBe(1)
  })
})
