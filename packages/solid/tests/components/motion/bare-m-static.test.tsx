import { cleanup, render } from '@solidjs/testing-library'
import { motionValue } from 'motion-dom'
import { createSignal, Show } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'
// IMPORTANT: import `m` / AnimatePresence from their own modules, NOT the
// `@/components` barrel — the barrel pulls in `motion-max`, whose module
// init installs the value machinery (domMax) and would defeat these tests.
import { m } from '@/components/motion'
import AnimatePresence from '@/components/animate-presence/animate-presence'

afterEach(() => cleanup())

const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

// Bare `m` with no feature bundle is static, matching motion/react: style
// MotionValues paint their current value once, with no live subscription,
// until a LazyMotion bundle installs the machinery.
describe('bare m without features (static rendering)', () => {
  it('renders the current value of a style MotionValue', () => {
    const x = motionValue(5)
    const wrapper = render(() => <m.div data-testid="box" style={{ x }} />)
    expect(wrapper.getByTestId('box').style.transform).toBe('translateX(5px)')
  })

  it('does not live-update when the MotionValue changes', async () => {
    const x = motionValue(5)
    const wrapper = render(() => <m.div data-testid="box" style={{ x }} />)
    const el = wrapper.getByTestId('box')

    x.set(50)
    await nextFrame()

    expect(el.style.transform).toBe('translateX(5px)')
  })

  it('AnimatePresence removes exiting children immediately and fires onExitComplete', async () => {
    const [show, setShow] = createSignal(true)
    const onExitComplete = vi.fn()

    const wrapper = render(() => (
      <AnimatePresence onExitComplete={onExitComplete}>
        <Show when={show()}>
          <m.div data-testid="box" exit={{ opacity: 0 }} />
        </Show>
      </AnimatePresence>
    ))
    expect(wrapper.queryByTestId('box')).toBeTruthy()

    setShow(false)
    // Removal flushes through AnimatePresence's microtask bookkeeping.
    await nextFrame()

    expect(wrapper.queryByTestId('box')).toBeNull()
    expect(onExitComplete).toHaveBeenCalled()
  })
})
