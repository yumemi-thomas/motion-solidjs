import { cleanup, render } from '@solidjs/testing-library'
import { motionValue } from 'motion-dom'
import { onMount } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMotionValueEvent } from '@/primitives'

afterEach(() => cleanup())

describe('createMotionValueEvent', () => {
  it('fires "change" when the motion value updates', () => {
    const x = motionValue(0)
    const onChange = vi.fn()

    render(() => {
      createMotionValueEvent(x, 'change', onChange)
      return null
    })

    x.set(5)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.lastCall?.[0]).toBe(5)

    x.set(7)
    expect(onChange).toHaveBeenCalledTimes(2)
    expect(onChange.mock.lastCall?.[0]).toBe(7)
  })

  it('unsubscribes on owner cleanup', () => {
    const x = motionValue(0)
    const onChange = vi.fn()

    const { unmount } = render(() => {
      createMotionValueEvent(x, 'change', onChange)
      return null
    })

    x.set(1)
    expect(onChange).toHaveBeenCalledTimes(1)

    unmount()
    x.set(2)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('returns the same unlisten that the inner MotionValue.on returns', () => {
    const x = motionValue(0)
    const onChange = vi.fn()

    let unlisten: (() => void) | undefined
    render(() => {
      onMount(() => {
        unlisten = createMotionValueEvent(x, 'change', onChange)
      })
      return null
    })

    x.set(3)
    expect(onChange).toHaveBeenCalledTimes(1)

    unlisten!()
    x.set(4)
    expect(onChange).toHaveBeenCalledTimes(1)
  })
})
