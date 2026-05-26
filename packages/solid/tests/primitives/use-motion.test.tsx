import { cleanup, render } from '@solidjs/testing-library'
import { motionValue } from 'motion-dom'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { useMotion } from '@/primitives/use-motion'
import { delay } from '#tests/utils'

afterEach(() => {
  cleanup()
})

const instantTransition = { type: false } as any

describe('useMotion', () => {
  it('returns a getter with a Provider and animates to the target', async () => {
    const x = motionValue(0)

    function Panel() {
      const m = useMotion({
        animate: { x: 20 },
        transition: instantTransition,
        style: { x },
      })

      return (
        <m.Provider>
          <div data-testid="panel" {...m({ class: 'panel' })} />
        </m.Provider>
      )
    }

    const wrapper = render(() => <Panel />)
    const el = wrapper.getByTestId('panel')

    expect(el.classList.contains('panel')).toBe(true)

    await delay(60)
    expect(x.get()).toBe(20)
  })

  it('re-animates when a reactive signal flows through getter opts', async () => {
    const x = motionValue(0)
    const [target, setTarget] = createSignal(10)

    function Panel() {
      const opts = {
        get animate() {
          return { x: target() }
        },
        transition: instantTransition,
        style: { x },
      }
      const m = useMotion(opts)
      return <div {...m()} />
    }

    render(() => <Panel />)

    await delay(60)
    expect(x.get()).toBe(10)

    setTarget(30)
    await delay(60)
    expect(x.get()).toBe(30)
  })

  it('re-animates when opts is passed as a function and a signal changes', async () => {
    const x = motionValue(0)
    const [target, setTarget] = createSignal(10)

    function Panel() {
      const m = useMotion(() => ({
        animate: { x: target() },
        transition: instantTransition,
        style: { x },
      }))
      return <div {...m()} />
    }

    render(() => <Panel />)

    await delay(60)
    expect(x.get()).toBe(10)

    setTarget(30)
    await delay(60)
    expect(x.get()).toBe(30)
  })
})
