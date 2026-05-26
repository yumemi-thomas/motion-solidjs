import { cleanup, render } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'
import { MotionConfig, motion } from '@/components'
import { correctParentTransform } from '@/utils'
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
// drag-scaled-parent.ts — drag in a scaled parent should follow the
// cursor 1:1, not by the scaled translate factor.
//
// Fixed: MotionConfig.transformPagePoint is wired and
// `correctParentTransform` is ported, so the gesture deltas are
// converted into the unscaled local space.
function mount(scale: number) {
  let ref!: HTMLDivElement
  return render(() => (
    <div
      ref={(el) => (ref = el)}
      id="container"
      style={{
        width: '800px',
        height: '800px',
        background: 'blue',
        transform: `scale(${scale})`,
        'transform-origin': 'top left',
      }}
    >
      <MotionConfig transformPagePoint={correctParentTransform(() => ref)}>
        <motion.div
          data-testid="draggable"
          drag
          dragElastic={0}
          dragMomentum={false}
          style={{
            width: '100px',
            height: '100px',
            background: 'red',
          }}
        />
      </MotionConfig>
    </div>
  ))
}

describe('Drag with scaled parent', () => {
  it('Element follows cursor when parent has scale(0.5)', async () => {
    const wrapper = mount(0.5)
    await wait(200)
    const el = wrapper.getByTestId('draggable')
    await wait(100)
    const pointer = cyDrag(el, 10, 10)
    await pointer.to(15, 15)
    await wait(50)
    await pointer.to(110, 110)
    await wait(50)
    pointer.end()
    await nextFrame()
    await wait(50)

    const { left, top } = el.getBoundingClientRect()
    expect(left).toBeGreaterThan(80)
    expect(left).toBeLessThan(120)
    expect(top).toBeGreaterThan(80)
    expect(top).toBeLessThan(120)
  })

  it('Element follows cursor when parent has scale(2)', async () => {
    const wrapper = mount(2)
    await wait(200)
    const el = wrapper.getByTestId('draggable')
    await wait(100)
    const pointer = cyDrag(el, 10, 10)
    await pointer.to(15, 15)
    await wait(50)
    await pointer.to(110, 110)
    await wait(50)
    pointer.end()
    await nextFrame()
    await wait(50)

    const { left, top } = el.getBoundingClientRect()
    expect(left).toBeGreaterThan(80)
    expect(left).toBeLessThan(120)
    expect(top).toBeGreaterThan(80)
    expect(top).toBeLessThan(120)
  })
})
