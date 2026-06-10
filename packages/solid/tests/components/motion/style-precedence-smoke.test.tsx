import { cleanup, render } from '@solidjs/testing-library'
import { frame, motionValue } from 'motion-dom'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import type { MotionStyleProps } from '@/types'

afterEach(() => cleanup())

const nextFrame = () =>
  new Promise<void>((resolve) => {
    frame.postRender(() => resolve())
  })

// Smoke tests pinning the style-vs-initial-vs-animate precedence semantics
// after the spread-ordering rewrite (raw style statics first, motion-owned
// latest values win by spread order — framer-motion's copyRawValuesOnly
// model). Each case documents who owns the first paint and what tracks
// updates, so a future change to the attrs pipeline fails loudly here
// rather than in an app.
describe('style precedence (smoke)', () => {
  it('renders a plain style value for a key motion does not own', () => {
    const wrapper = render(() => <motion.div data-testid="box" style={{ opacity: 0.3 }} />)
    expect(wrapper.getByTestId('box').style.opacity).toBe('0.3')
  })

  it('initial wins over a plain style value for the same key', () => {
    const wrapper = render(() => (
      <motion.div data-testid="box" initial={{ opacity: 0.5 }} style={{ opacity: 0.9 }} />
    ))
    expect(wrapper.getByTestId('box').style.opacity).toBe('0.5')
  })

  it('initial as a variant label wins over a plain style value', () => {
    const wrapper = render(() => (
      <motion.div
        data-testid="box"
        initial="hidden"
        variants={{ hidden: { opacity: 0.25 } }}
        style={{ opacity: 0.9 }}
      />
    ))
    expect(wrapper.getByTestId('box').style.opacity).toBe('0.25')
  })

  it('initial={false} renders the animate target over a plain style value', () => {
    const wrapper = render(() => (
      <motion.div
        data-testid="box"
        initial={false}
        animate={{ opacity: 1 }}
        style={{ opacity: 0.2 }}
      />
    ))
    expect(wrapper.getByTestId('box').style.opacity).toBe('1')
  })

  it('style is the animation origin when only animate owns the key', async () => {
    const wrapper = render(() => (
      <motion.div
        data-testid="box"
        animate={{ opacity: 1 }}
        transition={{ type: false }}
        style={{ opacity: 0.2 }}
      />
    ))
    const el = wrapper.getByTestId('box')
    // First paint shows the style value (the origin motion-dom animates from).
    expect(el.style.opacity).toBe('0.2')
    await nextFrame()
    await nextFrame()
    expect(el.style.opacity).toBe('1')
  })

  it('a style MotionValue owned by initial paints the initial value first', () => {
    const opacity = motionValue(0.8)
    const wrapper = render(() => (
      <motion.div data-testid="box" initial={{ opacity: 0.1 }} style={{ opacity }} />
    ))
    expect(wrapper.getByTestId('box').style.opacity).toBe('0.1')
  })

  it('a style MotionValue not owned by motion paints and live-updates via the VE', async () => {
    const opacity = motionValue(0.4)
    const wrapper = render(() => <motion.div data-testid="box" style={{ opacity }} />)
    const el = wrapper.getByTestId('box')
    expect(el.style.opacity).toBe('0.4')
    // Registration happens through the VisualElement's own props scrape —
    // a set() must reach the DOM through its render loop.
    opacity.set(0.6)
    await nextFrame()
    expect(el.style.opacity).toBe('0.6')
  })

  it('swapping in a new MotionValue instance re-registers and tracks the new one', async () => {
    const first = motionValue(0.4)
    const second = motionValue(0.7)
    const [mv, setMv] = createSignal(first)
    const style = (): MotionStyleProps => ({ opacity: mv() })
    const wrapper = render(() => <motion.div data-testid="box" style={style()} />)
    const el = wrapper.getByTestId('box')
    expect(el.style.opacity).toBe('0.4')

    setMv(second)
    await nextFrame()
    expect(el.style.opacity).toBe('0.7')

    // The old MV must be unsubscribed, the new one live.
    first.set(0.1)
    second.set(0.9)
    await nextFrame()
    expect(el.style.opacity).toBe('0.9')
  })

  it('plain style updates for unowned keys keep rendering after mount', async () => {
    const [width, setWidth] = createSignal('10px')
    const style = (): MotionStyleProps => ({ width: width() })
    const wrapper = render(() => <motion.div data-testid="box" style={style()} />)
    const el = wrapper.getByTestId('box')
    expect(el.style.width).toBe('10px')
    setWidth('20px')
    await Promise.resolve()
    expect(el.style.width).toBe('20px')
  })
})

// Forced motion values: keys that layout/drag must own (transforms always;
// opacity and scale-corrected keys under layout/layoutId). These render from
// latestValues — seeded by the creation snapshot, tracked by the VE's update
// scrape — instead of the raw style passthrough.
describe('forced statics under layout (smoke)', () => {
  it('a static style transform renders when layout is enabled', () => {
    const wrapper = render(() => <motion.div data-testid="box" layout style={{ x: 5 }} />)
    expect(wrapper.getByTestId('box').style.transform).toBe('translateX(5px)')
  })

  it('a static style opacity renders when layout is enabled', () => {
    const wrapper = render(() => <motion.div data-testid="box" layout style={{ opacity: 0.3 }} />)
    expect(wrapper.getByTestId('box').style.opacity).toBe('0.3')
  })

  it('a forced static change after mount keeps rendering', async () => {
    const [opacity, setOpacity] = createSignal(0.3)
    const style = (): MotionStyleProps => ({ opacity: opacity() })
    const wrapper = render(() => <motion.div data-testid="box" layout style={style()} />)
    const el = wrapper.getByTestId('box')
    expect(el.style.opacity).toBe('0.3')
    setOpacity(0.8)
    await nextFrame()
    expect(el.style.opacity).toBe('0.8')
  })
})
