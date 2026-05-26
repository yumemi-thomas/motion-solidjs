import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, Show } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { AnimatePresence, motion } from '@/components'
import { delay } from '#tests/utils'

afterEach(() => {
  cleanup()
})

describe('AnimatePresence', () => {
  it('replays initial animation for keyed Solid children entering after exit', async () => {
    const [active, setActive] = createSignal<'home' | 'about'>('home')

    function App() {
      return (
        <>
          <button onClick={() => setActive('about')}>About</button>
          <AnimatePresence mode="wait">
            <Show when={active()} keyed>
              {(id) => (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.05 }}
                >
                  {id === 'home' ? 'Home body' : 'About body'}
                </motion.p>
              )}
            </Show>
          </AnimatePresence>
        </>
      )
    }

    const wrapper = render(() => <App />)

    await delay(80)
    const enteredStyle = new Promise<string | null>((resolve) => {
      const observer = new MutationObserver(() => {
        const paragraph = document.querySelector('p')
        if (paragraph?.textContent === 'About body') {
          observer.disconnect()
          resolve(paragraph.getAttribute('style'))
        }
      })

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      })
    })

    wrapper.getByText('About').click()

    const style = await enteredStyle
    const translateY = Number(style?.match(/translateY\(([\d.-]+)px\)/)?.[1])

    expect(translateY).toBeGreaterThan(0)
    expect(translateY).toBeLessThanOrEqual(8)
  })
})
