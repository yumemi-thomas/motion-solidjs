import { cleanup, render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { wait } from './helpers'

afterEach(() => cleanup())

// Port of motion-upstream/packages/framer-motion/cypress/integration/
// unit-conversion.ts — "Animate x from 0 to calc" sub-test (#3410).
describe('Unit conversion', () => {
  it('animates x from 0 to calc()', async () => {
    const values: Array<number | string> = [0, 'calc(3 * var(--width))']
    const [idx, setIdx] = createSignal(0)

    render(() => (
      <motion.div
        initial={false}
        animate={{ x: values[idx()] }}
        transition={{ duration: 5, ease: () => 0.5 }}
        style={{
          width: '100px',
          height: '100px',
          background: '#ffaa00',
          '--width': '100px',
        }}
        onClick={() => setIdx((i) => (i + 1) % values.length)}
        id="box"
      />
    ))

    await wait(100)
    ;(document.getElementById('box') as HTMLElement).click()
    await wait(100)
    const { left } = document.getElementById('box')!.getBoundingClientRect()
    // ease: () => 0.5 holds value at 50% of the keyframe range; calc(3 * 100) = 300, so halfway = 150.
    expect(left).toBe(150)
  })

  it('animates x roundtrip: 0 → calc → 0', async () => {
    const values: Array<number | string> = [0, 'calc(3 * var(--width))']
    const [idx, setIdx] = createSignal(0)

    const { unmount } = render(() => (
      <motion.div
        initial={false}
        animate={{ x: values[idx()] }}
        transition={{ duration: 0.1 }}
        style={{
          width: '100px',
          height: '100px',
          background: '#ffaa00',
          '--width': '100px',
        }}
        onClick={() => setIdx((i) => (i + 1) % values.length)}
        id="box"
      />
    ))

    await wait(200)
    const initialMatrix = new DOMMatrix(getComputedStyle(document.getElementById('box')!).transform)
    expect(initialMatrix.m41).toBe(0)
    expect((document.getElementById('box') as HTMLElement).style.transform).toMatch(
      /^(none|translateX\(0px\))$/,
    )

    ;(document.getElementById('box') as HTMLElement).click()
    await wait(300)
    const matrixAfter = new DOMMatrix(getComputedStyle(document.getElementById('box')!).transform)
    expect(matrixAfter.m41).toBe(300)
    expect((document.getElementById('box') as HTMLElement).style.transform).toBe(
      'translateX(calc(3 * var(--width)))',
    )

    ;(document.getElementById('box') as HTMLElement).click()
    await wait(300)
    const matrixBack = new DOMMatrix(getComputedStyle(document.getElementById('box')!).transform)
    expect(matrixBack.m41).toBe(0)

    unmount()
  })
})
