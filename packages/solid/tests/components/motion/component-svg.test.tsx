// Ported from motion/react: packages/framer-motion/src/motion/__tests__/component-svg.test.tsx
// `useMotionValue` → `motionValue`; `useTransform` → `createTransform` (called
// in the component body's reactive scope); `rerender` dropped. jest-dom
// `toHaveStyle`/`toHaveAttribute` → local helpers.
import { cleanup, render } from '@solidjs/testing-library'
import { motionValue } from 'motion-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { createTransform } from '@/primitives/create-transform'
import { nextFrame } from '../../features/gestures/drag-test-utils'

afterEach(() => cleanup())

const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase()
function styleOf(el: Element, prop: string): string {
  const raw = (el as HTMLElement).style.getPropertyValue(prop)
  if (prop === 'transform' && raw === '') return 'none'
  return raw
}
function cssNormalize(prop: string, value: string): string {
  const d = document.createElement('div')
  d.style.setProperty(prop, value)
  const out = d.style.getPropertyValue(prop)
  return out === '' ? value : out
}
function expectStyle(el: Element, decl: string) {
  const idx = decl.indexOf(':')
  const prop = decl.slice(0, idx).trim()
  const expected = decl.slice(idx + 1).trim()
  expect(norm(cssNormalize(prop, styleOf(el, prop)))).toBe(norm(cssNormalize(prop, expected)))
}
function expectNotStyle(el: Element, decl: string) {
  const idx = decl.indexOf(':')
  const prop = decl.slice(0, idx).trim()
  const expected = decl.slice(idx + 1).trim()
  expect(norm(cssNormalize(prop, styleOf(el, prop)))).not.toBe(norm(cssNormalize(prop, expected)))
}

describe('SVG', () => {
  it("doesn't add translateZ", () => {
    const wrapper = render(() => (
      <svg>
        <motion.g data-testid="g" initial={{ x: 100 }} />
        <motion.g data-testid="h" style={{ x: 100 }} />
      </svg>
    ))
    expectStyle(wrapper.getByTestId('g'), 'transform: translateX(100px)')
    expectStyle(wrapper.getByTestId('h'), 'transform: translateX(100px)')
  })

  it('accepts attrX/attrY/attrScale in types', () => {
    render(() => <motion.circle animate={{ attrX: 1, attrY: 2, attrScale: 3 }} />)
  })

  it('recognises MotionValues in attributes', async () => {
    const r = motionValue(40)
    let fill = motionValue('#000')

    function Component() {
      fill = createTransform(r, [40, 100], ['#00f', '#f00']) as typeof fill
      return (
        <svg>
          <motion.circle
            cx={125}
            cy={125}
            r={r}
            fill={fill}
            animate={{ r: 100 }}
            transition={{ type: false }}
          />
        </svg>
      )
    }
    render(() => <Component />)
    await nextFrame()

    expect(r.get()).toBe(100)
    expect(fill.get()).toBe('rgba(255, 0, 0, 1)')
  })

  it('motion svg elements should be able to set correct type of ref', () => {
    let ref!: SVGTextElement
    render(() => (
      <svg>
        <motion.text ref={(el) => (ref = el)}>Motion</motion.text>
      </svg>
    ))
  })

  it("doesn't calculate transformOrigin for <svg /> elements", async () => {
    const wrapper = render(() => <motion.svg animate={{ rotate: 100 }} />)
    await nextFrame()
    expectNotStyle(wrapper.container.firstChild as Element, 'transform-origin: 0px 0px')
  })

  it("doesn't throw if animating unencountered value", () => {
    const animation = {
      strokeDasharray: ['1px, 200px', '100px, 200px', '100px, 200px'],
      strokeDashoffset: [0, -15, -125],
      transition: { duration: 1.4, ease: 'linear' as const },
    }
    render(() => (
      <motion.svg animate={{ rotate: 100 }}>
        <motion.circle animate={animation} />
      </motion.svg>
    ))
  })

  it("doesn't read viewBox as '0 0 0 0'", async () => {
    const wrapper = render(() => (
      <motion.svg
        viewBox="0 0 100 100"
        transition={{ delay: 1 }}
        animate={{ viewBox: '100 100 200 200' }}
      />
    ))
    await nextFrame()
    expect(wrapper.container.firstChild as Element).toHaveAttribute('viewBox', '0 0 100 100')
  })

  // Deviation from upstream: upstream uses `translate(50, 50)` (SVG-attribute
  // syntax, which is invalid CSS — it only "passes" upstream because jest-dom
  // parses the raw style string without validating). The Solid port applies the
  // style via Solid's runtime → jsdom's cssstyle, which validates and drops an
  // invalid transform. We use a valid-CSS value to verify the real behavior: a
  // MotionValue `transform` prop is routed to `style.transform` (not stringified
  // to `[object Object]`), matching motion/react's scrape→buildSVGAttrs path.
  it('MotionValue can be used for transform attribute on g element', async () => {
    const transformValue = motionValue('translate(50px, 50px)')
    const wrapper = render(() => (
      <svg>
        <motion.g transform={transformValue}>
          <motion.rect width={50} height={50} />
        </motion.g>
      </svg>
    ))
    await nextFrame()
    const gElement = wrapper.container.querySelector('g')!
    expect(gElement.getAttribute('transform')).not.toBe('[object Object]')
    expectStyle(gElement, 'transform: translate(50px, 50px)')
  })

  it('animates viewBox', async () => {
    const wrapper = render(() => (
      <motion.svg
        viewBox="0 0 100 100"
        transition={{ type: false }}
        animate={{ viewBox: '100 100 200 200' }}
      />
    ))
    await nextFrame()
    expect(wrapper.container.firstChild as Element).toHaveAttribute('viewBox', '100 100 200 200')
  })
})
