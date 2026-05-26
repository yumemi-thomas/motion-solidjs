import { cleanup, render } from '@solidjs/testing-library'
import { motionValue } from 'motion-dom'
import { createSignal, Show } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { AnimatePresence, motion } from '@/components'
import { delay } from '#tests/utils'

afterEach(() => cleanup())

// Port of upstream AnimatePresence.test.tsx — a focused slice covering the
// always-on baseline behaviours (initial animation, initial=false,
// passthrough rerenders, exit animation, no-op exit). The upstream suite
// drives state with React's `rerender`; the Solid equivalent uses
// `createSignal` + `<Show>` to model the same mount/unmount semantics.

describe('AnimatePresence — initial & passthrough', () => {
  it('runs an initial animation when no `initial` prop is set', async () => {
    const x = motionValue(0)
    render(() => (
      <AnimatePresence>
        <motion.div animate={{ x: 100 }} style={{ x }} exit={{ x: 0 }} />
      </AnimatePresence>
    ))

    // Sample mid-flight — neither endpoint.
    await delay(40)
    expect(x.get()).not.toBe(0)
    expect(x.get()).not.toBe(100)
  })

  it('suppresses the initial animation when `initial={false}`', async () => {
    const { container } = render(() => (
      <AnimatePresence initial={false}>
        <motion.div initial={{ x: 0 }} animate={{ x: 100 }} exit={{ opacity: 0 }} />
      </AnimatePresence>
    ))

    await delay(60)
    const child = container.querySelector('div')
    expect(child?.style.transform).toMatch(/translateX\(100px\)/)
  })

  it('passes through non-motion rerenders without unmounting', () => {
    const [color, setColor] = createSignal('red')
    const { container } = render(() => (
      <AnimatePresence>
        <div style={{ 'background-color': color() }} />
      </AnimatePresence>
    ))

    const firstChild = container.querySelector('div')
    expect(firstChild?.style.backgroundColor).toBe('red')

    setColor('green')
    expect(container.querySelector('div')).toBe(firstChild)
    expect(firstChild?.style.backgroundColor).toBe('green')
  })
})

describe('AnimatePresence — exit semantics', () => {
  it('animates out a component when it is removed', async () => {
    const opacity = motionValue(1)
    const [visible, setVisible] = createSignal(true)

    const { container } = render(() => (
      <AnimatePresence>
        <Show when={visible()}>
          <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.1 }} style={{ opacity }} />
        </Show>
      </AnimatePresence>
    ))

    setVisible(false)

    // Mid-flight — exit is running.
    await delay(50)
    expect(opacity.get()).not.toBe(1)
    expect(opacity.get()).not.toBe(0)

    // Past the configured 0.1s duration — element should be removed.
    await delay(200)
    expect(container.firstChild).toBeFalsy()
  })

  it('removes a child with no exit prop without animating', async () => {
    const [visible, setVisible] = createSignal(true)
    const { container } = render(() => (
      <AnimatePresence>
        <Show when={visible()}>
          <div />
        </Show>
      </AnimatePresence>
    ))

    setVisible(false)
    // No exit animation — removal is synchronous from the next tick.
    await delay(0)
    expect(container.firstChild).toBeFalsy()
  })

  it('removes the child immediately when no exit animations are defined on motion children', async () => {
    const [key, setKey] = createSignal(0)
    const { container } = render(() => (
      <AnimatePresence mode="wait">
        <Show when={key()} keyed>
          {(i) => (
            <motion.div
              data-testid={String(i)}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </Show>
      </AnimatePresence>
    ))

    expect(container.querySelector('[data-testid="0"]')).toBeFalsy()
    setKey(1)
    await delay(60)
    setKey(2)
    await delay(60)
    // With no `exit` prop, the old child should be gone immediately and the
    // new child should be the only rendered element.
    expect(container.querySelector('[data-testid="2"]')).toBeTruthy()
  })
})
