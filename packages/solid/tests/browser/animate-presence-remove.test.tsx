import { render } from '@solidjs/testing-library'
import { createSignal, For } from 'solid-js'
import { describe, expect, it } from 'vitest'
import { AnimatePresence, motion } from '@/components'
import { wait } from './helpers'

describe('AnimatePresence (remove)', () => {
  it('ensures all elements are removed', async () => {
    const [range, setRange] = createSignal([0, 1, 2])
    const { unmount } = render(() => (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          'flex-direction': 'column',
          padding: '100px',
        }}
      >
        <button id="remove" onClick={() => setRange(range().slice(0, -1))}>
          Remove
        </button>
        <AnimatePresence>
          <For each={range()}>
            {(i) => (
              <motion.div
                id={`box-${i}`}
                class="box"
                style={{
                  width: '100px',
                  height: '100px',
                  'background-color': 'red',
                }}
                transition={{ duration: 0.5 }}
                exit={{ opacity: 0.5 }}
              />
            )}
          </For>
        </AnimatePresence>
      </div>
    ))

    await wait(50)
    const remove = document.getElementById('remove') as HTMLButtonElement
    remove.click()
    await wait(100)
    remove.click()
    await wait(700)
    expect(document.querySelectorAll('.box').length).toBe(1)
    unmount()
  })
})
