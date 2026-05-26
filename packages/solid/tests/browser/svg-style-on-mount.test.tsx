import { cleanup, render } from '@solidjs/testing-library'
import { motionValue } from 'motion-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { createTransform } from '@/primitives/create-transform'
import { wait } from './helpers'

afterEach(() => cleanup())

// #2949 regression — SVG transform/transformBox/transformOrigin must apply
// on initial mount, not after a later VE render. Port of
// motion-upstream/packages/framer-motion/cypress/integration/svg-style-on-mount.ts
describe('SVG styles on mount (#2949)', () => {
  function setup() {
    return render(() => {
      const x = motionValue(50)
      const pathLength = createTransform(x, [0, 100], [0, 1])
      const opacity = createTransform(x, [0, 100], [0, 1])
      const fill = createTransform(x, [0, 100], ['#0000ff', '#ff0000'])

      return (
        <svg width="200" height="200" data-testid="svg">
          <motion.path
            id="path"
            d="M 10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80"
            fill="none"
            stroke="black"
            stroke-width="2"
            style={{ pathLength, opacity, x: 10, y: 10 }}
          />
          <motion.circle id="circle" cx="100" cy="100" r="40" fill={fill} />
          <motion.rect id="rect" x="10" y="10" width="50" height="50" style={{ rotate: 45 }} />
        </svg>
      )
    })
  }

  it('applies transform, transformBox, transformOrigin on mount', async () => {
    setup()
    await wait(0)
    const path = document.getElementById('path') as unknown as SVGPathElement
    expect(path.style.transform).toContain('translateX(10px)')
    expect(path.style.transform).toContain('translateY(10px)')
    expect(path.style.transformBox).toBe('fill-box')
    expect(path.style.transformOrigin).toBe('50% 50%')
  })

  it('applies createTransform-derived pathLength attributes on mount', async () => {
    setup()
    await wait(0)
    const path = document.getElementById('path') as unknown as SVGPathElement
    // buildSVGPath normalises pathLength → "1"; the dasharray encodes the
    // 0.5 fraction.
    expect(path.getAttribute('pathLength')).toBe('1')
    expect(path.getAttribute('stroke-dasharray')).toBe('0.5 1')
    const dashoffset = path.getAttribute('stroke-dashoffset')
    expect(parseFloat(dashoffset ?? '')).toBe(0)
  })

  it('applies createTransform-derived opacity on SVG path on mount', async () => {
    setup()
    await wait(0)
    const path = document.getElementById('path') as unknown as SVGPathElement
    const opacity = path.getAttribute('opacity') ?? window.getComputedStyle(path).opacity
    expect(parseFloat(opacity)).toBe(0.5)
  })

  it('applies createTransform-derived fill on SVG circle on mount', async () => {
    setup()
    await wait(0)
    const circle = document.getElementById('circle') as unknown as SVGCircleElement
    const fill = circle.getAttribute('fill')
    expect(fill).not.toBeNull()
    expect(fill).not.toBe('')
  })

  it('applies transformBox and transformOrigin on SVG rect with static transform', async () => {
    setup()
    await wait(0)
    const rect = document.getElementById('rect') as unknown as SVGRectElement
    expect(rect.style.transform).toBe('rotate(45deg)')
    expect(rect.style.transformBox).toBe('fill-box')
    expect(rect.style.transformOrigin).toBe('50% 50%')
  })
})
