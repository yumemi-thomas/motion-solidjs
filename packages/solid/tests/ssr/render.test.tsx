import { motionValue } from 'motion-dom'
import { Show } from 'solid-js'
import { renderToString } from 'solid-js/web'
import { describe, expect, it } from 'vitest'
import { AnimatePresence, motion } from '@/components'
import { useMotion } from '@/primitives/use-motion'

describe('SSR — motion.div', () => {
  it('renders to a string without throwing', () => {
    const html = renderToString(() => (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} data-testid="box">
        hi
      </motion.div>
    ))
    expect(html).toContain('hi')
    expect(html).toContain('data-testid="box"')
  })

  it('emits the initial-variant style inline so client first paint matches', () => {
    const html = renderToString(() => (
      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        slide
      </motion.p>
    ))
    expect(html).toMatch(/<p[^>]*style=/)
    expect(html).toMatch(/opacity:0/)
    // y is rendered as part of the transform string
    expect(html).toMatch(/translate(Y|3d)/)
  })

  it('renders motion values from style as their current value', () => {
    const x = motionValue(20)
    const html = renderToString(() => <motion.div style={{ x }}>mv</motion.div>)
    expect(html).toMatch(/translate/)
    expect(html).toContain('mv')
  })
})

describe('SSR — useMotion primitive', () => {
  it('renders to a string', () => {
    function Panel() {
      const m = useMotion({
        initial: { opacity: 0 },
        animate: { opacity: 1 },
      })
      return (
        <m.Provider>
          <div data-testid="panel" {...m()}>
            via hook
          </div>
        </m.Provider>
      )
    }
    const html = renderToString(() => <Panel />)
    expect(html).toContain('via hook')
    expect(html).toContain('data-testid="panel"')
    expect(html).toMatch(/opacity:0/)
  })
})

describe('SSR — AnimatePresence', () => {
  it('renders its children unchanged', () => {
    const html = renderToString(() => (
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          inside
        </motion.div>
      </AnimatePresence>
    ))
    expect(html).toContain('inside')
  })

  it('renders nothing when the Show condition is false', () => {
    const html = renderToString(() => (
      <AnimatePresence>
        <Show when={false}>
          <motion.div>hidden</motion.div>
        </Show>
      </AnimatePresence>
    ))
    expect(html).not.toContain('hidden')
  })

  it('respects initial={false} by emitting animate-state style on first paint', () => {
    const html = renderToString(() => (
      <AnimatePresence initial={false}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          first
        </motion.div>
      </AnimatePresence>
    ))
    // With initial={false}, motion-dom skips the initial keyframe; the
    // emitted style should reflect the animate target (opacity:1, no
    // opacity:0).
    expect(html).toContain('first')
    expect(html).not.toMatch(/opacity:\s*0[^.\d]/)
  })
})

describe('SSR — motion.svg', () => {
  it('renders an SVG without throwing', () => {
    const html = renderToString(() => (
      <motion.svg width={100} height={100}>
        <motion.circle cx={50} cy={50} r={20} initial={{ scale: 0 }} animate={{ scale: 1 }} />
      </motion.svg>
    ))
    expect(html).toContain('<svg')
    expect(html).toContain('<circle')
  })
})

// Port of upstream `motion/__tests__/ssr.test.tsx` tabindex assertions.
// Tap-style gestures need a focusable target so keyboard users can trigger
// them — upstream's HTML render pipeline adds `tabindex="0"` when whileTap
// (or onTap/onTapStart) is set and the user didn't provide their own
// tabIndex. happy-dom can't verify it from a live render so this is the
// canonical regression net. Regexes are case-insensitive because Solid's
// renderToString preserves the JSX attribute name's casing (`tabIndex`)
// rather than lowercasing it to the canonical HTML form — both are
// equivalent to the parser.
describe('SSR — tap-driven tabindex', () => {
  it('sets tabindex="0" when whileTap is set', () => {
    const html = renderToString(() => <motion.div whileTap={{ scale: 0.9 }} />)
    expect(html).toMatch(/tabindex="0"/i)
  })

  it('sets tabindex="0" when onTap is set', () => {
    const html = renderToString(() => <motion.div onTap={() => {}} />)
    expect(html).toMatch(/tabindex="0"/i)
  })

  it('does not override an explicit tabIndex', () => {
    const html = renderToString(() => <motion.div tabIndex={2} whileTap={{ scale: 0.9 }} />)
    expect(html).toMatch(/tabindex="2"/i)
    expect(html).not.toMatch(/tabindex="0"/i)
  })

  it('does not set tabindex when no tap handler is set', () => {
    const html = renderToString(() => <motion.div animate={{ opacity: 1 }} />)
    expect(html).not.toMatch(/tabindex=/i)
  })
})
