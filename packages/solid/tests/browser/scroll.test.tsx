import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, onCleanup, onMount, untrack } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { frameData, scroll } from 'motion'
import { wait } from './helpers'

afterEach(() => {
  window.scrollTo(0, 0)
  cleanup()
})

describe('scroll() callbacks', () => {
  it('correctly measures window scroll progress', async () => {
    const [progress, setProgress] = createSignal(0)
    const [error, setError] = createSignal('')

    render(() => {
      onMount(() => {
        let prevFrameStamp = 0
        const unsub = scroll((p) => {
          setProgress(p)
          if (prevFrameStamp === frameData.timestamp) {
            setError('Concurrent event handlers detected')
          }
          prevFrameStamp = frameData.timestamp
        })
        onCleanup(unsub)
      })
      return (
        <>
          <div style={{ height: '100vh', 'background-color': 'red' }} />
          <div style={{ height: '100vh', 'background-color': 'green' }} />
          <div style={{ height: '100vh', 'background-color': 'blue' }} />
          <div style={{ height: '100vh', 'background-color': 'yellow' }} />
          <div id="progress" style={{ position: 'fixed', top: 0, left: 0 }}>
            {progress()}
          </div>
          <div id="error" style={{ position: 'fixed', bottom: 0, left: 0 }}>
            {error()}
          </div>
        </>
      )
    })

    await wait(100)
    expect(untrack(progress)).toBeCloseTo(0, 1)
    // viewport 660 tall, doc ~4*660=2640 → scroll range ~1980. Half = 990.
    window.scrollTo(0, 990)
    await wait(200)
    expect(untrack(progress)).toBeGreaterThan(0.4)
    expect(untrack(progress)).toBeLessThan(0.6)
    expect(untrack(error)).toBe('')
  })
})
