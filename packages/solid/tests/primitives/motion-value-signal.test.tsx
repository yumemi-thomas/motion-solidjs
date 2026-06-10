import { cleanup, render } from '@solidjs/testing-library'
import { createMemo } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { createMotionValue, createMotionValueSignal } from '@/primitives'

afterEach(() => cleanup())

describe('createMotionValueSignal', () => {
  it('reads the current value synchronously at creation', () => {
    let initial: number | undefined
    render(() => {
      const x = createMotionValue(7)
      const x$ = createMotionValueSignal(x)
      initial = x$()
      return null
    })
    expect(initial).toBe(7)
  })

  it('tracks MotionValue changes through Solid scopes', () => {
    const x = createMotionValue(0)
    const wrapper = render(() => {
      const x$ = createMotionValueSignal(x)
      const doubled = createMemo(() => x$() * 2)
      return <span data-testid="out">{doubled()}</span>
    })
    expect(wrapper.getByTestId('out').textContent).toBe('0')

    x.set(21)
    expect(wrapper.getByTestId('out').textContent).toBe('42')
  })

  it('unsubscribes on owner disposal', () => {
    const x = createMotionValue(1)
    let read: () => number = () => 0
    const wrapper = render(() => {
      read = createMotionValueSignal(x)
      return null
    })
    wrapper.unmount()

    x.set(99)
    expect(read()).toBe(1)
  })
})
