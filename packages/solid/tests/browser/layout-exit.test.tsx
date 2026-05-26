import { cleanup, render } from '@solidjs/testing-library'
import { createEffect, createSignal, Show } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { AnimatePresence, motion } from '@/components'
import { wait } from './helpers'

afterEach(() => cleanup())

// Port of motion-upstream/packages/framer-motion/cypress/integration/layout-exit.ts
// Fixture: motion-upstream/dev/react/src/tests/layout-exit.tsx
//
// React fixture uses `useEffect(() => setVisible(!visible), [])` to flip
// `visible` from true to false on mount. AnimatePresence then plays the
// exit animation (duration 0.1s) and the layout box should unmount.
// After 500ms wait, `#box` must not exist.

describe('Layout exit animations', () => {
  it('Allows the animation to be marked complete', async () => {
    const [visible, setVisible] = createSignal(true)

    // Mirror React `useEffect(() => setVisible(!visible), [])` — flip
    // once on mount.
    const App = () => {
      createEffect(() => {
        // Defer to a microtask so the initial render lands first,
        // matching React's post-commit useEffect timing.
        queueMicrotask(() => setVisible(false))
      })
      return (
        <AnimatePresence>
          <Show when={visible()}>
            <motion.div
              id="box"
              layout
              style={{ width: '100px', height: '100px', background: 'blue' }}
              transition={{ duration: 0.1 }}
              exit={{ x: 0, opacity: 0.5 }}
            />
          </Show>
        </AnimatePresence>
      )
    }

    render(() => <App />)

    await wait(500)
    const box = document.getElementById('box')
    expect(box).toBeNull()
  })
})
