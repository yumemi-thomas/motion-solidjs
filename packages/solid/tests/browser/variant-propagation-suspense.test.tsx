import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, Show } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { wait } from './helpers'

afterEach(() => cleanup())

function getHTMLElement(id: string): HTMLElement {
  const element = document.getElementById(id)
  if (!(element instanceof HTMLElement)) throw new Error(`Expected HTMLElement #${id}`)
  return element
}

// Port of motion-upstream/packages/framer-motion/cypress/integration/
// variant-propagation-suspense.ts. A Solid-delayed child stands in for
// React.lazy + Suspense: it mounts after the parent variant context exists.
describe('variant propagation to async children', () => {
  function setup() {
    const [showChild, setShowChild] = createSignal(false)
    setTimeout(() => setShowChild(true), 100)

    render(() => (
      <motion.div
        id="parent"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        }}
        transition={{ duration: 2, ease: 'linear' }}
      >
        <Show when={showChild()}>
          <motion.div
            id="child"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1 },
            }}
            transition={{ duration: 2, ease: 'linear' }}
          />
        </Show>
      </motion.div>
    ))
  }

  it('child animates from the inherited initial variant instead of jumping to final', async () => {
    setup()
    await wait(130)
    const child = getHTMLElement('child')
    expect(parseFloat(child.style.opacity || '1')).toBeLessThan(0.5)
  })

  it('child reaches the inherited animate variant', async () => {
    setup()
    await wait(2300)
    const child = getHTMLElement('child')
    expect(child.style.opacity).toBe('1')
  })
})
