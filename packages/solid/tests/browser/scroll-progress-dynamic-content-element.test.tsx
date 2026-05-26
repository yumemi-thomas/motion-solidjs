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
// — `scroll-progress-dynamic-content-element`. Element-scoped variant of
// scroll-progress-dynamic-content.test.tsx — `trackContentSize: true`
// should recalc progress when content is added inside an element source.
describe('scroll() dynamic content (element-scoped)', () => {
  it('recalculates element scrollYProgress when content is added', async () => {
    const height = 400
    let scroller!: HTMLDivElement
    let progressEl!: HTMLDivElement
    let loadedEl!: HTMLDivElement
    const [showExtra, setShowExtra] = createSignal(false)
    const [progress, setProgress] = createSignal(0)

    render(() => {
      onMount(() => {
        const unsub = scroll((p) => setProgress(p), {
          source: scroller,
          // `trackContentSize` is declared on `ScrollInfoOptions` but not
          // surfaced through `ScrollOptions` in motion@12.40 — at runtime
          // `scroll()` falls back to `scrollInfo()` via `attachToFunction`
          // when a source/target is provided, so the option is honored.
          // See motion-upstream attach-function.ts:19-22.
          // @ts-expect-error — see comment above.
          trackContentSize: true,
        })
        const t = setTimeout(() => setShowExtra(true), 500)
        onCleanup(() => {
          unsub()
          clearTimeout(t)
        })
      })

      const spacer = { height: `${height}px` }

      return (
        <div
          id="scroller"
          ref={(el) => (scroller = el)}
          style={{ width: '100px', height: `${height}px`, overflow: 'scroll' }}
        >
          <div style={{ ...spacer, 'background-color': 'red' }} />
          <div style={{ ...spacer, 'background-color': 'green' }} />
          <Show when={showExtra()}>
            <div id="extra-content" style={{ ...spacer, 'background-color': 'purple' }} />
            <div style={{ ...spacer, 'background-color': 'orange' }} />
          </Show>
          <div
            id="progress"
            ref={(el) => (progressEl = el)}
            style={{ position: 'fixed', top: '0', left: '0' }}
          >
            {progress().toFixed(4)}
          </div>
          <div
            id="content-loaded"
            ref={(el) => (loadedEl = el)}
            style={{ position: 'fixed', top: '20px', left: '0' }}
          >
            {showExtra() ? 'loaded' : 'loading'}
          </div>
        </div>
      )
    })

    await wait(100)
    // Scroll the element to bottom (2 screens of content → progress ~1).
    scroller.scrollTo(0, scroller.scrollHeight)
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
