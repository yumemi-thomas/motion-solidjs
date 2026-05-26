import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, Show } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { AnimatePresence, motion } from '@/components'
import { createInstantLayoutTransition } from '@/primitives'
import { wait } from './helpers'

// Port of motion-upstream/packages/framer-motion/cypress/integration/layout-cancelled-finishes.ts
// against motion-upstream/dev/react/src/tests/layout-cancelled-finishes.tsx.
//
// Original asserts that clicking the cancellable element — wrapped in a
// `startTransition` from `useInstantLayoutTransition` — removes it
// immediately, even though it would normally play an exit animation. The
// Solid port now exposes `createInstantLayoutTransition` (Solid equivalent
// of upstream's `useInstantLayoutTransition`), so the cancellable's removal
// is driven through that channel 1:1 with the React fixture.

afterEach(() => cleanup())

describe('Cancelled Animation', () => {
  it('Allows the animation to be marked complete', async () => {
    // Upstream wraps the visibility flip in `startTransition(() =>
    // setIsVisible(false))` so any in-flight layout animation is marked
    // complete and AnimatePresence can skip its exit. The Solid port's
    // `createInstantLayoutTransition` returns the same `startTransition`
    // function (it blocks root projection updates), so we mirror the
    // upstream fixture exactly.
    const [isVisible, setIsVisible] = createSignal(true)
    const startTransition = createInstantLayoutTransition()

    render(() => (
      <AnimatePresence>
        <Show when={isVisible()}>
          <motion.div
            onClick={() => startTransition(() => setIsVisible(false))}
            data-testid="cancellable"
            style={{ height: '100px' }}
          />
        </Show>
      </AnimatePresence>
    ))

    await wait(50)
    const cancellable = document.querySelector('[data-testid="cancellable"]') as HTMLElement
    cancellable.click()
    await wait(200)

    expect(document.querySelector('[data-testid="cancellable"]')).toBeNull()
  })
})
