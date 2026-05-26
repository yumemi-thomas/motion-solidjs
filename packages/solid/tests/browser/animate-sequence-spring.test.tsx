import { render } from '@solidjs/testing-library'
import { createSignal, onMount } from 'solid-js'
import { describe, expect, it } from 'vitest'
import { createAnimate } from '@/primitives/create-animate'
import { wait } from './helpers'

describe('animate() sequence with spring defaultTransition (#3158)', () => {
  // Sequence resolves at ~2055ms in our env (each spring segment runs
  // sequentially: ~950ms for x:[0,20] non-granular + ~1100ms for
  // scale:[1,2] granular). Upstream cypress passes with `wait(2000)`
  // because cypress's `.should()` block has an implicit retry up to
  // `defaultCommandTimeout` (4 s) — the EFFECTIVE wait is `wait(2000) +
  // retry(≤4000ms) = up to ~6 s`. We mirror that with `expect.poll`.
  it('does not throw when using type: spring with 2-keyframe sequence segments', async () => {
    const [result, setResult] = createSignal('')

    const { unmount } = render(() => {
      const [scope, animate] = createAnimate<HTMLDivElement>()
      onMount(() => {
        animate(
          [
            ['#box-a', { x: [0, 20], y: [0, 20] }],
            ['#box-b', { scale: [1, 2] }],
          ],
          { defaultTransition: { type: 'spring' } },
        )
          .then(() => setResult('Success'))
          .catch(() => setResult('Error'))
      })
      return (
        <div ref={scope.set} style={{ padding: '100px' }}>
          <div
            id="box-a"
            style={{
              width: '100px',
              height: '100px',
              'background-color': 'red',
            }}
          />
          <div
            id="box-b"
            style={{
              width: '100px',
              height: '100px',
              'background-color': 'blue',
            }}
          />
          <input id="result" readOnly value={result()} />
        </div>
      )
    })

    await wait(2000)
    // Cypress upstream's `.should(...)` retries the assertion until pass
    // or default 4 s timeout. Match that here with `expect.poll`.
    await expect
      .poll(() => (document.getElementById('result') as HTMLInputElement).value, { timeout: 4000 })
      .toBe('Success')
    unmount()
  }, 8000)
})
