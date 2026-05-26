import { cleanup, render } from '@solidjs/testing-library'
import { onMount } from 'solid-js'
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
  window.scrollTo(0, 0)
  cleanup()
})

// Port of motion-upstream/packages/framer-motion/cypress/integration/
// drag-ref-constraints-absolute-scrolled.ts — #2829: ref-based
// dragConstraints on a viewport-sized element must allow dragging to
// the visible bottom of the viewport when the page is loaded with the
// window scrolled.
//
// Fixed in: ref-based dragConstraints measurement ported. Mirrors
// upstream's #2829 fix — `resolveRefConstraints` clears the cached
// root scroll offset and re-reads it before computing the constraint
// box, so a page that was scroll-restored after the drag mount picks
// up the live scroll position. See
// `src/features/gestures/drag/visual-element-drag-controls.ts`.

function mount(initialScroll = 300) {
  let constraintsRef!: HTMLDivElement
  return render(() => {
    onMount(() => window.scrollTo(0, initialScroll))
    return (
      <div style={{ height: '3000px', margin: '0', padding: '0' }}>
        <div
          id="constraints"
          ref={(el) => (constraintsRef = el)}
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'rgba(0, 0, 255, 0.1)',
          }}
        >
          <motion.div
            id="box"
            data-testid="draggable"
            drag
            dragConstraints={constraintsRef}
            dragElastic={0}
            dragMomentum={false}
            style={{
              width: '50px',
              height: '50px',
              background: 'red',
              position: 'absolute',
              top: '0',
              left: '0',
            }}
          />
        </div>
      </div>
    )
  })
}

describe('Drag with ref constraints on absolute element after scroll', () => {
  it('Allows dragging to the visible bottom of the viewport after scroll', async () => {
    const wrapper = mount(300)
    await wait(300)
    expect(window.scrollY).toBeGreaterThan(0)

    const el = wrapper.getByTestId('draggable')
    const pointer = cyDrag(el, 5, 5)
    await pointer.to(10, 10)
    await wait(50)
    await pointer.to(900, 1500)
    await wait(50)
    pointer.end()
    await nextFrame()
    await wait(100)

    const rect = el.getBoundingClientRect()
    // viewport: 1000x660 (vitest browser default), scroll: 300, box: 50x50.
    // Constraint `position: absolute; inset: 0` is viewport-sized at the
    // document origin; visible bottom = 660 - 300 = 360.
    expect(rect.bottom).toBeCloseTo(360, 0)
  })
})
