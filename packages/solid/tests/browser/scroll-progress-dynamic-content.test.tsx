import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, onCleanup, onMount, Show } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { scroll } from 'motion'
import { wait } from './helpers'

afterEach(() => {
  window.scrollTo(0, 0)
  cleanup()
})

// Port of motion-upstream/packages/framer-motion/cypress/integration/scroll.ts
// — `scroll-progress-dynamic-content`. `trackContentSize: true` should
// recalc progress when content is added below the scroll viewport.
describe('scroll() dynamic content', () => {
  it('recalculates window scrollYProgress when content is added below', async () => {
    let progressEl!: HTMLDivElement
    let loadedEl!: HTMLDivElement
    const [showExtra, setShowExtra] = createSignal(false)

    render(() => {
      onMount(() => {
        const unsub = scroll(
          (p) => {
            progressEl.textContent = String(p)
          },
          // `trackContentSize` is declared on `ScrollInfoOptions` but not
          // surfaced through `ScrollOptions` in motion@12.40 — at runtime
          // `scroll()` falls back to `scrollInfo()` via `attachToFunction`
          // when a source/target is provided, so the option is honored.
          // See motion-upstream attach-function.ts:19-22.
          // @ts-expect-error — see comment above.
          { trackContentSize: true },
        )
        const t = setTimeout(() => setShowExtra(true), 500)
        onCleanup(() => {
          unsub()
          clearTimeout(t)
        })
      })
      return (
        <>
          <div style={{ height: '100vh', background: 'red' }} />
          <div style={{ height: '100vh', background: 'green' }} />
          <Show when={showExtra()}>
            <div id="extra-content" style={{ height: '100vh', background: 'purple' }} />
            <div style={{ height: '100vh', background: 'orange' }} />
          </Show>
          <div
            id="progress"
            ref={(el) => (progressEl = el)}
            style={{ position: 'fixed', top: 0, left: 0 }}
          >
            0
          </div>
          <div id="content-loaded" ref={(el) => (loadedEl = el)}>
            {showExtra() ? 'loaded' : 'loading'}
          </div>
        </>
      )
    })

    await wait(100)
    // Scroll to bottom (2 screens of content → progress near 1).
    window.scrollTo(0, document.documentElement.scrollHeight)
    await wait(200)
    expect(parseFloat(progressEl.textContent ?? '0')).toBeGreaterThan(0.95)

    // Wait for extra content to load (4 screens of content; we stay at
    // bottom-of-original = ~50% of new total).
    for (let i = 0; i < 30; i++) {
      if (loadedEl.textContent === 'loaded') break
      await wait(50)
    }
    expect(loadedEl.textContent).toBe('loaded')
    await wait(200)

    // Progress recalculates without scrolling — we're now ~50% down.
    expect(parseFloat(progressEl.textContent ?? '1')).toBeLessThan(0.7)
  })
})
