import { render } from '@solidjs/testing-library'
import { motionValue } from 'motion-dom'
import { createSignal } from 'solid-js'
import { describe, expect, it } from 'vitest'
import { motion } from '@/components'

// Regression tests for the spread/option-update ordering hazard: the
// mergeProps-wrapped `{...motionAttrs(props)}` spread memo and the handle's
// option-update memo observe the same prop signals as siblings, and sibling
// run order permutes on every flush (Solid swap-removes observers on
// unsubscribe). If the spread memo runs first it paints attrs built from
// stale VE values. getAttrs reads the option-update memo
// (`trackOptionsUpdate`) so the swap always settles first.
//
// The permutation cycle is longer than one flush, so a single toggle can
// pass by luck — hence four consecutive changes, asserted after each.

const nextMicrotask = () => Promise.resolve()

describe('style prop update ordering', () => {
  it('applies every MV-swap across four consecutive toggles', async () => {
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

    for (let i = 0; i < 2; i++) {
      setUseX(true)
      await nextMicrotask()
      expect(el.style.transform, `toggle ${i * 2 + 1}`).toBe('translateX(1px)')
      setUseX(false)
      await nextMicrotask()
      expect(el.style.transform, `toggle ${i * 2 + 2}`).toBe('translateY(2px) translateZ(3px)')
    }
  })

  it('applies every static style change across four consecutive updates', async () => {
    const [value, setValue] = createSignal(0)
    const wrapper = render(() => <motion.div data-testid="m" style={{ x: value() }} />)
    const el = wrapper.getByTestId('m')
    expect(el.style.transform).toBe('none')

    for (const next of [1, 2, 3, 4]) {
      setValue(next)
      await nextMicrotask()
      expect(el.style.transform, `update to ${next}`).toBe(`translateX(${next}px)`)
    }
  })

  it('applies every MV/static swap across four consecutive toggles', async () => {
    const backgroundColor = motionValue('#fff')
    const [useMV, setUseMV] = createSignal(true)
    const wrapper = render(() => (
      <motion.div
        data-testid="m"
        style={{ 'background-color': useMV() ? backgroundColor : '#000' }}
      />
    ))
    const el = wrapper.getByTestId('m')
    expect(el.style.backgroundColor).toBe('rgb(255, 255, 255)')

    for (let i = 0; i < 2; i++) {
      setUseMV(false)
      await nextMicrotask()
      expect(el.style.backgroundColor, `toggle ${i * 2 + 1}`).toBe('rgb(0, 0, 0)')
      setUseMV(true)
      await nextMicrotask()
      expect(el.style.backgroundColor, `toggle ${i * 2 + 2}`).toBe('rgb(255, 255, 255)')
    }
  })
})
