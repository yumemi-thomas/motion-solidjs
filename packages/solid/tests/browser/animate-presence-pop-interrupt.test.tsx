import { render } from '@solidjs/testing-library'
import { createSignal, Show } from 'solid-js'
import { describe, expect, it } from 'vitest'
import { AnimatePresence, motion } from '@/components'
import { wait } from './helpers'

const boxStyles = {
  width: '100px',
  height: '100px',
  'background-color': 'red',
}

describe('AnimatePresence popLayout interrupt', () => {
  it('removes data-motion-pop-id when exit animation is interrupted', async () => {
    const [show, setShow] = createSignal(true)
    const { unmount } = render(() => (
      <div
        id="container"
        style={{
          position: 'relative',
          display: 'flex',
          'flex-direction': 'column',
          padding: '100px',
        }}
      >
        <button id="toggle" onClick={() => setShow(!show())}>
          Toggle
        </button>
        <AnimatePresence mode="popLayout">
          <motion.div id="a" layout style={boxStyles} />
          <Show when={show()}>
            <motion.div
              id="target"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 10 } }}
              style={{ ...boxStyles, 'background-color': 'green' }}
            />
          </Show>
          <motion.div id="c" layout style={{ ...boxStyles, 'background-color': 'blue' }} />
        </AnimatePresence>
      </div>
    ))

    await wait(50)
    expect(document.getElementById('target')!.hasAttribute('data-motion-pop-id')).toBe(false)

    ;(document.getElementById('toggle') as HTMLButtonElement).click()
    await wait(200)
    expect(document.getElementById('target')!.hasAttribute('data-motion-pop-id')).toBe(true)

    ;(document.getElementById('toggle') as HTMLButtonElement).click()
    await wait(200)
    expect(document.getElementById('target')!.hasAttribute('data-motion-pop-id')).toBe(false)
    unmount()
  })
})
