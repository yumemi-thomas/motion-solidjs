import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, onMount } from 'solid-js'
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

// Port of motion-upstream/packages/framer-motion/cypress/integration/layout-relative-drag.ts
// Fixture: motion-upstream/dev/react/src/tests/layout-relative-drag.tsx
//
// A `layout`-enabled parent that's also `drag` should drag normally, and
// its `layout`-enabled child should follow the parent's bbox during the
// drag — the child's projection target is relative to the parent.
// The fixture flips state in a useEffect (no-op for the bbox) which on
// the React side simply re-renders.

interface BoundingBox {
  top: number
  left: number
  width: number
  height: number
}

function expectBbox(element: HTMLElement, expectedBbox: BoundingBox) {
  const bbox = element.getBoundingClientRect()
  expect(bbox.left).toBe(expectedBbox.left)
  expect(bbox.top).toBe(expectedBbox.top)
  expect(bbox.width).toBe(expectedBbox.width)
  expect(bbox.height).toBe(expectedBbox.height)
}

describe('Relative projection targets: Drag', () => {
  it('Child correctly follows parent', async () => {
    const [state, setState] = createSignal(true)

    render(() => {
      onMount(() => {
        setState(!state())
      })
      return (
        <motion.div
          id="parent"
          drag
          dragElastic={0}
          dragMomentum={false}
          layout
          style={{
            width: '200px',
            height: '200px',
            background: 'red',
          }}
        >
          <motion.div
            id="child"
            layout
            style={{ width: '100px', height: '100px', background: 'blue' }}
          />
        </motion.div>
      )
    })

    await wait(50)
    const parent = document.getElementById('parent') as HTMLElement
    const child = document.getElementById('child') as HTMLElement
    expectBbox(parent, { top: 0, left: 0, width: 200, height: 200 })
    expectBbox(child, { top: 0, left: 0, width: 100, height: 100 })

    // Upstream cypress sequence: pointerdown @ (5,5), move to (10,10)
    // (threshold-crossing — gesture starts here), wait 50, move to
    // (110,110). Final drag delta is (100,100) — parent expected at
    // (110,110) because cypress's element-relative coords mean the
    // second move re-reads bbox after the (10,10)-to-(110,110) delta
    // applied. cyDrag mirrors that behavior.
    const pointer = cyDrag(parent, 5, 5)
    await pointer.to(10, 10)
    await wait(50)
    await pointer.to(110, 110)
    await nextFrame()
    await wait(50)

    expectBbox(parent, { top: 110, left: 110, width: 200, height: 200 })
    expectBbox(child, { top: 110, left: 110, width: 100, height: 100 })

    pointer.end()
  })
})
