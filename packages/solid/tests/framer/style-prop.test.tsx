import { render } from '@solidjs/testing-library'
import { motionValue } from 'motion-dom'
import { createSignal } from 'solid-js'
import { describe, expect, it } from 'vitest'
import { MotionConfig, motion } from '@/components'
import type { MotionStyleProps } from '@/types'

// Ported from framer-motion's src/motion/__tests__/style-prop.test.tsx.
// React `rerender(<C prop/>)` is converted to Solid signal updates; the
// assertions keep framer's expected style VALUES, read natively from `el.style`
// (motion-solidjs and framer share motion-dom's style builder, so the emitted
// transform strings are identical — a fair conformance check).

const nextMicrotask = () => Promise.resolve()

describe('framer parity — style prop', () => {
  it('removes non-set styles when the style object changes', () => {
    const [style, setStyle] = createSignal<MotionStyleProps>({ position: 'absolute' })
    const wrapper = render(() => (
      <MotionConfig isStatic>
        <motion.div data-testid="child" style={style()} />
      </MotionConfig>
    ))
    expect(wrapper.getByTestId('child').style.position).toBe('absolute')
    setStyle({})
    expect(wrapper.getByTestId('child').style.position).toBe('')
  })

  it('updates transforms when passed a new value', async () => {
    const [x, setX] = createSignal(0)
    const wrapper = render(() => <motion.div data-testid="m" style={{ x: x() }} />)
    const el = wrapper.getByTestId('m')
    expect(el.style.transform).toBe('none')
    setX(1)
    await nextMicrotask()
    expect(el.style.transform).toBe('translateX(1px)')
    setX(0)
    await nextMicrotask()
    expect(el.style.transform).toBe('none')
  })

  it('does not let style override transforms handled by animation props', () => {
    const [x, setX] = createSignal(0)
    const wrapper = render(() => (
      <motion.div data-testid="m" initial={{ x: 1 }} animate={{ x: 200 }} style={{ x: x() }} />
    ))
    const el = wrapper.getByTestId('m')
    expect(el.style.transform).toBe('translateX(1px)')
    setX(2)
    expect(el.style.transform).not.toBe('translateX(2px)')
  })

  it('updates when passed a new MotionValue', async () => {
    const x = motionValue(1)
    const y = motionValue(2)
    const z = motionValue(3)
    const [useX, setUseX] = createSignal(false)
    const wrapper = render(() => (
      <motion.div
        data-testid="m"
        style={{
          x: useX() ? x : 0,
          y: !useX() ? y : 0,
          z: !useX() ? z : 0,
        }}
      />
    ))
    const el = wrapper.getByTestId('m')
    expect(el.style.transform).toBe('translateY(2px) translateZ(3px)')
    setUseX(true)
    await nextMicrotask()
    expect(el.style.transform).toBe('translateX(1px)')
    setUseX(false)
    await nextMicrotask()
    expect(el.style.transform).toBe('translateY(2px) translateZ(3px)')
  })

  it('updates when swapping between a motion value and a static value', async () => {
    const backgroundColor = motionValue('#fff')
    const [useMV, setUseMV] = createSignal(true)
    const wrapper = render(() => (
      <motion.div data-testid="m" style={{ backgroundColor: useMV() ? backgroundColor : '#000' }} />
    ))
    const el = wrapper.getByTestId('m')
    expect(el.style.backgroundColor).toBe('rgb(255, 255, 255)')
    setUseMV(false)
    await nextMicrotask()
    expect(el.style.backgroundColor).toBe('rgb(0, 0, 0)')
    setUseMV(true)
    await nextMicrotask()
    expect(el.style.backgroundColor).toBe('rgb(255, 255, 255)')
  })
})
