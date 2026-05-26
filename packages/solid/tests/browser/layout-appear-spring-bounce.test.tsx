import { cleanup, render } from '@solidjs/testing-library'
import { onMount, onCleanup } from 'solid-js'
import { animate } from 'motion'
import { motionValue } from 'motion-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { wait } from './helpers'

// Port of motion-upstream/packages/framer-motion/cypress/integration/layout-appear-spring-bounce.ts
// against motion-upstream/dev/react/src/tests/layout-appear-spring-bounce.tsx.
//
// Reproduces the Framer bug:
// 1. Appear animation sets velocity on motionValue when stopped (simulated via
//    setWithVelocity).
// 2. A subsequent time-defined spring (duration + bounce) reads that velocity.
// 3. Without the fix, findSpring() computes wrong parameters and the value
//    wildly oscillates well past the small delta target.

afterEach(() => cleanup())

const springTransition = {
  type: 'spring' as const,
  duration: 0.4,
  bounce: 0.2,
}

describe('Time-defined spring with inherited velocity', () => {
  it("Doesn't wildly oscillate when velocity is inherited from interrupted animation", async () => {
    // Start at 0.5 (simulating an appear animation mid-flight).
    const opacity = motionValue(0.5)
    const scale = motionValue(1)

    let trackerEl: HTMLDivElement | undefined

    function Fixture() {
      onMount(() => {
        // Simulate WAAPI handoff: inject velocity as if the appear animation
        // was stopped mid-flight (sampleDelta=10ms gives ~5/s upward velocity).
        const sampleDelta = 10
        opacity.setWithVelocity(0.45, 0.5, sampleDelta)

        // Start the hover animation — reads velocity from motionValue.
        animate(opacity, 0.49, springTransition)
        animate(scale, 1.1, springTransition)

        let minOpacity = 0.5
        let maxOpacity = 0.5
        let minScale = 1
        let maxScale = 1

        const unsubOpacity = opacity.on('change', (v: number) => {
          if (v < minOpacity) minOpacity = v
          if (v > maxOpacity) maxOpacity = v
          if (trackerEl) {
            trackerEl.dataset.minOpacity = minOpacity.toFixed(4)
            trackerEl.dataset.maxOpacity = maxOpacity.toFixed(4)
          }
        })

        const unsubScale = scale.on('change', (v: number) => {
          if (v < minScale) minScale = v
          if (v > maxScale) maxScale = v
          if (trackerEl) {
            trackerEl.dataset.minScale = minScale.toFixed(4)
            trackerEl.dataset.maxScale = maxScale.toFixed(4)
          }
        })

        onCleanup(() => {
          unsubOpacity()
          unsubScale()
        })
      })

      return (
        <>
          <div id="tracker" ref={(el) => (trackerEl = el)} />
          <motion.div
            style={{
              position: 'absolute',
              top: '50px',
              left: '50px',
              width: '231px',
              height: '231px',
              'background-color': 'rgb(153, 238, 255)',
            }}
          >
            <motion.div
              id="box"
              style={{
                width: '115px',
                height: '106px',
                'background-color': 'rgb(68, 204, 255)',
                position: 'absolute',
                top: '50%',
                left: '50%',
                x: '-50%',
                y: '-50%',
                opacity,
                scale,
              }}
            />
          </motion.div>
        </>
      )
    }

    render(() => <Fixture />)

    // Cypress wait of 1500ms for spring to settle.
    await wait(1500)

    const tracker = document.getElementById('tracker') as HTMLElement
    const maxOpacity = Number(tracker.dataset.maxOpacity)

    // Opacity starts at 0.5, targets 0.49 (tiny delta of 0.01). A well-behaved
    // spring should barely overshoot above 0.5. Bug: velocity causes overshoot
    // to ~0.58+. Fixed: maxOpacity stays under 0.55.
    expect(maxOpacity).toBeLessThan(0.55)
  })
})
