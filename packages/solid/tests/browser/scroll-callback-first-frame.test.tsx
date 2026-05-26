import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, onCleanup, onMount, untrack } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { scroll } from 'motion'
import { wait } from './helpers'

afterEach(() => {
  window.scrollTo(0, 0)
  cleanup()
})

describe('scroll() callback first frame', () => {
  it('fires callback on first frame, before scroll event', async () => {
    const [progress, setProgress] = createSignal(0)
    render(() => {
      onMount(() => {
        const unsub = scroll((p) => setProgress(2 - p))
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
        </>
      )
    })

    await wait(100)
    expect(untrack(progress)).toBe(2)
  })
})
