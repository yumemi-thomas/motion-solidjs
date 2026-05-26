import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, Show } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { AnimatePresence, motion } from '@/components'
import { wait } from './helpers'

/**
 * Port of motion-upstream/packages/framer-motion/cypress/integration/animate-presence-pop-subpixel.ts
 * Fixture: motion-upstream/dev/react/src/tests/animate-presence-pop-subpixel.tsx
 *
 * popLayout must measure the child via `parseFloat(getComputedStyle.width)`
 * (sub-pixel-accurate) rather than `offsetWidth` (rounded to an int) so
 * the absolute-positioned exiting clone matches the pre-pop bounding
 * rect to within 0.1px. The content-box variant also exercises padding +
 * border preservation.
 */

afterEach(() => cleanup())

function Fixture(props: { padding?: boolean }) {
  const [show, setShow] = createSignal(true)
  return (
    <div id="container" style={{ width: '400.4px', position: 'relative' }}>
      <AnimatePresence mode="popLayout">
        <Show when={show()}>
          <motion.div
            id="child"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 10 } }}
            style={
              props.padding
                ? {
                    width: '200px',
                    padding: '20px',
                    'border-width': '5px',
                    'border-style': 'solid',
                    'border-color': 'red',
                    'box-sizing': 'content-box',
                  }
                : undefined
            }
          >
            Content
          </motion.div>
        </Show>
      </AnimatePresence>
      <button id="toggle" onClick={() => setShow(false)}>
        Toggle
      </button>
    </div>
  )
}

describe('AnimatePresence popLayout subpixel precision', () => {
  // Fixed in src/components/animate-presence/animate-presence.tsx —
  // `addPopStyle` now measures via `parseFloat(getComputedStyle(element).width)`
  // (sub-pixel-accurate) instead of `offsetWidth` (integer-rounded), mirroring
  // upstream's PopChild.tsx. The fixture's container is 400.4px wide so the
  // child measures e.g. 400.4px; the popped clone now stays within 0.1px.
  it('preserves sub-pixel width when popping layout', async () => {
    render(() => <Fixture />)

    await wait(50)
    const child = document.getElementById('child') as HTMLElement
    const initialWidth = child.getBoundingClientRect().width

    ;(document.getElementById('toggle') as HTMLButtonElement).click()
    await wait(50)
    const poppedWidth = (document.getElementById('child') as HTMLElement).getBoundingClientRect()
      .width

    expect(Math.abs(poppedWidth - initialWidth)).toBeLessThanOrEqual(0.1)
  })

  // Fixed in src/components/animate-presence/animate-presence.tsx —
  // `parseFloat(getComputedStyle.width)` returns the correct CSS `width`
  // value regardless of `box-sizing`. For `content-box`, that's the
  // content-only width (no padding/border), which is exactly what we
  // write back as `width: Xpx` so the popped element retains its rendered
  // size (padding + border layer on top, same as before pop).
  it('preserves width for content-box elements with padding and border', async () => {
    render(() => <Fixture padding />)

    await wait(50)
    const child = document.getElementById('child') as HTMLElement
    const initialWidth = child.getBoundingClientRect().width

    ;(document.getElementById('toggle') as HTMLButtonElement).click()
    await wait(50)
    const poppedWidth = (document.getElementById('child') as HTMLElement).getBoundingClientRect()
      .width

    expect(Math.abs(poppedWidth - initialWidth)).toBeLessThanOrEqual(0.5)
  })
})
