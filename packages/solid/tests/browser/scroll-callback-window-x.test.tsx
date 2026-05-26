import { cleanup, render } from '@solidjs/testing-library'
import { onCleanup, onMount } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { scroll } from 'motion'
import { wait } from './helpers'

afterEach(() => {
  window.scrollTo(0, 0)
  cleanup()
})

// Port of motion-upstream/packages/framer-motion/cypress/integration/
// scroll.ts — the x-axis window scroll progress test (`scroll-callback-window-x`).
describe('scroll() callback — x axis', () => {
  it('correctly updates window scroll progress on x axis', async () => {
    let progressEl!: HTMLDivElement
    render(() => {
      onMount(() => {
        const unsub = scroll(
          (p) => {
            progressEl.textContent = String(p)
          },
          { axis: 'x' },
        )
        onCleanup(unsub)
      })
      return (
        <div style={{ width: '400vw', display: 'flex', 'flex-direction': 'row' }}>
          <div style={{ width: '100vw', height: '500px', background: 'red' }} />
          <div style={{ width: '100vw', height: '500px', background: 'green' }} />
          <div style={{ width: '100vw', height: '500px', background: 'blue' }} />
          <div style={{ width: '100vw', height: '500px', background: 'yellow' }} />
          <div
            id="progress"
            ref={(el) => (progressEl = el)}
            style={{ position: 'fixed', top: 0, left: 0 }}
          >
            0
          </div>
        </div>
      )
    })

    await wait(100)
    // 1000px viewport, 4000px scroll width → 3000px scrollable. Halfway = 1500.
    const max = document.documentElement.scrollWidth - window.innerWidth
    expect(max).toBeGreaterThan(0)
    window.scrollTo(max / 2, 0)
    await wait(200)
    const progress = parseFloat(progressEl.textContent ?? '0')
    expect(progress).toBeGreaterThan(0.4)
    expect(progress).toBeLessThan(0.6)
  })
})
