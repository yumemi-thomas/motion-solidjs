import { cleanup, render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { wait } from './helpers'

afterEach(() => cleanup())

function getSVGElement(id: string): SVGElement {
  const element = document.getElementById(id)
  if (!(element instanceof SVGElement)) throw new Error(`Expected SVGElement #${id}`)
  return element
}

// Additional ports from motion-upstream/dev/react/src/tests/svg-origin.tsx
// and svg-css-vars.tsx.
describe('SVG extended parity', () => {
  it('applies SVG transform origin scaffolding only when needed', async () => {
    render(() => (
      <svg width="1000" height="1000" viewBox="0 0 1000 1000">
        <motion.rect
          id="none-transform"
          x={0}
          y={300}
          width={100}
          height={100}
          animate={{ x: 'none' }}
        />
        <motion.rect
          id="only-transform"
          x={150}
          y={300}
          width={100}
          height={100}
          style={{ rotate: 45 }}
        />
        <motion.rect
          id="only-transformOrigin"
          x={300}
          y={300}
          width={100}
          height={100}
          style={{ originX: 1 }}
        />
        <motion.rect
          id="transform-and-transformOrigin"
          x={450}
          y={300}
          width={100}
          height={100}
          style={{ rotate: 45, originX: 1 }}
        />
      </svg>
    ))

    await wait(100)

    expect(document.getElementById('none-transform')?.getAttribute('transform') ?? '').toBe('')
    expect(getSVGElement('only-transform').style.transform).toContain('rotate(45')
    expect(document.getElementById('only-transformOrigin')?.getAttribute('transform') ?? '').toBe(
      '',
    )
    expect(getSVGElement('transform-and-transformOrigin').style.transform).toContain('rotate(45')
  })

  it('animates SVG fill to a CSS variable value', async () => {
    const [state, setState] = createSignal(false)

    render(() => (
      <svg
        id="svg"
        width="250"
        height="250"
        viewBox="0 0 250 250"
        style={{ '--color': '#f00' }}
        onClick={() => setState(!state())}
      >
        <motion.circle
          id="circle"
          initial={false}
          cx={125}
          cy={125}
          r="100"
          animate={{ fill: state() ? 'var(--color)' : '#00f' }}
          transition={{ duration: 3, ease: () => 0.5 }}
        />
      </svg>
    ))

    await wait(100)
    document.getElementById('svg')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wait(100)

    expect(document.getElementById('circle')?.getAttribute('fill')).not.toBe('#00f')
  })
})
