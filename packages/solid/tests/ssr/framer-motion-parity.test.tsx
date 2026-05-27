import { motionValue } from 'motion-dom'
import { renderToString } from 'solid-js/web'
import { describe, expect, it } from 'vitest'
import { AnimatePresence, Reorder, motion } from '@/components'

// Ported from framer-motion's packages/framer-motion/src/motion/__tests__/ssr.test.tsx
// — the cases NOT already covered by render.test.tsx (which has the smoke,
// tabindex, initial-variant-style, style-MotionValue-alone and initial={false}
// cases). Assertions preserve framer-motion's expected style/attribute VALUES;
// the surrounding HTML is matched with `toContain`/regex rather than byte-exact
// `.toBe` because Solid's renderToString adds a `data-hk` hydration key and may
// preserve camelCase style keys — neither of which changes the motion behavior
// under test. `it.fails` marks behaviors framer-motion has that this library
// does not yet match (verified against framer source + a live render).

describe('SSR parity (framer-motion) — transform composition', () => {
  // framer: '<div style="transform:translateX(100px) translateY(200px)"></div>'
  it('composes an initial variant value with a style MotionValue into one transform', () => {
    const y = motionValue(200)
    const html = renderToString(() => (
      <AnimatePresence>
        <motion.div initial={{ x: 100 }} animate={{ x: 50 }} style={{ y }} exit={{ x: 0 }} />
      </AnimatePresence>
    ))
    expect(html).toContain('translateX(100px)')
    expect(html).toContain('translateY(200px)')
  })

  // framer: initial wins over a same-key style value → translateX(100px)
  it('initial overrides a static style value on the same key', () => {
    const html = renderToString(() => <motion.div initial={{ x: 100 }} style={{ x: 200 }} />)
    expect(html).toContain('translateX(100px)')
    expect(html).not.toContain('translateX(200px)')
  })

  // framer: '<element-test style="transform:translateX(100px) translateY(200px)"></element-test>'
  // motion.create over a non-intrinsic string tag now types its props (the
  // string overload falls back to motion-aware HTML attributes) instead of
  // collapsing to `never`, so this case no longer needs a cast.
  it('renders a custom HTML tag created via motion.create', () => {
    const y = motionValue(200)
    const CustomComponent = motion.create('element-test')
    const html = renderToString(() => (
      <AnimatePresence>
        <CustomComponent initial={{ x: 100 }} animate={{ x: 50 }} style={{ y }} exit={{ x: 0 }} />
      </AnimatePresence>
    ))
    expect(html).toContain('<element-test')
    expect(html).toContain('translateX(100px)')
    expect(html).toContain('translateY(200px)')
  })

  // framer: '<div>5</div>' — a MotionValue passed as a child renders its value
  it('renders a MotionValue child as its current value', () => {
    const html = renderToString(() => <motion.div>{motionValue(5)}</motion.div>)
    expect(html).toMatch(/>\s*5\s*</)
  })
})

describe('SSR parity (framer-motion) — SVG transform scaffolding', () => {
  // framer emits transform-origin + transform-box for transformed SVG elements
  it('emits transform-origin and transform-box for a transformed SVG element', () => {
    const html = renderToString(() => (
      <motion.circle cx={100} initial={{ strokeWidth: 10 }} style={{ x: 100 }} />
    ))
    expect(html).toContain('transform:translateX(100px)')
    expect(html).toContain('transform-origin:50% 50%')
    expect(html).toContain('transform-box:fill-box')
  })
})

describe('SSR parity (framer-motion) — known gaps vs motion/react', () => {
  // framer resolves the keyframe target (last value) when the initial animation
  // is blocked (initial={false}) → translateX(100px). (Fixed: resolveInitialValues
  // now collapses keyframe arrays.)
  it('initial={false} + keyframe animate emits the resolved keyframe', () => {
    const html = renderToString(() => (
      <motion.div initial={false} animate={{ x: [0, 100] }} style={{ x: 200 }} />
    ))
    expect(html).toContain('translateX(100px)')
  })

  // framer serializes user CSS (e.g. `background`) into inline style for SVG.
  // (Fixed: SVG branch keeps raw CSS in style instead of attributizing it.)
  it('SVG: user CSS background is serialized into inline style, not an attribute', () => {
    const cx = motionValue(100)
    const pathLength = motionValue(0.5)
    const html = renderToString(() => (
      <motion.circle
        cx={cx}
        initial={{ strokeWidth: 10 }}
        style={{ background: '#fff', pathLength, x: 100 }}
      />
    ))
    expect(html).toMatch(/style="[^"]*background:#fff/)
  })

  // framer marks reorder items draggable="false" on SSR so the native HTML5
  // drag image doesn't fight the pointer-driven reorder. (Fixed in item.tsx.)
  it('Reorder.Item emits draggable="false" on SSR', () => {
    const html = renderToString(() => (
      <Reorder.Group onReorder={() => {}} values={[0]}>
        <Reorder.Item value="a" />
      </Reorder.Group>
    ))
    expect(html).toContain('draggable="false"')
  })
})
