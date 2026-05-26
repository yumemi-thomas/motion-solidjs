import { cleanup, render } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'
import { motion, motionValue } from '@/index'
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
// drag-ref-constraints-element-resize.ts — #2458: ref-based
// dragConstraints should update when the draggable resizes.
//
// Fixed in: ref-based dragConstraints measurement ported. The Solid
// port now mirrors upstream's #2458 ResizeObserver wiring — when a
// ref-based constraint resolves, `addListeners` subscribes to size
// changes on both the draggable element and its constraint container
// and re-runs `scalePositionWithinConstraints` on each resize.

function mount() {
  let constraintsRef!: HTMLDivElement
  const widthMV = motionValue(100)
  const heightMV = motionValue(100)

  const handleResize = () => {
    widthMV.set(300)
    heightMV.set(300)
  }

  const r = render(() => (
    <div style={{ padding: '0', margin: '0' }}>
      <button
        id="resize-trigger"
        data-testid="resize-trigger"
        onClick={handleResize}
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
          drag
          dragConstraints={() => constraintsRef}
          dragElastic={0}
          dragMomentum={false}
          style={{
            width: widthMV,
            height: heightMV,
            background: 'red',
          }}
        />
      </motion.div>
    </div>
  ))
  return r
}

describe('Drag Constraints Update on Element Resize', () => {
  it('Constrains drag correctly before resize', async () => {
    const wrapper = mount()
    await wait(200)
    const box = wrapper.getByTestId('draggable')
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

  it('Updates drag constraints after draggable element is resized', async () => {
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

  it('Updates drag constraints after draggable element is resized, with existing drag offset', async () => {
    const wrapper = mount()
    await wait(200)
    const box = wrapper.getByTestId('draggable')

    const pointer1 = cyDrag(box, 5, 5)
    await pointer1.to(10, 10)
    await wait(50)
    await pointer1.to(100, 100)
    await wait(50)
    pointer1.end()
    await nextFrame()
    await wait(50)

    wrapper.getByTestId('resize-trigger').click()
    await wait(200)

    const pointer2 = cyDrag(box, 5, 5)
    await pointer2.to(10, 10)
    await wait(50)
    await pointer2.to(600, 600)
    await wait(50)
    pointer2.end()
    await nextFrame()
    await wait(50)

    const { right, bottom } = box.getBoundingClientRect()
    expect(right).toBeLessThanOrEqual(502)
    expect(bottom).toBeLessThanOrEqual(502)
  })
})
