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

interface Opts {
  axis?: 'x' | 'y'
  top?: number
  left?: number
  right?: number
  bottom?: number
  layout?: boolean
}

function mount(opts: Opts = {}) {
  return render(() => (
    <svg style={{ width: '500px', height: '500px' }}>
      <motion.circle
        id="box"
        data-testid="draggable"
        drag={opts.axis ?? true}
        dragElastic={0}
        dragMomentum={false}
        dragConstraints={{
          top: opts.top,
          left: opts.left,
          right: opts.right,
          bottom: opts.bottom,
        }}
        fill="red"
        cx={50}
        cy={50}
        r={20}
        layout={opts.layout}
      />
    </svg>
  ))
}

// Pointer sequence + assertions ported 1:1 from
//   motion-upstream/packages/framer-motion/cypress/integration/drag-svg.ts
// `cyDrag()` mimics `cy.trigger("pointer*", x, y, { force: true })` —
// element-relative coords snapped to the bbox at pointerdown time.
describe('Drag SVG', () => {
  it('drags the element by the defined distance', async () => {
    const wrapper = mount()
    await wait(50)
    const el = wrapper.getByTestId('draggable')
    const pointer = cyDrag(el, 50, 50)
    await pointer.to(60, 60)
    await pointer.to(210, 310)
    pointer.end()
    await nextFrame()
    await wait(50)
    const rect = el.getBoundingClientRect()
    expect(rect.left).toBe(200)
    expect(rect.top).toBe(300)
  })

  it('locks drag to x', async () => {
    const wrapper = mount({ axis: 'x' })
    await wait(200)
    const el = wrapper.getByTestId('draggable')
    const pointer = cyDrag(el, 50, 50)
    await pointer.to(60, 60)
    await pointer.to(200, 300)
    pointer.end()
    await nextFrame()
    await wait(50)
    const rect = el.getBoundingClientRect()
    expect(rect.left).toBe(190)
    expect(rect.top).toBe(30)
  })

  it('locks drag to y', async () => {
    const wrapper = mount({ axis: 'y' })
    await wait(200)
    const el = wrapper.getByTestId('draggable')
    const pointer = cyDrag(el, 50, 50)
    await pointer.to(60, 60)
    await pointer.to(200, 300)
    pointer.end()
    await nextFrame()
    await wait(50)
    const rect = el.getBoundingClientRect()
    expect(rect.left).toBe(30)
    expect(rect.top).toBe(290)
  })

  it('applies constraints bottom-right', async () => {
    const wrapper = mount({ right: 100, bottom: 100 })
    await wait(200)
    const el = wrapper.getByTestId('draggable')
    const pointer = cyDrag(el, 50, 50)
    await pointer.to(60, 60)
    await pointer.to(200, 200)
    pointer.end()
    await nextFrame()
    await wait(50)
    const rect = el.getBoundingClientRect()
    expect(rect.left).toBe(130)
    expect(rect.top).toBe(130)
  })

  it('applies constraints top-left', async () => {
    const wrapper = mount({ left: -10, top: -10 })
    await wait(200)
    const el = wrapper.getByTestId('draggable')
    const pointer = cyDrag(el, 50, 50)
    await pointer.to(60, 60)
    await pointer.to(10, 10)
    pointer.end()
    await nextFrame()
    await wait(50)
    const rect = el.getBoundingClientRect()
    expect(rect.left).toBe(20)
    expect(rect.top).toBe(20)
  })
})
