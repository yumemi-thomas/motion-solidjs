import { cleanup, render } from '@solidjs/testing-library'
import { createScroll } from '@/primitives/create-scroll'
import { createTransform } from '@/primitives/create-transform'
import { createMotionValueEvent, createSpring } from '@/primitives/values'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { wait } from './helpers'

afterEach(() => {
  window.scrollTo(0, 0)
  cleanup()
})

function getHTMLElement(id: string): HTMLElement {
  const element = document.getElementById(id)
  if (!(element instanceof HTMLElement)) throw new Error(`Expected HTMLElement #${id}`)
  return element
}

// createScroll == upstream useScroll, createTransform == useTransform. Upstream sources
// from github.com/motiondivision/motion: cypress specs in
// motion-upstream/packages/framer-motion/cypress/integration/scroll.ts, fixtures in
// motion-upstream/dev/react/src/tests/.
describe('Scroll additional upstream parity', () => {
  // scroll.ts "scroll() animation" — window progress drives style. createScroll() tracks
  // window scroll; createTransform maps progress 1:1 to opacity, so at half scroll opacity
  // should read ~0.5 (mirrors the window-progress assertion).
  it('drives style from window scroll progress', async () => {
    render(() => {
      const scroll = createScroll()
      const opacity = createTransform(scroll.scrollYProgress, [0, 1], [0, 1])
      return (
        <>
          <motion.div
            id="box"
            style={{ position: 'fixed', top: 0, left: 0, width: '100px', height: '100px', opacity }}
          />
          <div style={{ height: '3000px' }} />
        </>
      )
    })

    await wait(100)
    const max = document.documentElement.scrollHeight - window.innerHeight
    expect(max).toBeGreaterThan(0)
    window.scrollTo(0, max / 2)
    await wait(200)
    const opacity = parseFloat(getComputedStyle(getHTMLElement('box')).opacity)
    expect(opacity).toBeGreaterThan(0.4)
    expect(opacity).toBeLessThan(0.6)
  })

  // scroll.ts "Correctly updates element scroll progress callback, x axis" (fixture
  // scroll-callback-element-x.tsx). Four 400px spacers in a 400px scroller → 1200px
  // scrollable; scrollLeft 600 → progress 0.5. Same geometry as scroll-callback-element.test.tsx.
  it('tracks x progress for a scroll container (element source)', async () => {
    let containerRef!: HTMLDivElement
    let progressEl!: HTMLSpanElement
    const spacer = { width: '400px', height: '200px', flex: '0 0 400px' }
    render(() => {
      const scroll = createScroll({ container: () => containerRef, axis: 'x' })
      createMotionValueEvent(scroll.scrollXProgress, 'change', (latest) => {
        progressEl.textContent = String(latest)
      })
      return (
        <div
          id="container"
          ref={(el) => (containerRef = el)}
          style={{
            width: '400px',
            height: '200px',
            overflow: 'scroll',
            display: 'flex',
            'flex-direction': 'row',
          }}
        >
          <div style={{ ...spacer, background: 'red' }} />
          <div style={{ ...spacer, background: 'green' }} />
          <div style={{ ...spacer, background: 'blue' }} />
          <div style={{ ...spacer, background: 'yellow' }} />
          <span
            id="progress"
            ref={(el) => (progressEl = el)}
            style={{ position: 'fixed', top: 0, left: 0 }}
          >
            0
          </span>
        </div>
      )
    })

    await wait(100)
    getHTMLElement('container').scrollTo(600, 0)
    await wait(200)
    const progress = parseFloat(getHTMLElement('progress').textContent ?? '0')
    expect(progress).toBeGreaterThan(0.49)
    expect(progress).toBeLessThan(0.51)
  })

  // scroll.ts "scroll() container tracking" (fixture scroll-explicit-height / scroll-container).
  // A fixed-height overflow container tracking its own scroll: 1000px content in a 200px
  // container → 800px scrollable; scrollTop 400 → progress 0.5.
  it('tracks progress for a fixed-height scroll container', async () => {
    let containerRef!: HTMLDivElement
    let progressEl!: HTMLSpanElement
    render(() => {
      const scroll = createScroll({ container: () => containerRef })
      createMotionValueEvent(scroll.scrollYProgress, 'change', (latest) => {
        progressEl.textContent = String(latest)
      })
      return (
        <div
          id="container"
          ref={(el) => (containerRef = el)}
          style={{ height: '200px', overflow: 'scroll' }}
        >
          <div style={{ height: '1000px' }} />
          <span
            id="progress"
            ref={(el) => (progressEl = el)}
            style={{ position: 'fixed', top: 0, left: 0 }}
          >
            0
          </span>
        </div>
      )
    })

    await wait(100)
    getHTMLElement('container').scrollTo(0, 400)
    await wait(200)
    const progress = parseFloat(getHTMLElement('progress').textContent ?? '0')
    expect(progress).toBeGreaterThan(0.49)
    expect(progress).toBeLessThan(0.51)
  })

  // Fixture motion-upstream/dev/react/src/tests/scroll-spring.tsx — useSpring follows
  // scrollYProgress. createSpring tracks the window scroll progress; after scrolling and
  // letting the spring settle, the followed value should move toward (and approach) progress.
  it('follows window scroll progress through a spring', async () => {
    let progressEl!: HTMLSpanElement
    render(() => {
      const scroll = createScroll()
      const smooth = createSpring(scroll.scrollYProgress, { stiffness: 1000, damping: 100 })
      createMotionValueEvent(smooth, 'change', (latest) => {
        progressEl.textContent = String(latest)
      })
      return (
        <>
          <span
            id="progress"
            ref={(el) => (progressEl = el)}
            style={{ position: 'fixed', top: 0, left: 0 }}
          >
            0
          </span>
          <div style={{ height: '3000px' }} />
        </>
      )
    })

    await wait(100)
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo(0, max / 2)
    await wait(500)
    const progress = parseFloat(getHTMLElement('progress').textContent ?? '0')
    expect(progress).toBeGreaterThan(0.3)
    expect(progress).toBeLessThan(0.7)
  })
})
