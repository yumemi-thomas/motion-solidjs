import { cleanup, render } from '@solidjs/testing-library'
import { createEffect, createSignal, on, onCleanup } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { wait } from './helpers'

afterEach(() => cleanup())

// Port of motion-upstream/packages/framer-motion/cypress/integration/layout-read-transform.ts
// — fixture mirrors dev/react/src/tests/layout-read-transform.tsx.
//
// The fixture cycles `step` 0 → 1 → 2 with 100ms gaps. Each step keys the box
// to either "0" (small 100x100) or "1" (large 200x200), and shares the same
// `layoutId="box"`. On step 1 we additionally `animate={ scale: 2 }`; on step
// 2 we drop back to the default scale. If projection erroneously reads the
// in-flight layout-correction transform as the *initial* transform when the
// scale animation kicks back to its default, the box ends up around scale 0.5
// (i.e. 100x100 instead of 200x200). Correct behavior keeps it at 200x200.
function expectBbox(
  el: HTMLElement,
  expected: { top: number; left: number; width: number; height: number },
) {
  const bbox = el.getBoundingClientRect()
  expect(Math.round(bbox.left)).toBe(expected.left)
  expect(Math.round(bbox.top)).toBe(expected.top)
  expect(Math.round(bbox.width)).toBe(expected.width)
  expect(Math.round(bbox.height)).toBe(expected.height)
}

function App() {
  const [step, setStep] = createSignal(0)

  createEffect(
    on(step, (s) => {
      if (s < 2) {
        const t = setTimeout(() => setStep(s + 1), 100)
        onCleanup(() => clearTimeout(t))
      }
    }),
  )

  return (
    <motion.div
      id="box"
      // Upstream's React fixture sets `key={step === 0 ? '0' : '1'}` to force
      // a remount between step 0 → 1. Solid has no React-style `key` prop, and
      // the layout test relies on `layoutId` continuity rather than remounting,
      // so the prop is omitted in the port.
      layoutId="box"
      // Animate to scale: 2 for step 1, then back to default for step 2.
      animate={step() === 1 ? { scale: 2 } : {}}
      transition={{ duration: 0.05 }}
      style={{
        background: 'red',
        width: step() === 0 ? '100px' : '200px',
        height: step() === 0 ? '100px' : '200px',
      }}
    />
  )
}

describe('Read initial transform during layout animation', () => {
  it('Should not read a projection transform as the initial transform', async () => {
    render(() => <App />)
    // Total ~300ms: step 0→1 at 100ms (scale 2 anim 50ms), 1→2 at 200ms
    // (scale anim back to default 50ms). Then settle.
    await wait(400)
    const box = document.getElementById('box') as HTMLElement
    expectBbox(box, { top: 0, left: 0, width: 200, height: 200 })
  })
})
