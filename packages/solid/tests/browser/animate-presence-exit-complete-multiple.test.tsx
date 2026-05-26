import { cleanup, render } from '@solidjs/testing-library'
import { createEffect, createSignal, For, on, onMount, Show, untrack } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { AnimatePresence, motion } from '@/components'
import { wait } from './helpers'

/**
 * Port of motion-upstream/packages/framer-motion/cypress/integration/animate-presence-exit-complete-multiple.ts
 * Fixture: motion-upstream/dev/react/src/tests/animate-presence-exit-complete-multiple.tsx
 *
 * Regression for issue #3233 — multiple AnimatePresence instances with a
 * shared `layoutId` child cycling through them must fire each
 * `onExitComplete` exactly once per exit (no double-fires from layout
 * promotion).
 */

afterEach(() => cleanup())

const maxNum = 4

const boxStyle = {
  width: '100px',
  height: '100px',
  background: 'aqua',
  'margin-bottom': '20px',
  position: 'relative' as const,
}

const measurerStyle = {
  position: 'absolute' as const,
  top: '0',
  left: '0',
  right: '0',
  bottom: '0',
  border: '1px solid',
  'z-index': 1,
}

function Boxes(props: { startIndex: number; onDone: () => void }) {
  const [currentIndex, setCurrentIndex] = createSignal(untrack(() => props.startIndex))

  // Mirror React's "reset internal state when startIndex prop changes"
  // pattern (React uses prevStartIndex + render-phase setState; here we
  // use createEffect with `on` and `defer: false`).
  createEffect(
    on(
      () => props.startIndex,
      (startIndex) => setCurrentIndex(startIndex),
    ),
  )

  onMount(() => {
    if (props.startIndex < maxNum - 1) {
      setCurrentIndex((idx) => idx + 1)
    }
  })

  return (
    <div>
      <For each={Array.from({ length: maxNum }, (_, i) => i)}>
        {(index) => (
          <div style={boxStyle}>
            <AnimatePresence onExitComplete={() => index === maxNum - 1 && props.onDone()}>
              <Show when={currentIndex() === index}>
                <motion.div
                  layout
                  layoutId="measurer"
                  style={measurerStyle}
                  // Explicit fast tween so the test isn't gated by motion's
                  // default spring physics — the regression being tested
                  // (#3233 onExitComplete double-fire) is duration-agnostic.
                  transition={{ duration: 0.1 }}
                  onLayoutAnimationComplete={() => {
                    if (currentIndex() < maxNum - 1) {
                      setCurrentIndex((idx) => idx + 1)
                    }
                  }}
                />
              </Show>
            </AnimatePresence>
          </div>
        )}
      </For>
    </div>
  )
}

describe('AnimatePresence onExitComplete', () => {
  // Fixed in: stack-aware onExitComplete (#3233)
  it('Only fires once when layoutId child exits and re-enters', async () => {
    const [startIndex, setStartIndex] = createSignal(0)
    const [doneCount, setDoneCount] = createSignal(0)

    render(() => (
      <>
        <Boxes startIndex={startIndex()} onDone={() => setDoneCount((c) => c + 1)} />
        <span id="done-count">{doneCount()}</span>
        <button id="start-1" onClick={() => setStartIndex(1)}>
          start 1
        </button>
      </>
    ))

    // Wait for the chained layout animations to settle. With duration:0.1
    // each segment, the maxNum-1 = 3 chained transitions take ~300ms; 600ms
    // is full duration + buffer for onLayoutAnimationComplete propagation.
    await wait(600)
    expect((document.getElementById('done-count') as HTMLElement).textContent).toBe('0')

    ;(document.getElementById('start-1') as HTMLButtonElement).click()
    await wait(600)
    expect((document.getElementById('done-count') as HTMLElement).textContent).toBe('1')
  })
})
