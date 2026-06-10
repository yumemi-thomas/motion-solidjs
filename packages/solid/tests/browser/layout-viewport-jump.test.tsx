import { cleanup, render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { wait } from './helpers'

afterEach(() => cleanup())

// Port of motion-upstream/packages/framer-motion/cypress/integration/layout-viewport-jump.ts
// Fixture mirrors dev/react/src/tests/layout-viewport-jump.tsx.
//
// When the viewport scrolls but no layout-affecting state changed, layout
// projection must NOT trigger a fake "animation" from the pre-scroll bbox
// to the post-scroll bbox. Only after the state-change click should the
// projection emit a layout animation back to the relative top:100 spot.
// `ease: () => 0.1` keeps the animation at 10% so we can sample mid-flight.

function expectBboxClose(
  el: HTMLElement,
  expected: { top: number; width: number; height: number },
  tolerance = 2,
) {
  const bbox = el.getBoundingClientRect()
  expect(Math.abs(Math.floor(bbox.top) - expected.top)).toBeLessThanOrEqual(tolerance)
  expect(Math.abs(Math.floor(bbox.width) - expected.width)).toBeLessThanOrEqual(tolerance)
  expect(Math.abs(Math.floor(bbox.height) - expected.height)).toBeLessThanOrEqual(tolerance)
}

const containerStyle = {
  'margin-top': '100px',
  display: 'flex',
  'justify-content': 'center',
  'align-items': 'flex-start',
}

const boxStyle = {
  width: '100px',
  height: '100px',
  'border-radius': '10px',
  'background-color': '#ffaa00',
}

const scrollableStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: '500px',
  overflow: 'scroll',
} as const

describe('Viewport jump', () => {
  it('window scroll does not trigger a layout animation', async () => {
    const [state, setState] = createSignal(true)

    render(() => (
      <div
        style={{
          ...containerStyle,
          height: state() ? '1000px' : 'auto',
        }}
      >
        <motion.div
          layout
          id="box"
          style={boxStyle}
          onClick={() => setState(!state())}
          transition={{ ease: () => 0.1 }}
        />
      </div>
    ))

    await wait(50)
    const box = document.getElementById('box') as HTMLElement
    expectBboxClose(box, { height: 100, top: window.scrollY === 0 ? 100 : 0, width: 100 })

    window.scrollTo(0, 100)
    await wait(50)
    expectBboxClose(box, { height: 100, top: 0, width: 100 })

    box.click()
    await wait(50)
    // After click the container collapses to `height: auto`. The box has
    // a layout animation back from its previous DOM-relative position to
    // the new one. With ease: () => 0.1 holding at 10%, the box at the
    // new state's natural top:100 (relative to the scrolled viewport)
    // should still be at ~top:100.
    expectBboxClose(box, { height: 100, top: 100, width: 100 })
  })
  // Requires: layout-projection must distinguish "scroll-induced bbox
  // change" from a real layout update so the click is the only trigger
  // for the actual layout animation.

  it('div scroll does not trigger a layout animation when layoutScroll is set', async () => {
    const [state, setState] = createSignal(true)

    render(() => (
      <motion.div layoutScroll id="scrollable" style={scrollableStyle}>
        <div
          style={{
            ...containerStyle,
            height: state() ? '1000px' : 'auto',
          }}
        >
          <motion.div
            layout
            id="box"
            style={boxStyle}
            onClick={() => setState(!state())}
            transition={{ ease: () => 0.1 }}
          />
        </div>
      </motion.div>
    ))

    await wait(50)
    const box = document.getElementById('box') as HTMLElement
    expectBboxClose(box, { height: 100, top: 100, width: 100 })

    const scrollable = document.getElementById('scrollable') as HTMLElement
    scrollable.scrollTo(0, 100)
    await wait(50)
    expectBboxClose(box, { height: 100, top: 0, width: 100 })

    box.click()
    await wait(50)
    expectBboxClose(box, { height: 100, top: 100, width: 100 })
  })
})
