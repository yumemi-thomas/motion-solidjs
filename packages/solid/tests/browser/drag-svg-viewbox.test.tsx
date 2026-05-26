import { cleanup, render } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'
import { MotionConfig, motion } from '@/components'
import { transformViewBoxPoint } from '@/utils'
import { cyDrag, nextFrame } from '../features/gestures/drag-test-utils'
import { wait } from './helpers'

afterEach(() => {
  window.dispatchEvent(
    new PointerEvent('pointerup', {
      bubbles: true,
      isPrimary: true,
      pointerId: 1,
      pointerType: 'mouse',
    }),
  )
  cleanup()
})

// Port of motion-upstream/packages/framer-motion/cypress/integration/
// drag-svg-viewbox.ts — drag inside an SVG whose viewBox doesn't match
// rendered dimensions should rescale pointer deltas.
//
// Fixed: MotionConfig.transformPagePoint + transformViewBoxPoint helper
// are ported. Pointer coordinates are rescaled into viewBox space so the
// drag matches the viewBox unit scale.

function parseTranslate(transform: string): { x: number; y: number } {
  const xMatch = transform.match(/translateX\(([-\d.]+)px\)/)
  const yMatch = transform.match(/translateY\(([-\d.]+)px\)/)
  return {
    x: xMatch ? Number.parseFloat(xMatch[1]!) : 0,
    y: yMatch ? Number.parseFloat(yMatch[1]!) : 0,
  }
}

interface Opts {
  viewBoxX?: number
  viewBoxY?: number
  viewBoxWidth?: number
  viewBoxHeight?: number
  svgWidth?: number
  svgHeight?: number
}

function mount(opts: Opts = {}) {
  const {
    viewBoxX = 0,
    viewBoxY = 0,
    viewBoxWidth = 100,
    viewBoxHeight = 100,
    svgWidth = 500,
    svgHeight = 500,
  } = opts
  let svgRef!: SVGSVGElement
  return render(() => (
    <svg
      ref={(el) => (svgRef = el)}
      viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
      width={svgWidth}
      height={svgHeight}
      style={{ border: '1px solid black' }}
    >
      <MotionConfig transformPagePoint={transformViewBoxPoint(() => svgRef)}>
        <motion.rect
          data-testid="draggable"
          x={10}
          y={10}
          width={20}
          height={20}
          fill="red"
          drag
          dragElastic={0}
          dragMomentum={false}
        />
      </MotionConfig>
    </svg>
  ))
}

describe('Drag SVG with viewBox', () => {
  // Fixed in transformPagePoint pipeline port.
  it('Correctly scales drag distance when viewBox differs from rendered size', async () => {
    const wrapper = mount()
    await wait(50)
    const el = wrapper.getByTestId('draggable') as unknown as SVGRectElement
    expect(el.getAttribute('x')).toBe('10')
    expect(el.getAttribute('y')).toBe('10')

    const pointer = cyDrag(el, 10, 10)
    await wait(50)
    await pointer.to(20, 20)
    await wait(50)
    await pointer.to(110, 110)
    await wait(50)
    pointer.end()
    await nextFrame()
    await wait(50)

    const { x, y } = parseTranslate(el.style.transform)
    // Upstream tolerance: closeTo(20, 3) = within 3 units.
    expect(x).toBeGreaterThan(17)
    expect(x).toBeLessThan(23)
    expect(y).toBeGreaterThan(17)
    expect(y).toBeLessThan(23)
  })

  // No scaling needed when viewBox matches rendered dims — drag is a
  // pure screen-space translate, so this passes without the missing
  // `transformViewBoxPoint` compensation.
  it('Works correctly when viewBox matches rendered size (no scaling)', async () => {
    const wrapper = mount({
      viewBoxWidth: 500,
      viewBoxHeight: 500,
      svgWidth: 500,
      svgHeight: 500,
    })
    await wait(50)
    const el = wrapper.getByTestId('draggable') as unknown as SVGRectElement
    const pointer = cyDrag(el, 10, 10)
    await wait(50)
    await pointer.to(20, 20)
    await wait(50)
    await pointer.to(110, 110)
    await wait(50)
    pointer.end()
    await nextFrame()
    await wait(50)

    const { x, y } = parseTranslate(el.style.transform)
    expect(x).toBeGreaterThan(85)
    expect(x).toBeLessThan(115)
    expect(y).toBeGreaterThan(85)
    expect(y).toBeLessThan(115)
  })

  // Fixed in transformPagePoint pipeline port.
  it('Handles non-uniform scaling (different x and y scale factors)', async () => {
    const wrapper = mount({
      viewBoxWidth: 100,
      viewBoxHeight: 200,
      svgWidth: 500,
      svgHeight: 400,
    })
    await wait(50)
    const el = wrapper.getByTestId('draggable') as unknown as SVGRectElement
    const pointer = cyDrag(el, 10, 10)
    await wait(50)
    await pointer.to(20, 20)
    await wait(50)
    await pointer.to(110, 110)
    await wait(50)
    pointer.end()
    await nextFrame()
    await wait(50)

    const { x, y } = parseTranslate(el.style.transform)
    // Upstream tolerance: closeTo(20, 3) for x, closeTo(50, 8) for y.
    expect(x).toBeGreaterThan(17)
    expect(x).toBeLessThan(23)
    expect(y).toBeGreaterThan(42)
    expect(y).toBeLessThan(58)
  })

  // Fixed in transformPagePoint pipeline port.
  it('Handles viewBox with non-zero origin', async () => {
    const wrapper = mount({
      viewBoxX: 50,
      viewBoxY: 50,
      viewBoxWidth: 100,
      viewBoxHeight: 100,
      svgWidth: 500,
      svgHeight: 500,
    })
    await wait(50)
    const el = wrapper.getByTestId('draggable') as unknown as SVGRectElement
    const pointer = cyDrag(el, 10, 10)
    await wait(50)
    await pointer.to(20, 20)
    await wait(50)
    await pointer.to(110, 110)
    await wait(50)
    pointer.end()
    await nextFrame()
    await wait(50)

    const { x, y } = parseTranslate(el.style.transform)
    // Upstream tolerance: closeTo(20, 3) = within 3 units.
    expect(x).toBeGreaterThan(17)
    expect(x).toBeLessThan(23)
    expect(y).toBeGreaterThan(17)
    expect(y).toBeLessThan(23)
  })
})
