import { cleanup, render } from '@solidjs/testing-library'
import { motionValue } from 'motion-dom'
import { afterEach, describe, expect, it } from 'vitest'
// Avoid the `@/components` barrel (motion-max would install machinery at
// import time); load the pieces individually so machinery only arrives via
// the LazyMotion bundle resolving mid-test.
import { m } from '@/components/motion'
import { LazyMotion } from '@/components/lazy-motion/lazy-motion'
import { domAnimation } from '@/features/dom-animation'
import type { FeatureBundle } from '@/features/dom-animation'

afterEach(() => cleanup())

const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

describe('LazyMotion machinery upgrade', () => {
  it('style MotionValues go from static to live once the async bundle resolves', async () => {
    let resolveBundle: (bundle: FeatureBundle) => void = () => {}
    const deferred = new Promise<FeatureBundle>((resolve) => {
      resolveBundle = resolve
    })

    const x = motionValue(5)
    const wrapper = render(() => (
      <LazyMotion features={() => deferred}>
        <m.div data-testid="box" style={{ x }} />
      </LazyMotion>
    ))
    const el = wrapper.getByTestId('box')

    // Pre-install: static paint of the value at render time.
    expect(el.style.transform).toBe('translateX(5px)')
    x.set(20)
    await nextFrame()
    expect(el.style.transform).toBe('translateX(5px)')

    resolveBundle(domAnimation)
    await nextFrame()

    // Post-install: the attrs rebuild catches the value up…
    expect(el.style.transform).toBe('translateX(20px)')

    // …and the subscription is live.
    x.set(40)
    await nextFrame()
    expect(el.style.transform).toBe('translateX(40px)')
  })
})
