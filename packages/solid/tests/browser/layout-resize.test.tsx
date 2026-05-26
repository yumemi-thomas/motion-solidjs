import { cleanup, render } from '@solidjs/testing-library'
import { page } from 'vitest/browser'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { wait } from './helpers'

// Restore the configured viewport (1000x660 in vitest.browser.config.ts) so
// the rest of the suite doesn't inherit our 200x200 resize.
afterEach(async () => {
  cleanup()
  await page.viewport(1000, 660)
})

// Port of motion-upstream/packages/framer-motion/cypress/integration/layout-resize.ts
// Fixture: motion-upstream/dev/react/src/tests/layout-resize.tsx
//
// On window resize, in-flight layout animations finish immediately and
// any new layout animation that would be triggered within ~250ms of the
// resize is blocked (skipped to its target). After 250ms, layout
// animations resume as normal.

interface BoundingBox {
  top: number
  left: number
  width: number
  height: number
}

function expectBbox(element: HTMLElement, expectedBbox: BoundingBox) {
  const bbox = element.getBoundingClientRect()
  expect(Math.round(bbox.left)).toBe(expectedBbox.left)
  expect(Math.round(bbox.top)).toBe(expectedBbox.top)
  expect(Math.round(bbox.width)).toBe(expectedBbox.width)
  expect(Math.round(bbox.height)).toBe(expectedBbox.height)
}

const baseBox = {
  position: 'absolute',
  top: '0px',
  left: '0px',
  background: 'red',
} as const

const a = { ...baseBox, width: '100px', height: '100px' }
const b = {
  ...baseBox,
  width: '400px',
  height: '200px',
  top: '100px',
  left: '100px',
}

describe('Resize window', () => {
  it(// Uses Vitest browser-mode's `page.viewport(w, h)` (introduced in
  // vitest-dev/vitest#5811) to actually shrink the iframe and trigger
  // motion-dom's window-resize listener. Previously dispatched a bare
  // `resize` event, which left `window.innerWidth` unchanged and so
  // motion-dom's listener short-circuited.
  'Finishes the animation and blocks animation on immediate layout animations until 250ms', async () => {
    const [state, setState] = createSignal(true)

    render(() => (
      <motion.div
        id="box"
        data-testid="box"
        layout
        style={state() ? a : b}
        onClick={() => setState(!state())}
        transition={{ duration: 3 }}
      >
        <motion.div
          layout
          id="child"
          style={{ width: '100px', height: '100px', background: 'blue' }}
          transition={{ duration: 3 }}
        />
      </motion.div>
    ))

    await wait(50)
    let box = document.getElementById('box') as HTMLElement
    let child = document.getElementById('child') as HTMLElement
    expectBbox(box, { top: 0, left: 0, width: 100, height: 100 })
    expectBbox(child, { top: 0, left: 0, width: 100, height: 100 })

    // First click — start a 3s layout animation toward `b`.
    box.click()
    await wait(50)

    // Cypress `.viewport(200, 200)` equivalent — actually resize the
    // iframe so motion-dom's window-resize listener fires, finishing
    // the in-flight animation immediately and entering the 250ms
    // layout-blocking window.
    await page.viewport(200, 200)
    await wait(100)

    box = document.getElementById('box') as HTMLElement
    child = document.getElementById('child') as HTMLElement
    // Animation was interrupted by resize → snaps to target `b`.
    expectBbox(box, { top: 100, left: 100, width: 400, height: 200 })
    expectBbox(child, { top: 100, left: 100, width: 100, height: 100 })

    // Click again immediately — within the 250ms post-resize window,
    // so the layout animation is blocked and the box snaps straight
    // to `a`.
    box.click()
    await wait(50)
    box = document.getElementById('box') as HTMLElement
    child = document.getElementById('child') as HTMLElement
    expectBbox(box, { top: 0, left: 0, width: 100, height: 100 })
    expectBbox(child, { top: 0, left: 0, width: 100, height: 100 })

    // Wait past the 250ms window, then click — animation should now
    // run normally, mid-flight bbox.top is neither 0 nor 100.
    await wait(200)
    box.click()
    await wait(300)
    box = document.getElementById('box') as HTMLElement
    const bbox = box.getBoundingClientRect()
    expect(Math.round(bbox.top)).not.toBe(0)
    expect(Math.round(bbox.top)).not.toBe(100)
  })
})
