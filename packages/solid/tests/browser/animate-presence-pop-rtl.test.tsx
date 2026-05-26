import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, Show } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { AnimatePresence, motion } from '@/components'
import { wait } from './helpers'

/**
 * Port of motion-upstream/packages/framer-motion/cypress/integration/animate-presence-pop-rtl.ts
 * Fixture: motion-upstream/dev/react/src/tests/animate-presence-pop-rtl.tsx
 *
 * popLayout inside `dir="rtl"` must anchor the popped element on the
 * right edge instead of the left, so the remaining sibling keeps its
 * `getBoundingClientRect().left`.
 */

afterEach(() => cleanup())

const boxStyles = {
  width: '100px',
  height: '100px',
}

describe('AnimatePresence popLayout RTL', () => {
  it('correctly pops exiting elements in RTL direction without shifting', async () => {
    const [state, setState] = createSignal(true)
    render(() => (
      <div dir="rtl">
        <div
          id="container"
          style={{
            display: 'flex',
            width: 'fit-content',
            position: 'relative',
          }}
          onClick={() => setState(!state())}
        >
          <AnimatePresence mode="popLayout">
            <motion.div id="a" style={{ ...boxStyles, 'background-color': 'red' }} />
            <Show when={state()}>
              <motion.div
                id="b"
                exit={{ opacity: 0, transition: { duration: 10 } }}
                style={{ ...boxStyles, 'background-color': 'green' }}
              />
            </Show>
          </AnimatePresence>
        </div>
      </div>
    ))

    await wait(50)
    const b = document.getElementById('b') as HTMLElement
    const initialLeft = b.getBoundingClientRect().left

    ;(document.getElementById('container') as HTMLElement).click()
    await wait(100)

    const after = (document.getElementById('b') as HTMLElement).getBoundingClientRect()
    expect(after.left).toBe(initialLeft)
  })
})
