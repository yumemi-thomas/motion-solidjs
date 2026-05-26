import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, For, Show } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { AnimatePresence, motion } from '@/components'
import { wait } from './helpers'

afterEach(() => cleanup())

// Port of motion-upstream/packages/framer-motion/cypress/integration/layout-shared-lightbox-crossfade.ts
// Fixture mirrors dev/react/src/tests/layout-shared-lightbox-crossfade.tsx.
//
// A 3-item gallery: clicking an item opens an AnimatePresence-mounted
// SingleImage with the same `layoutId` as the clicked thumb. The thumb
// crossfades to the opened lightbox, then crossfades back when the
// overlay is clicked. Borders + opacities are interpolated by the
// projection engine alongside the bbox.

const numColors = 3
const colors = Array.from(
  { length: numColors },
  (_, i) => `hsl(${Math.round((360 / numColors) * i)}, 100%, 50%)`,
)

const background = {
  position: 'fixed' as const,
  top: '0',
  left: '0',
  bottom: '0',
  right: '0',
  display: 'flex',
  'justify-content': 'center',
  'align-items': 'center',
  background: '#ccc',
}

const container = {
  'background-color': '#eeeeee',
  'border-radius': '25px',
  width: '600px',
  height: '600px',
  margin: '0',
  padding: '0 20px 20px 0',
  display: 'flex',
  'flex-wrap': 'wrap' as const,
  'justify-content': 'space-between',
  'align-items': 'space-between',
  'list-style': 'none',
}

const item = {
  padding: '20px',
  cursor: 'pointer',
  margin: '20px 0 0 20px',
  flex: '1 1 90px',
  display: 'flex',
  'justify-content': 'center',
  'align-items': 'center',
}

const overlay = {
  background: 'rgba(0,0,0,0.6)',
  position: 'fixed' as const,
  top: '0',
  left: '0',
  bottom: '0',
  right: '0',
}

const singleImageContainer = {
  position: 'absolute' as const,
  top: '0',
  left: '0',
  bottom: '0',
  right: '0',
  display: 'flex',
  'justify-content': 'center',
  'align-items': 'center',
  'pointer-events': 'none' as const,
}

const singleImage = {
  width: '500px',
  height: '300px',
  padding: '50px',
}

const child = {
  width: '50px',
  height: '50px',
  'border-radius': '25px',
  'background-color': 'white',
  opacity: 0.5,
}

function runScriptCrossfade(transition: any) {
  const [openColor, setOpen] = createSignal<false | string>(false)

  render(() => (
    <div style={background}>
      <ul style={container}>
        <For each={colors}>
          {(color, i) => (
            <motion.li
              onClick={() => setOpen(color)}
              style={{ ...item, 'background-color': color, 'border-radius': 0 }}
              layoutId={color}
              transition={transition}
              {...(i() === 0 ? { id: 'item-parent' } : {})}
            >
              <motion.div
                style={child}
                {...(i() === 0 ? { id: 'item-child' } : {})}
                layoutId={`child-${color}`}
                transition={transition}
              />
            </motion.li>
          )}
        </For>
      </ul>
      <AnimatePresence>
        <Show when={openColor() !== false ? openColor() : null} keyed>
          {(color) => (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ ...overlay, 'pointer-events': 'auto' }}
                id="overlay"
                transition={transition}
                onClick={() => setOpen(false)}
              />
              <div style={singleImageContainer}>
                <motion.div
                  id="parent"
                  layoutId={color}
                  style={{
                    ...singleImage,
                    'background-color': '#fff',
                    'border-radius': '50px',
                  }}
                  transition={transition}
                >
                  <motion.div
                    style={{ ...child, 'background-color': 'black' }}
                    id="child"
                    layoutId={`child-${color}`}
                    transition={transition}
                  />
                </motion.div>
              </div>
            </>
          )}
        </Show>
      </AnimatePresence>
    </div>
  ))
}

function expectBbox(
  el: HTMLElement,
  expected: { top: number; left: number; width: number; height: number },
) {
  const bbox = el.getBoundingClientRect()
  expect(bbox.top).toBe(expected.top)
  expect(bbox.left).toBe(expected.left)
  expect(bbox.width).toBe(expected.width)
  expect(bbox.height).toBe(expected.height)
}

async function runFullScript(transition: any) {
  runScriptCrossfade(transition)
  await wait(50)

  const itemParent = document.getElementById('item-parent') as HTMLElement
  expectBbox(itemParent, { top: 40, left: 210, width: 180, height: 580 })

  const itemChild = document.getElementById('item-child') as HTMLElement
  expectBbox(itemChild, { top: 305, left: 275, width: 50, height: 50 })

  itemParent.click()
  await wait(50)

  // Source item-parent crossfades out
  const itemParent2 = document.getElementById('item-parent') as HTMLElement
  expect(window.getComputedStyle(itemParent2).borderRadius).toBe('8.33333% / 12.5%')
  expect(window.getComputedStyle(itemParent2).opacity).toBe('0')
  expectBbox(itemParent2, { top: 130, left: 200, width: 600, height: 400 })

  const itemChild2 = document.getElementById('item-child') as HTMLElement
  expect(window.getComputedStyle(itemChild2).borderRadius).toBe('50%')
  expect(window.getComputedStyle(itemChild2).opacity).toBe('0')
  expectBbox(itemChild2, { top: 180, left: 250, width: 50, height: 50 })

  const parent = document.getElementById('parent') as HTMLElement
  expect(window.getComputedStyle(parent).borderRadius).toBe('50px')
  expect(window.getComputedStyle(parent).opacity).toBe('1')
  expectBbox(parent, { top: 130, left: 200, width: 600, height: 400 })

  const child = document.getElementById('child') as HTMLElement
  expect(window.getComputedStyle(child).borderRadius).toBe('25px')
  expect(window.getComputedStyle(child).opacity).toBe('0.5')
  expectBbox(child, { top: 180, left: 250, width: 50, height: 50 })

  // Close lightbox
  const overlay = document.getElementById('overlay') as HTMLElement
  overlay.click()
  await wait(50)

  const itemParent3 = document.getElementById('item-parent') as HTMLElement
  expect(window.getComputedStyle(itemParent3).borderRadius).toBe('0px')
  expect(window.getComputedStyle(itemParent3).opacity).toBe('1')
  expectBbox(itemParent3, { top: 40, left: 210, width: 180, height: 580 })

  const itemChild3 = document.getElementById('item-child') as HTMLElement
  expect(window.getComputedStyle(itemChild3).borderRadius).toBe('25px')
  expect(window.getComputedStyle(itemChild3).opacity).toBe('0.5')
  expectBbox(itemChild3, { top: 305, left: 275, width: 50, height: 50 })
}

describe('Shared layout lightbox example, crossfade', () => {
  it('correctly animates between items and lightbox with instant transition', async () => {
    await runFullScript({ type: false })
  })
  // Requires: borderRadius scale correction during shared-layoutId
  // crossfade. The bbox + opacity assertions already pass after the
  // prevLead-willUpdate + runExit-awaits-animationComplete fixes;
  // borderRadius needs the projection-corrected percentage form
  // (e.g. `8.33333% / 12.5%`) which requires forcing the style key
  // into latestValues + applying the renderer's scale corrector.

  it('correctly animates between items and lightbox with very fast transition', async () => {
    await runFullScript({ duration: 0.01 })
  })
  // Same as above.
})
