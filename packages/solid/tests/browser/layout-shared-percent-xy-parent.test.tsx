import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, For, Show } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { wait } from './helpers'

afterEach(() => cleanup())

// Port of motion-upstream/packages/framer-motion/cypress/integration/layout-shared-percent-xy-parent.ts
// Fixture mirrors dev/react/src/tests/layout-shared-percent-xy-parent.tsx.
//
// Regression for upstream #3254. The "indicator" motion.div with layoutId
// lives inside a parent motion.div whose own `x` / `y` are percentage
// values. Switching the selected tab triggers a shared-layout animation
// for the indicator. With `ease: () => 0.5` + `duration: 10s` the animation
// holds at 50% the entire test window, so the indicator's left should sit
// roughly midway between tab-0 (left=75) and tab-2 (left=275), i.e. ~175.
// If percentage x/y on the parent corrupts the projection delta the
// indicator snaps to its end position (left=275).

describe('Layout animation with percentage x/y parent (#3254)', () => {
  it('layoutId indicator animates to correct position within parent with percentage x/y', async () => {
    const [selected, setSelected] = createSignal(0)

    render(() => (
      <motion.div style={{ x: '25%', y: '25%', width: '300px' }}>
        <div style={{ display: 'flex', height: '32px' }}>
          <For each={[0, 1, 2]}>
            {(index) => (
              <div
                id={`tab-${index}`}
                onClick={() => setSelected(index)}
                style={{
                  flex: 1,
                  position: 'relative',
                  cursor: 'pointer',
                }}
              >
                <Show when={selected() === index}>
                  <motion.div
                    layoutId="indicator"
                    id="indicator"
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: '4px',
                      background: 'red',
                    }}
                    transition={{ duration: 10, ease: () => 0.5 }}
                  />
                </Show>
              </div>
            )}
          </For>
        </div>
      </motion.div>
    ))

    await wait(200)
    const indicator0 = document.getElementById('indicator')
    expect(indicator0).not.toBeNull()

    const tab2 = document.getElementById('tab-2') as HTMLElement
    tab2.click()
    await wait(500)

    const indicator = document.getElementById('indicator') as HTMLElement
    const bbox = indicator.getBoundingClientRect()
    // Parent has x:"25%" of 300px = 75px translate. Tab-0 starts at 75,
    // tab-2 starts at 275. At ease:() => 0.5 progress, indicator should
    // be at ~175. Without percent-aware projection, snaps to 275.
    expect(bbox.left).toBeGreaterThan(100)
    expect(bbox.left).toBeLessThan(250)
  })
})
