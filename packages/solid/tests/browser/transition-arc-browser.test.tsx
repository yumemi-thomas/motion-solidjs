import { cleanup, render } from '@solidjs/testing-library'
import { arc } from 'motion-dom'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { wait } from './helpers'

afterEach(() => cleanup())

function getHTMLElement(id: string): HTMLElement {
  const element = document.getElementById(id)
  if (!(element instanceof HTMLElement)) throw new Error(`Expected HTMLElement #${id}`)
  return element
}

function parseMatrix(transform: string): number[] {
  const match = transform.match(/matrix\(([^)]+)\)/)
  if (!match) throw new Error(`Expected matrix transform, received: ${transform}`)
  return match[1].split(',').map((value) => parseFloat(value))
}

// Browser-flavoured port of motion-upstream/packages/framer-motion/cypress/
// integration/transition-arc.ts. The existing unit test covers MotionValues;
// these assertions cover DOM transforms produced by keyframe arc animations.
describe('transition.path = arc() browser output', () => {
  it('deflects y perpendicular while x interpolates', async () => {
    const [go, setGo] = createSignal(false)

    render(() => (
      <motion.div
        id="indicator"
        style={{ width: '20px', height: '20px', x: 0, y: 0 }}
        animate={{ x: go() ? 400 : 0 }}
        transition={{ path: arc({ strength: 1 }), duration: 1, ease: () => 0.5 }}
      />
    ))

    setGo(true)
    await wait(100)

    const transform = getComputedStyle(getHTMLElement('indicator')).transform
    expect(transform).toContain('matrix')
    const [, , , , tx, ty] = parseMatrix(transform)
    expect(tx).toBeCloseTo(200, 0)
    expect(Math.abs(ty)).toBeGreaterThan(100)
  })

  it('does not clobber a concurrent rotate animation', async () => {
    const [go, setGo] = createSignal(false)

    render(() => (
      <motion.div
        id="indicator"
        style={{ width: '20px', height: '20px', x: 0, y: 0, rotate: 0 }}
        animate={{ x: go() ? 400 : 0, rotate: go() ? 90 : 0 }}
        transition={{ path: arc({ strength: 1, rotate: true }), duration: 1, ease: () => 0.5 }}
      />
    ))

    setGo(true)
    await wait(100)

    const transform = getComputedStyle(getHTMLElement('indicator')).transform
    const [a, b, , , tx] = parseMatrix(transform)
    const angle = (Math.atan2(b, a) * 180) / Math.PI
    expect(tx).toBeCloseTo(200, 0)
    expect(angle).toBeCloseTo(45, 12)
  })
})
