import { cleanup, render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { wait } from './helpers'

afterEach(() => cleanup())

// Port of motion-upstream/packages/framer-motion/cypress/integration/
// svg-transform-animation.ts — #3081: SVG transform animations should work
// when no other SVG attributes are animated.
describe('SVG transform animation (#3081)', () => {
  it('applies transform animation without other SVG attributes animated', async () => {
    const [animate, setAnimate] = createSignal(false)

    render(() => (
      <>
        <motion.svg
          id="svg-root"
          width={200}
          height={200}
          initial={animate() ? undefined : { rotate: 10 }}
          animate={animate() ? { rotate: 0 } : undefined}
          transition={{ duration: 0.1, ease: 'linear' }}
        >
          <motion.g
            id="svg-g"
            transition={{ duration: 0.1, ease: 'linear' }}
            initial={
              animate()
                ? undefined
                : {
                    transform: 'matrix(1,0,0,1, 50, 50)',
                    stroke: '#ff0000',
                  }
            }
            animate={
              animate()
                ? {
                    transform: 'matrix(1, 0, 0, 1, 0, 0)',
                    stroke: '#00ffff',
                  }
                : undefined
            }
          >
            <motion.rect
              id="svg-rect"
              x={0}
              y={0}
              width={30}
              height={30}
              stroke-width="5px"
              initial={
                animate()
                  ? undefined
                  : {
                      transform: 'matrix(2,0,0,2, 0, 0)',
                      fill: '#ffff00',
                    }
              }
              animate={
                animate()
                  ? {
                      transform: 'matrix(1, 0, 0, 1, 0, 0)',
                      fill: '#ff00ff',
                    }
                  : undefined
              }
              transition={{ duration: 0.1, ease: 'linear' }}
            />
          </motion.g>
        </motion.svg>
        <button id="animate" onClick={() => setAnimate(true)}>
          Animate
        </button>
      </>
    ))

    await wait(50)
    const rect = document.getElementById('svg-rect') as unknown as SVGRectElement
    expect(rect.style.transform).toContain('matrix')

    ;(document.getElementById('animate') as HTMLButtonElement).click()
    await wait(300)

    const rectAfter = document.getElementById('svg-rect') as unknown as SVGRectElement
    const transform = rectAfter.style.transform
    expect(transform).not.toBe('')
    expect(transform).not.toBe('none')
    expect(transform).toContain('matrix')
    const match = transform.match(/matrix\(([^)]+)\)/)
    expect(match).not.toBeNull()
    const values = match![1].split(',').map(Number)
    expect(values[0]).toBeCloseTo(1, 0.1)
    expect(values[3]).toBeCloseTo(1, 0.1)

    const g = document.getElementById('svg-g') as unknown as SVGGElement
    expect(g.style.transform).not.toBe('')
    expect(g.style.transform).not.toBe('none')
    expect(g.style.transform).toContain('matrix')

    const root = document.getElementById('svg-root') as unknown as SVGSVGElement
    expect(root.style.transform).not.toBe('')
  })
})
