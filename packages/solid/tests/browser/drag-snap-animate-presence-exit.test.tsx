import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, Show } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { AnimatePresence, motion } from '@/components'
import { cyDrag, nextFrame } from '../features/gestures/drag-test-utils'
import { wait } from './helpers'

afterEach(() => {
  window.dispatchEvent(
    new PointerEvent('pointerup', {
      bubbles: true,
      isPrimary: true,
      pointerId: 1,
      pointerType: 'mouse',
    }),
  )
  cleanup()
})

// Port of motion-upstream/packages/framer-motion/cypress/integration/
// drag-snap-animate-presence-exit.ts — companion to #3315: ensures
// AnimatePresence exit completes cleanly even while a drag-driven
// motion-value animation (dragSnapToOrigin) is still in flight, and
// re-entry doesn't leak a stranded drag transform.

const TILE_SIZE = 80

function mount() {
  const [show, setShow] = createSignal(true)
  const r = render(() => (
    <div style={{ padding: '60px' }}>
      <button
        data-testid="toggle"
        onClick={() => setShow((s) => !s)}
        style={{ 'margin-bottom': '20px' }}
      >
        toggle
      </button>
      <div
        id="container"
        data-show={show() ? '1' : '0'}
        style={{ position: 'relative', width: '300px', height: '300px' }}
      >
        <AnimatePresence>
          <Show when={show()}>
            <motion.div
              data-testid="tile"
              drag
              dragSnapToOrigin
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                top: '0',
                left: '0',
                width: `${TILE_SIZE}px`,
                height: `${TILE_SIZE}px`,
                background: '#08f',
              }}
            />
          </Show>
        </AnimatePresence>
      </div>
    </div>
  ))
  return r
}

describe('drag + dragSnapToOrigin + AnimatePresence exit', () => {
  it('exits cleanly after a drag and re-enters without a stranded transform', async () => {
    const wrapper = mount()
    await wait(200)

    const tile = wrapper.getByTestId('tile')
    const r = tile.getBoundingClientRect()
    const initialLeft = r.left
    const initialTop = r.top

    // Drag the tile and release — dragSnapToOrigin kicks in.
    const pointer = cyDrag(tile, 10, 10)
    await pointer.to(20, 10)
    await wait(50)
    await pointer.to(60, 10)
    await wait(50)
    pointer.end()

    // Toggle off mid-snap to trigger AnimatePresence exit while
    // the drag motion-value animation is still in flight.
    const toggle = wrapper.getByTestId('toggle')
    toggle.click()
    await wait(800)

    // AnimatePresence should have torn the tile down.
    expect(wrapper.queryByTestId('tile')).toBeNull()

    // Toggle back on and confirm the new tile renders at the
    // same layout position as the first instance.
    toggle.click()
    await wait(500)

    const tile2 = wrapper.getByTestId('tile')
    const r2 = tile2.getBoundingClientRect()
    expect(r2.left).toBeCloseTo(initialLeft, 0)
    expect(r2.top).toBeCloseTo(initialTop, 0)

    await nextFrame()
  })
})
