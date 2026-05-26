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
// drag-rotated-parent.ts — drag in a rotated parent honors page coordinates.
//
// Fixed: MotionConfig.transformPagePoint is wired and the
// `correctParentTransform` helper is ported (see
// src/utils/transform-rotated-parent.ts).
function mount() {
  let ref!: HTMLDivElement
  return render(() => (
    <motion.div
      ref={(el) => (ref = el)}
      style={{
        position: 'absolute',
        top: '0',
        left: '0',
        width: '400px',
        height: '400px',
        rotate: '180deg',
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
    </motion.div>
  ))
}

describe('Drag with rotated parent', () => {
  // Fixed in transformPagePoint pipeline port: MotionConfig now accepts
  // transformPagePoint, correctParentTransform helper is ported, and
  // the rotated-parent compensation flows through to PanSession via
  // VE.getTransformPagePoint().
  it('Element follows cursor when parent is rotated 180deg', async () => {
    const wrapper = mount()
    await wait(200)
    const el = wrapper.getByTestId('draggable')
    await wait(100)
    const pointer = cyDrag(el, 50, 50)
    await pointer.to(55, 55)
    await wait(50)
    await pointer.to(150, 50)
    await wait(50)
    pointer.end()
    await nextFrame()
    await wait(50)

    const { left } = el.getBoundingClientRect()
    expect(left).toBeGreaterThan(350)
  })
})
