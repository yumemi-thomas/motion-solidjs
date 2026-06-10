import { cleanup, render } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'
import { createScroll } from '@/primitives/create-scroll'
import { createMotionValueEvent } from '@/primitives'
import { wait } from './helpers'

afterEach(() => cleanup())

// Port of motion-upstream/packages/framer-motion/cypress/integration/scroll.ts
// — `cy.get("#container").scrollTo(0, 50)` → label="0.5".
describe('scroll() container tracking', () => {
  it('correctly updates window scroll progress callback', async () => {
    let containerRef!: HTMLDivElement
    let targetRef!: HTMLDivElement
    let labelEl!: HTMLSpanElement
    render(() => {
      const scrollState = createScroll({
        container: () => containerRef,
        target: () => targetRef,
        offset: ['start start', 'end start'],
      })
      createMotionValueEvent(scrollState.scrollYProgress, 'change', (v) => {
        labelEl.textContent = String(v)
      })
      return (
        <>
          <div style={{ height: '100px', width: '100px' }} />
          <div
            id="container"
            ref={(el) => (containerRef = el)}
            style={{
              'overflow-y': 'auto',
              height: '300px',
              width: '300px',
              position: 'relative',
            }}
          >
            <div style={{ height: '1000px', width: '300px', background: 'red' }}>
              <div
                ref={(el) => (targetRef = el)}
                style={{
                  width: '100px',
                  height: '100px',
                  'font-size': '24px',
                  display: 'flex',
                  background: 'white',
                }}
              >
                <span id="label" ref={(el) => (labelEl = el)}>
                  0
                </span>
              </div>
            </div>
          </div>
        </>
      )
    })

    await wait(100)
    // Target at top: 0px relative to container, end at 100px. With offset
    // ['start start', 'end start'], progress = 0 when target.start = scroll.start,
    // progress = 1 when target.end = scroll.start. The target's height is 100
    // so we need to scroll 100px to go from 0 → 1; halfway is 50.
    containerRef.scrollTo(0, 50)
    await wait(100)
    const progress = parseFloat(labelEl.textContent ?? '0')
    expect(progress).toBeCloseTo(0.5, 1)
  })
})
