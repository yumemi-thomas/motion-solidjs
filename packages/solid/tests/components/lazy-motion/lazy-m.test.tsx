import { render, waitFor } from '@solidjs/testing-library'
import { motionValue } from 'motion-dom'
import { describe, expect, it } from 'vitest'
import { domAnimation, domMax } from '@/features'
import { LazyMotion } from '@/components/lazy-motion/lazy-motion'
import { m } from '@/components/motion'

function animationResult(children: (x: ReturnType<typeof motionValue>, done: VoidFunction) => any) {
  return new Promise<number>((resolve) => {
    const x = motionValue(0)
    const done = () => resolve(x.get())

    render(() => children(x, done))
  })
}

describe('lazy feature loading with m component', () => {
  it("doesn't animate without loaded features", async () => {
    const result = new Promise<number>((resolve) => {
      const x = motionValue(0)
      const done = () => resolve(x.get())

      render(() => (
        <m.div
          animate={{ x: 20 }}
          transition={{ duration: 0.01 }}
          style={{ x }}
          onAnimationComplete={done}
        />
      ))
      setTimeout(() => resolve(x.get()), 50)
    })

    await expect(result).resolves.not.toBe(20)
  })

  it('does animate with synchronously-loaded domAnimation', async () => {
    const result = animationResult((x, done) => (
      <LazyMotion features={domAnimation}>
        <m.div
          animate={{ x: 20 }}
          transition={{ duration: 0.01 }}
          style={{ x }}
          onAnimationComplete={done}
        />
      </LazyMotion>
    ))

    await expect(result).resolves.toBe(20)
  })

  it('does animate with synchronously-loaded domMax', async () => {
    const result = animationResult((x, done) => (
      <LazyMotion features={domMax}>
        <m.div
          animate={{ x: 20 }}
          transition={{ duration: 0.01 }}
          style={{ x }}
          onAnimationComplete={done}
        />
      </LazyMotion>
    ))

    await expect(result).resolves.toBe(20)
  })

  it('supports nested feature sets', async () => {
    const result = animationResult((x, done) => (
      <LazyMotion features={domMax}>
        <LazyMotion features={domAnimation}>
          <m.div
            animate={{ x: 20 }}
            transition={{ duration: 0.01 }}
            style={{ x }}
            onAnimationComplete={done}
          />
        </LazyMotion>
      </LazyMotion>
    ))

    await expect(result).resolves.toBe(20)
  })

  it("doesn't throw without strict mode", async () => {
    const result = animationResult((x, done) => (
      <LazyMotion features={domMax}>
        <m.div
          animate={{ x: 20 }}
          transition={{ duration: 0.01 }}
          style={{ x }}
          onAnimationComplete={done}
        />
      </LazyMotion>
    ))

    await expect(result).resolves.toBe(20)
  })

  it('animates after async loading', async () => {
    const result = animationResult((x, done) => (
      <LazyMotion
        features={() => import('@/features/dom-animation').then((mod) => mod.domAnimation)}
      >
        <m.div
          animate={{ x: 20 }}
          transition={{ duration: 0.01 }}
          style={{ x }}
          onAnimationComplete={done}
        />
      </LazyMotion>
    ))

    await expect(result).resolves.toBe(20)
  })

  it('accepts direct async feature promises', async () => {
    let hasMotionStyle = false

    render(() => (
      <LazyMotion features={Promise.resolve(domAnimation)}>
        <m.div data-testid="motion" animate={{ x: 20 }} transition={{ duration: 0.01 }} />
      </LazyMotion>
    ))

    await waitFor(() => {
      const style = document.querySelector('[data-testid="motion"]')?.getAttribute('style') ?? ''
      hasMotionStyle = style.includes('transform')
      expect(hasMotionStyle).toBe(true)
    })
  })
})
