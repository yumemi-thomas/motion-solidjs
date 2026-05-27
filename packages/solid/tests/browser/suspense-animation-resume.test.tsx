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
// suspense-animation-resume.ts. This uses Solid conditional remounting to
// exercise the same lifecycle edge: a motion component disappears mid-flight
// and remounts before its long animation would have completed.
describe('animation resume after remount', () => {
  it('resets animated values to initial after remount', async () => {
    const [shown, setShown] = createSignal(true)

    render(() => (
      <Show when={shown()} fallback={<div id="fallback">Suspended</div>}>
        <motion.div
          id="target"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 2 }}
          transition={{ duration: 10, ease: 'linear' }}
        />
      </Show>
    ))

    await wait(400)
    setShown(false)
    await wait(500)
    expect(document.getElementById('fallback')).not.toBeNull()
    setShown(true)
    await wait(30)

    const target = getHTMLElement('target')
    expect(parseFloat(getComputedStyle(target).opacity)).toBeLessThan(0.3)
  })
})
