import { render } from '@solidjs/testing-library'
import { createSignal, Show } from 'solid-js'
import { describe, expect, it } from 'vitest'
import { AnimatePresence, motion } from '@/components'
import { wait } from './helpers'

function Inner() {
  const [showChild, setShowChild] = createSignal(true)
  return (
    <motion.div>
      <button id="inner" onClick={() => setShowChild(!showChild())}>
        Toggle
      </button>
      <Show when={showChild()}>
        <motion.div layout>Hello</motion.div>
      </Show>
    </motion.div>
  )
}

describe('AnimatePresence (layout)', () => {
  it('ensures all elements are removed', async () => {
    const [showOuter, setShowOuter] = createSignal(true)
    const { unmount } = render(() => (
      <>
        <button id="outer" onClick={() => setShowOuter(!showOuter())}>
          Toggle outer child
        </button>
        <AnimatePresence initial={false}>
          <Show when={showOuter()}>
            <motion.div
              id="box"
              exit={{ opacity: 0 }}
              style={{ width: '200px', height: '200px', background: 'red' }}
            >
              <Inner />
            </motion.div>
          </Show>
        </AnimatePresence>
      </>
    ))

    await wait(50)
    ;(document.getElementById('inner') as HTMLButtonElement).click()
    await wait(100)
    ;(document.getElementById('outer') as HTMLButtonElement).click()
    await wait(700)
    expect(document.getElementById('box')).toBeNull()
    unmount()
  })
})
