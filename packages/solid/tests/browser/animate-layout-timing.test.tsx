import { cleanup, render } from '@solidjs/testing-library'
import { createEffect, createSignal, on, onCleanup } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { animate } from 'motion'
import { motion } from '@/components'
import { wait } from './helpers'

/**
 * Port of motion-upstream/packages/framer-motion/cypress/integration/animate-layout-timing.ts
 * Fixture: motion-upstream/dev/react/src/tests/animate-layout-timing.tsx
 *
 * When `animate()` runs in a tree that also has a `layout` motion node,
 * the per-frame scheduler must not coalesce the first onUpdate with the
 * onComplete: the test asserts that the output array doesn't degenerate
 * to two samples [start, end]. The layout-projection frame loop has to
 * keep the main animate() loop ticking independently.
 */

afterEach(() => cleanup())

describe('animate() x layout prop timing', () => {
  it('animate() plays as expected when layout prop is present', async () => {
    const [count, setCount] = createSignal(0)
    const [result, setResult] = createSignal('')

    render(() => {
      createEffect(
        on(count, (c) => {
          if (c % 2 === 0) return
          const output: number[] = []
          const controls = animate(0, 100, {
            duration: 0.5,
            ease: 'linear',
            onUpdate: (v: number) => output.push(v),
            onComplete: () =>
              setResult(output[1] !== 100 && output.length !== 2 ? 'Success' : 'Fail'),
          })
          onCleanup(() => controls.stop())
        }),
      )

      return (
        <section
          style={{
            position: 'relative',
            display: 'flex',
            'flex-direction': 'column',
            padding: '100px',
          }}
        >
          <button id="action" onClick={() => setCount((c) => c + 1)}>
            Animate
          </button>
          <input id="result" readOnly value={result()} />
          <motion.div
            layout
            style={{
              width: '100px',
              height: '100px',
              'background-color': 'red',
            }}
          />
        </section>
      )
    })

    await wait(1000)
    ;(document.getElementById('action') as HTMLButtonElement).click()
    await wait(600)

    const resultEl = document.getElementById('result') as HTMLInputElement
    expect(resultEl.value).toBe('Success')
  })
})
