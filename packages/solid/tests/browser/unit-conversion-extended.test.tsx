import { cleanup, render } from '@solidjs/testing-library'
import { animate } from 'motion'
import { onCleanup, onMount } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { wait } from './helpers'

afterEach(() => cleanup())

function getHTMLElement(id: string): HTMLElement {
  const element = document.getElementById(id)
  if (!(element instanceof HTMLElement)) throw new Error(`Expected HTMLElement #${id}`)
  return element
}

// Additional ports from motion-upstream/dev/react/src/tests/
// unit-conversion-rotate.tsx, unit-conversion-to-zero.tsx, and
// unit-conversion-vh.tsx.
describe('Unit conversion extended parity', () => {
  it('keeps rotate animation from corrupting a following percent width conversion', async () => {
    let ref!: HTMLDivElement

    render(() => {
      onMount(() => {
        const first = animate(
          ref,
          { width: [0, 100], rotate: [0, 45] },
          { duration: 0.1, ease: 'linear' },
        )
        first.then(() => {
          animate(ref, { width: '50%' }, { duration: 0.2, ease: 'linear' })
        })
        onCleanup(() => first.cancel())
      })

      return (
        <div
          id="box"
          ref={(el) => (ref = el)}
          style={{ width: '100px', height: '100px', background: '#ffaa00' }}
        >
          Success
        </div>
      )
    })

    await wait(500)
    expect(document.getElementById('box')?.textContent).toBe('Success')
  })

  it('animates y from percent to zero', async () => {
    render(() => (
      <motion.div
        id="box"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ duration: 10, ease: () => 0 }}
        style={{ width: '100px', height: '100px', background: '#ffaa00' }}
      />
    ))

    await wait(100)
    expect(getHTMLElement('box').style.transform).toBe('translateY(100%)')
  })

  it('animates height from px to vh', async () => {
    render(() => (
      <motion.div
        id="box"
        animate={{ height: '50vh', width: 100 }}
        transition={{ duration: 5, ease: () => 0.5 }}
        style={{ width: '50vw', height: '100px', background: '#ffaa00' }}
      />
    ))

    await wait(100)
    const box = getHTMLElement('box')
    const height = box.getBoundingClientRect().height
    expect(height).toBeGreaterThan(100)
    expect(height).toBeLessThan(window.innerHeight * 0.5)
  })
})
