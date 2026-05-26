import { cleanup, render } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
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
// drag-ref-constraints-resize-handle.ts — #2903: imperative DOM resize
// (e.g. CSS `resize: both`) of the draggable should still update the
// constraints — observed only via ResizeObserver.
//
// Fixed in: ref-based dragConstraints measurement ported. Like #2458,
// the ResizeObserver wired in `addListeners` watches the draggable
// element directly — so a non-React-driven style mutation (CSS
// `resize: both`, imperative `el.style.width = ...`) also triggers a
// re-measurement and the constraints stay in sync.

function mount() {
  let constraintsRef!: HTMLDivElement
  let boxRef!: HTMLDivElement

  const onResize = () => {
    if (boxRef) {
      boxRef.style.width = '300px'
      boxRef.style.height = '300px'
    }
  }

  return render(() => (
    <div style={{ padding: '0', margin: '0' }}>
      <button
        id="resize-trigger"
        data-testid="resize-trigger"
        onClick={onResize}
        style={{ position: 'fixed', top: '10px', right: '10px', 'z-index': 10 }}
      >
        Resize to 300x300
      </button>
      <motion.div
        id="constraints"
        ref={(el) => (constraintsRef = el)}
        style={{
          width: '500px',
          height: '500px',
          background: 'rgba(0, 0, 255, 0.1)',
          position: 'relative',
        }}
      >
        <motion.div
          id="box"
          data-testid="draggable"
          ref={(el) => (boxRef = el)}
          drag
          dragConstraints={() => constraintsRef}
          dragElastic={0}
          dragMomentum={false}
          style={{
            width: '100px',
            height: '100px',
            background: 'red',
          }}
        />
      </motion.div>
    </div>
  ))
}

describe('Drag Constraints Update on Imperative Resize', () => {
  it('Updates drag constraints when element grows via direct DOM mutation', async () => {
    const wrapper = mount()
    await wait(200)

    wrapper.getByTestId('resize-trigger').click()
    await wait(200)

    const box = wrapper.getByTestId('draggable')
    const { width, height } = box.getBoundingClientRect()
    expect(width).toBe(300)
    expect(height).toBe(300)

    const pointer = cyDrag(box, 5, 5)
    await pointer.to(10, 10)
    await wait(50)
    await pointer.to(600, 600)
    await wait(50)
    pointer.end()
    await nextFrame()
    await wait(50)

    const { right, bottom } = box.getBoundingClientRect()
    expect(right).toBeLessThanOrEqual(502)
    expect(bottom).toBeLessThanOrEqual(502)
  })
})
