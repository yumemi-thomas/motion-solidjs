import { cleanup, render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { LazyMotion, m } from '@/components'
import { domMax } from '@/features'
import { wait } from './helpers'

afterEach(() => cleanup())

// Port of motion-upstream/packages/framer-motion/cypress/integration/layout-relative-delay.ts
// Fixture: motion-upstream/dev/react/src/tests/layout-relative-delay.tsx
//
// A parent `m.div` with `layout` toggles between two boxes on click. A
// child `m.div` (also `layout`) has `transition.delay: 100` — so for the
// first ~100s of the animation the child should not animate on its own,
// and its visual position must remain relative to the (animating) parent.
// Upstream's `ease` callback returns `t` on the first frame, then 0.5
// thereafter — meaning after one frame the parent should be halfway
// between source and target, and the child should follow.

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

describe('Relative projection targets: Delay', () => {
  it('Child correctly follows parent', async () => {
    const [state, setState] = createSignal(true)
    let frameCount = 0

    render(() => (
      <LazyMotion features={domMax}>
        <m.div
          id="parent"
          onClick={() => setState(!state())}
          layout
          style={{
            position: 'absolute',
            top: state() ? '0px' : '200px',
            left: state() ? '0px' : '200px',
            width: state() ? '200px' : '400px',
            height: '200px',
            background: 'red',
          }}
          transition={{
            ease: (t: number) => {
              frameCount++
              // Boxes are resolved relatively after the first frame.
              return frameCount > 1 ? 0.5 : t
            },
          }}
        >
          <m.div
            id="child"
            layout
            style={{
              width: state() ? '100px' : '200px',
              height: '100px',
              background: 'blue',
            }}
            transition={{ delay: 100 }}
          />
        </m.div>
      </LazyMotion>
    ))

    await wait(50)
    const parent = document.getElementById('parent') as HTMLElement
    const child = document.getElementById('child') as HTMLElement
    expectBbox(parent, { top: 0, left: 0, width: 200, height: 200 })
    expectBbox(child, { top: 0, left: 0, width: 100, height: 100 })

    parent.click()
    await wait(50)
    // Parent halfway between {0,0,200,200} and {200,200,400,200} →
    // {100,100,300,200}. Child halfway between {0,0,100,100} and
    // {0,0,200,100} but its own animation is delayed by 100 — so it
    // should be projected to the parent's interpolated bbox: top/left
    // shift with parent, size stays at the source.
    expectBbox(parent, { top: 100, left: 100, width: 300, height: 200 })
    expectBbox(child, { top: 100, left: 100, width: 100, height: 100 })
  })
})
