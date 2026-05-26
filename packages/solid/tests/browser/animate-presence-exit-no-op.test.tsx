import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, For, type JSX, Show } from 'solid-js'
import { Portal } from 'solid-js/web'
import { afterEach, describe, expect, it } from 'vitest'
import { stagger } from 'motion-dom'
import { AnimatePresence, motion } from '@/components'
import { wait } from './helpers'

/**
 * Port of motion-upstream/packages/framer-motion/cypress/integration/animate-presence-exit-no-op.ts
 * Fixture: motion-upstream/dev/react/src/tests/animate-presence-exit-no-op.tsx
 *
 * Reproduction for issue #3078 — when a child's `exit` variant targets
 * values that are *already* the current ones, AnimatePresence still has
 * to detect "no-op exit" and resolve removal immediately. The upstream
 * regression was `value.isAnimating` truthy-property-access instead of
 * a function call, so the skip path never triggered and the parent
 * stayed mounted forever.
 *
 * The upstream fixture uses React's createPortal; we use solid-js/web's
 * Portal which targets document.body the same way.
 */

afterEach(() => cleanup())

function Modal(props: { children: JSX.Element; onClose: () => void }) {
  return (
    <Portal>
      <div
        id="backdrop"
        onClick={() => props.onClose()}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
        }}
      />
      <motion.dialog
        id="modal"
        variants={{
          hidden: { opacity: 0, y: -30 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={{ type: 'tween', duration: 0.3 }}
        open
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {props.children}
      </motion.dialog>
    </Portal>
  )
}

function NewChallenge(props: { onDone: () => void }) {
  return (
    <Modal onClose={props.onDone}>
      <h2>New Challenge</h2>
      <motion.ul
        variants={{
          visible: {
            transition: { delayChildren: stagger(0.05) },
          },
        }}
        style={{ 'list-style': 'none', display: 'flex', gap: '10px' }}
      >
        <For each={[0, 1]}>
          {(i) => (
            <motion.li
              data-testid={`item-${i}`}
              variants={{
                hidden: { opacity: 0, scale: 0.5 },
                visible: { opacity: 1, scale: 1 },
              }}
              exit={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260 }}
              style={{ width: '50px', height: '50px', background: 'coral' }}
            />
          )}
        </For>
      </motion.ul>
      <button id="cancel" onClick={() => props.onDone()}>
        Cancel
      </button>
    </Modal>
  )
}

describe('AnimatePresence exit no-op (#3078)', () => {
  it('Removes modal when child exit targets match current values', async () => {
    const [show, setShow] = createSignal(false)
    render(() => (
      <div style={{ padding: '20px' }}>
        <button id="toggle" onClick={() => setShow(true)}>
          Add Challenge
        </button>
        <AnimatePresence mode="wait">
          <Show when={show()}>
            <NewChallenge onDone={() => setShow(false)} />
          </Show>
        </AnimatePresence>
      </div>
    ))

    await wait(200)
    ;(document.getElementById('toggle') as HTMLButtonElement).click()
    await wait(200)

    expect(document.getElementById('modal')).not.toBeNull()

    // Enter animations: modal tween is 300ms; the staggered spring items
    // (stiffness 260) finish well inside ~800ms. Generous buffer for
    // AnimatePresence's safe-to-remove plumbing.
    await wait(800)

    ;(document.getElementById('cancel') as HTMLButtonElement).click()
    // The bug under test is that the no-op exit detection fails and the
    // modal stays mounted forever. We only need to wait long enough for
    // the (instant) no-op skip + modal tween (300ms) to remove the modal.
    await wait(500)

    expect(document.getElementById('modal')).toBeNull()
  })
})
