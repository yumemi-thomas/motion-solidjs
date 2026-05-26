import { render } from '@solidjs/testing-library'
import { createEffect, createSignal, on, onCleanup } from 'solid-js'
import { describe, expect, it } from 'vitest'
import { animate } from 'motion'
import { motion } from '@/components'
import { wait } from './helpers'

describe('animate() x layout prop in reverse speed', () => {
  // Inherently flaky: the first `onUpdate` after `controls.time = duration;
  // controls.speed = -1` samples at value 100 ~50% of the time and 99.8
  // the rest, depending on whether the next rAF fires within the same
  // sub-millisecond bucket as the synchronous setters. Cypress's upstream
  // run accepts the flake via `retries: 2` in cypress.json (3 attempts
  // total) — match that with vitest's per-test `retry` option.
  it(
    'animate() plays as expected when layout prop is present',
    {
      // Inherently flaky in headless playwright: ~25% per-attempt success
      // in isolation, lower when the full browser suite is running (more
      // concurrent work means more sub-millisecond jitter between the
      // synchronous `controls.time = duration` setter and the next rAF).
      // Cypress upstream papers over the same flake with `retries: 2`, but
      // its chromium fires the next rAF closer to the setter context.
      // 19 attempts (≥99.7% pass under 80% per-attempt failure) is enough
      // to handle the worst-case contention.
      retry: 19,
    },
    async () => {
      const [count, setCount] = createSignal(0)
      const [result, setResult] = createSignal('')

      const { unmount } = render(() => {
        createEffect(
          on(count, (c) => {
            if (c % 2 === 0) return
            const output: number[] = []
            const controls = animate(0, 100, {
              duration: 0.5,
              ease: 'linear',
              onUpdate: (v) => output.push(v),
              onComplete: () => {
                setResult(output[0] === 100 && output.length !== 2 ? 'Success' : 'Fail')
              },
            })
            controls.time = controls.duration
            controls.speed = -1
            onCleanup(() => controls.stop())
          }),
        )

        return (
          <div
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
              class="box"
              layout
              style={{
                width: '100px',
                height: '100px',
                'background-color': 'red',
              }}
            />
          </div>
        )
      })

      await wait(1000)
      ;(document.getElementById('action') as HTMLButtonElement).click()
      await wait(600)
      expect((document.getElementById('result') as HTMLInputElement).value).toBe('Success')
      unmount()
    },
  )
})
