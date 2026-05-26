import { cleanup, render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { createScroll } from '@/primitives/create-scroll'
import { createMotionValueEvent } from '@/primitives/values'
import { wait } from './helpers'

afterEach(() => {
  window.scrollTo(0, 0)
  cleanup()
})

// Port of motion-upstream/packages/framer-motion/cypress/integration/scroll.ts
// — the "SVG" sub-test. Upstream uses `cy.viewport(100, 400)` to make the
// math line up exactly; we can't change viewport mid-test, so we test the
// invariants in viewport-relative terms: progress starts at 0, increases
// monotonically as we scroll past, and reaches 1 once the element has
// fully exited.
describe('scroll-svg', () => {
  it('tracks SVG elements (and inner SVG rects) as scroll targets', async () => {
    let rect!: SVGRectElement
    let svg!: SVGSVGElement

    const Setup = () => {
      const rectValues = createScroll({
        target: () => rect,
        offset: ['start end', 'end start'],
      })
      const svgValues = createScroll({
        target: () => svg,
        offset: ['start end', 'end start'],
      })

      const [rectProgress, setRectProgress] = createSignal(rectValues.scrollYProgress.get())
      const [svgProgress, setSvgProgress] = createSignal(svgValues.scrollYProgress.get())
      createMotionValueEvent(rectValues.scrollYProgress, 'change', (v) => setRectProgress(v))
      createMotionValueEvent(svgValues.scrollYProgress, 'change', (v) => setSvgProgress(v))

      return (
        <>
          {/* Large top padding so target starts well below viewport */}
          <div style={{ 'padding-top': '800px', 'padding-bottom': '800px' }}>
            <svg ref={(el) => (svg = el)} viewBox="0 0 200 200" width="200" height="200">
              <rect ref={(el) => (rect = el)} width="100" height="100" x="50" y="50" fill="red" />
            </svg>
          </div>
          <div
            style={{ position: 'fixed', top: '10px', left: '10px', color: 'white' }}
            id="rect-progress"
          >
            {rectProgress()}
          </div>
          <div
            style={{ position: 'fixed', top: '50px', left: '10px', color: 'white' }}
            id="svg-progress"
          >
            {svgProgress()}
          </div>
        </>
      )
    }

    render(() => <Setup />)
    await wait(150)

    const rectEl = document.getElementById('rect-progress') as HTMLElement
    const svgEl = document.getElementById('svg-progress') as HTMLElement
    const parse = (el: HTMLElement) => parseFloat(el.innerText)

    // Initially the target is below the viewport — progress is 0.
    expect(parse(rectEl)).toBe(0)
    expect(parse(svgEl)).toBe(0)

    // Scroll until the SVG just barely peeks into the viewport. With a
    // viewport of 660 and SVG at top 800, scrolling 200 reveals the top
    // 60px of the SVG — the outer SVG has entered but the inner rect (at
    // y=50 within the SVG) is still below. Progress for SVG should be >0
    // and progress for rect should still be 0.
    window.scrollTo(0, 200)
    await wait(150)
    expect(parse(svgEl)).toBeGreaterThan(0)
    // Rect inner offset is 50 — by 200 scroll the rect has entered too,
    // because outer SVG is at 800 and rect renders at ~850. Viewport
    // bottom = scrollY + 660 = 860. So rect just barely enters. Allow it
    // to be 0 or >0 here, but test that scrolling further moves both.

    window.scrollTo(0, 500)
    await wait(150)
    expect(parse(rectEl)).toBeGreaterThan(0)
    expect(parse(svgEl)).toBeGreaterThan(0)

    // Scroll past the bottom — both should reach 1.
    window.scrollTo(0, document.documentElement.scrollHeight)
    await wait(200)
    expect(parse(rectEl)).toBeCloseTo(1, 1)
    expect(parse(svgEl)).toBeCloseTo(1, 1)
  })
})
