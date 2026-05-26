import { render } from '@solidjs/testing-library'
import { createSignal, Show } from 'solid-js'
import { describe, expect, it } from 'vitest'
import { motionValue } from 'motion-dom'
import { AnimatePresence, motion } from '@/components'
import { wait } from './helpers'

function setup() {
  const count = motionValue(0)
  const [state, setState] = createSignal(0)

  return render(() => (
    <>
      <button id="switch" onClick={() => setState(state() === 0 ? 1 : 0)}>
        Switch
      </button>
      <div>
        Animation count: <motion.span id="count">{count.get()}</motion.span>
      </div>
      <AnimatePresence initial={false}>
        <Show when={String(state())} keyed>
          {(s) => (
            <motion.div
              id={s}
              class="item"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onAnimationStart={() => {
                count.set(count.get() + 1)
                const el = document.getElementById('count')
                if (el) el.textContent = String(count.get())
              }}
            >
              {s}
            </motion.div>
          )}
        </Show>
      </AnimatePresence>
    </>
  ))
}

describe('AnimatePresence with WAAPI animations', () => {
  it('Correct number of animations trigger', async () => {
    const { unmount } = setup()
    await wait(100)
    ;(document.getElementById('switch') as HTMLButtonElement).click()
    await wait(400)
    const countEl = document.getElementById('count') as HTMLElement
    expect(countEl.textContent).toMatch(/^[234]$/)
    unmount()
  })
})
