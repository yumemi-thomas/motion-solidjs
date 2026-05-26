// Ported from motion/react: packages/framer-motion/src/gestures/__tests__/pan.test.tsx
import { cleanup, render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { motion } from '@/components'
import { deferred, drag, nextFrame } from './drag-test-utils'

afterEach(() => cleanup())

describe('pan', () => {
  it("pan handlers aren't frozen at pan session start", async () => {
    let count = 0
    const onPanEnd = deferred()
    const [increment, setIncrement] = createSignal(0)

    const wrapper = render(() => (
      <motion.div
        data-testid="m"
        onPanStart={() => {
          count += increment()
          setIncrement(2)
        }}
        onPan={() => {
          count += increment()
        }}
        onPanEnd={() => {
          count += increment()
          onPanEnd.resolve()
        }}
      />
    ))

    const pointer = await drag(wrapper.getByTestId('m')).to(100, 100)
    await nextFrame()
    await pointer.to(50, 50)
    await nextFrame()
    pointer.end()
    await onPanEnd.promise

    expect(count).toBeGreaterThan(0)
  })

  it('onPanStart fires before onPan', async () => {
    const events: string[] = []
    const onPanEnd = deferred()

    const wrapper = render(() => (
      <motion.div
        data-testid="m"
        onPanStart={() => events.push('start')}
        onPan={() => events.push('pan')}
        onPanEnd={() => {
          events.push('end')
          onPanEnd.resolve()
        }}
      />
    ))

    const pointer = await drag(wrapper.getByTestId('m')).to(100, 100)
    await nextFrame()
    pointer.end()
    await onPanEnd.promise

    const startIndex = events.indexOf('start')
    const firstPanIndex = events.indexOf('pan')
    expect(startIndex).toBeGreaterThanOrEqual(0)
    expect(firstPanIndex).toBeGreaterThanOrEqual(0)
    expect(startIndex).toBeLessThan(firstPanIndex)
  })

  it("onPanEnd doesn't fire unless onPanStart has", async () => {
    const onPanStart = vi.fn()
    const onPanEnd = vi.fn()

    const wrapper = render(() => (
      <motion.div data-testid="m" onPanStart={onPanStart} onPanEnd={onPanEnd} />
    ))

    // Move under the 3px threshold — no pan should start.
    const pointer = await drag(wrapper.getByTestId('m')).to(1, 1)
    await nextFrame()
    pointer.end()

    expect(onPanStart).not.toHaveBeenCalled()
    expect(onPanEnd).not.toHaveBeenCalled()
  })
})
