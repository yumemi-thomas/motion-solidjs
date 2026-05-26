import { cleanup, render } from '@solidjs/testing-library'
import { onCleanup, onMount } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { scroll } from 'motion'
import { wait } from './helpers'

afterEach(() => cleanup())

// Port of motion-upstream/packages/framer-motion/cypress/integration/scroll.ts
// — element-scoped scroll progress on both axes.
describe('scroll() element scroll progress', () => {
  it('correctly updates element scroll progress callback (y axis)', async () => {
    let ref!: HTMLDivElement
    let progressEl!: HTMLDivElement
    const spacer = { height: '400px' }
    render(() => {
      onMount(() => {
        const unsub = scroll(
          (p) => {
            progressEl.textContent = String(p)
          },
          { source: ref },
        )
        onCleanup(unsub)
      })
      return (
        <div
          id="scroller"
          ref={(el) => (ref = el)}
          style={{ width: '100px', height: '400px', overflow: 'scroll' }}
        >
          <div style={{ ...spacer, background: 'red' }} />
          <div style={{ ...spacer, background: 'green' }} />
          <div style={{ ...spacer, background: 'blue' }} />
          <div style={{ ...spacer, background: 'yellow' }} />
          <div ref={(el) => (progressEl = el)} id="progress">
            0
          </div>
        </div>
      )
    })
    await wait(100)
    ref.scrollTo(0, 600)
    await wait(200)
    const progress = parseFloat(progressEl.textContent ?? '0')
    expect(progress).toBeGreaterThan(0.49)
    expect(progress).toBeLessThan(0.51)
  })

  it('correctly updates element scroll progress callback (x axis)', async () => {
    let ref!: HTMLDivElement
    let progressEl!: HTMLDivElement
    // Children in a flex-row container shrink to fit unless `flex` is set
    // explicitly. Mirror the upstream fixture (dev/react/src/tests/
    // scroll-callback-element-x.tsx) which sets `flex: 0 0 400px` so each
    // child preserves its 400px width and the scroller actually scrolls.
    const spacer = { width: '400px', height: '200px', flex: '0 0 400px' }
    render(() => {
      onMount(() => {
        const unsub = scroll(
          (p) => {
            progressEl.textContent = String(p)
          },
          { source: ref, axis: 'x' },
        )
        onCleanup(unsub)
      })
      return (
        <div
          id="scroller"
          ref={(el) => (ref = el)}
          style={{
            height: '200px',
            width: '400px',
            overflow: 'scroll',
            display: 'flex',
            'flex-direction': 'row',
          }}
        >
          <div style={{ ...spacer, background: 'red' }} />
          <div style={{ ...spacer, background: 'green' }} />
          <div style={{ ...spacer, background: 'blue' }} />
          <div style={{ ...spacer, background: 'yellow' }} />
          {/* Position fixed so the readout doesn't add to scroll width. */}
          <div
            ref={(el) => (progressEl = el)}
            id="progress"
            style={{ position: 'fixed', top: 0, left: 0 }}
          >
            0
          </div>
        </div>
      )
    })
    await wait(100)
    ref.scrollTo(600, 0)
    await wait(200)
    const progress = parseFloat(progressEl.textContent ?? '0')
    expect(progress).toBeGreaterThan(0.49)
    expect(progress).toBeLessThan(0.51)
  })
})
