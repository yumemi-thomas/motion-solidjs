import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, onMount } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { scroll } from 'motion'
import { wait } from './helpers'

afterEach(() => {
  window.scrollTo(0, 0)
  cleanup()
})

describe('scroll() full height target', () => {
  it("doesn't return progress 1 before it hits its first offset", async () => {
    const [progress, setProgress] = createSignal(0.5)
    render(() => {
      let section!: HTMLElement
      onMount(() => {
        scroll((p) => setProgress(p), { target: section })
      })
      return (
        <>
          <div style={{ height: '50vh' }} />
          <section
            ref={(el) => (section = el)}
            style={{
              height: '100vh',
              display: 'flex',
              'justify-content': 'center',
              'align-items': 'center',
              color: 'white',
            }}
          >
            <pre id="content">{progress()}</pre>
          </section>
        </>
      )
    })

    await wait(100)
    const text = document.getElementById('content')!.textContent
    expect(text).toBe('0')
  })
})
