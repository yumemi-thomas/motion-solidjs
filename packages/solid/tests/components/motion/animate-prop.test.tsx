import { cleanup, render } from '@solidjs/testing-library'
import { motionValue } from 'motion-dom'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Motion } from '@/components'
import { delay } from '#tests/utils'

afterEach(() => {
  cleanup()
})

const instantTransition = { type: false } as any

describe('animate prop as object', () => {
  it('renders the element provided by the as prop', async () => {
    const x = motionValue(0)
    const wrapper = render(() => (
      <Motion
        as="button"
        animate={{ x: 20 }}
        transition={instantTransition}
        style={{ x }}
        data-testid="button"
      >
        Press
      </Motion>
    ))

    const button = wrapper.getByTestId('button')
    expect(button.tagName).toBe('BUTTON')

    await delay(100)
    expect(x.get()).toBe(20)
  })

  it('animates to set prop', async () => {
    const promise = new Promise((resolve) => {
      const x = motionValue(0)
      const onComplete = () => resolve(x.get())

      render(() => <Motion animate={{ x: 20 }} style={{ x }} onAnimationComplete={onComplete} />)
    })

    await expect(promise).resolves.toBe(20)
  })

  it('accepts custom transition prop', async () => {
    const promise = new Promise((resolve) => {
      const x = motionValue(0)
      const onUpdate = () => resolve(x.get())

      render(() => (
        <Motion
          animate={{ x: 20 }}
          transition={{
            x: { type: 'tween', from: 10, ease: () => 0.5 },
          }}
          style={{ x }}
          onUpdate={onUpdate}
        />
      ))
    })

    await expect(promise).resolves.toBe(15)
  })

  it('fires onAnimationStart when animation begins', async () => {
    const promise = new Promise((resolve) => {
      const onStart = vi.fn()
      const onComplete = () => resolve(onStart)

      render(() => (
        <Motion
          animate={{ x: 20 }}
          transition={{ type: false }}
          onAnimationStart={onStart}
          onAnimationComplete={onComplete}
        />
      ))
    })

    await expect(promise).resolves.toHaveBeenCalledTimes(1)
  })

  it('uses transition on subsequent renders', async () => {
    const x = motionValue(0)
    const [animate, setAnimate] = createSignal({ x: 10, transition: instantTransition })

    render(() => <Motion style={{ x }} animate={animate()} />)

    setAnimate({ x: 20, transition: instantTransition })
    await Promise.resolve()
    setAnimate({ x: 30, transition: instantTransition })
    await delay(500)

    expect(x.get()).toBe(30)
  })

  it('transition accepts manual from value', async () => {
    const promise = new Promise((resolve) => {
      const output: number[] = []

      render(() => (
        <Motion
          animate={{ x: 50 }}
          transition={{ from: 0, ease: 'linear' }}
          onUpdate={(v: { x: number }) => output.push(v.x)}
          onAnimationComplete={() => resolve(output.every((v) => v <= 50))}
        />
      ))
    })

    await expect(promise).resolves.toBe(true)
  })

  it('animate display none => block immediately switches to block', async () => {
    const result = new Promise<[boolean, string]>((resolve) => {
      const display = motionValue('block')
      let hasChecked = false

      render(() => (
        <Motion
          initial={{ display: 'none', opacity: 0 }}
          animate={{ display: 'block', opacity: 1 }}
          style={{ display }}
          transition={{ duration: 0.1 }}
          onUpdate={(latest: { display?: string }) => {
            if (!hasChecked) {
              expect(latest.display).toBe('block')
              hasChecked = true
            }
          }}
          onAnimationComplete={() => resolve([hasChecked, display.get()])}
        />
      ))
    })

    await expect(result).resolves.toEqual([true, 'block'])
  })

  it('animate display block => none switches to none on animation end', async () => {
    const result = new Promise<[boolean, string]>((resolve) => {
      const display = motionValue('block')
      let hasChecked = false

      render(() => (
        <Motion
          initial={{ display: 'block', opacity: 1 }}
          animate={{ display: 'none', opacity: 0 }}
          style={{ display }}
          transition={{ duration: 0.1 }}
          onUpdate={(latest: { display?: string }) => {
            if (!hasChecked) {
              expect(latest.display).toBe('block')
              hasChecked = true
            }
          }}
          onAnimationComplete={() => resolve([hasChecked, display.get()])}
        />
      ))
    })

    await expect(result).resolves.toEqual([true, 'none'])
  })

  it('does not animate no-op values', async () => {
    let isAnimating = false

    render(() => (
      <Motion
        initial={{ opacity: 1, x: 0 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          opacity: { duration: 2, type: 'tween', velocity: 100 },
          x: { type: 'spring', velocity: 0 },
        }}
        onAnimationStart={() => {
          isAnimating = true
        }}
        onAnimationComplete={() => {
          isAnimating = false
        }}
      />
    ))

    await delay(50)

    expect(isAnimating).toBe(false)
  })

  it('does animate different keyframes', async () => {
    let isAnimating = false

    render(() => (
      <Motion
        initial={{ opacity: 1, x: 0 }}
        animate={{ opacity: [0, 1], x: [0, 1] }}
        transition={{
          opacity: { duration: 2, type: 'tween', velocity: 100 },
          x: { type: 'spring', velocity: 0 },
        }}
        onAnimationStart={() => {
          isAnimating = true
        }}
        onAnimationComplete={() => {
          isAnimating = false
        }}
      />
    ))

    await delay(50)

    expect(isAnimating).toBe(true)
  })

  it('uses transitionEnd on subsequent renders', async () => {
    const x = motionValue(0)
    const [animate, setAnimate] = createSignal({
      x: 10,
      transition: instantTransition,
      transitionEnd: { x: 100 },
    })

    render(() => <Motion style={{ x }} animate={animate()} />)

    setAnimate({
      x: 20,
      transition: instantTransition,
      transitionEnd: { x: 200 },
    })
    await Promise.resolve()
    setAnimate({
      x: 30,
      transition: instantTransition,
      transitionEnd: { x: 300 },
    })
    await delay(500)

    expect(x.get()).toBe(300)
  })

  it('animates through variant array', async () => {
    const promise = new Promise((resolve) => {
      const x = motionValue(0)
      const y = motionValue(0)

      render(() => (
        <Motion
          animate={['default', 'open']}
          variants={{
            default: { x: 10 },
            open: { y: 20 },
          }}
          style={{ x, y }}
          onAnimationComplete={() => {
            resolve({ x: x.get(), y: y.get() })
          }}
        />
      ))
    })

    const result = (await promise) as { x: number; y: number }
    expect(result.x).toBe(10)
    expect(result.y).toBe(20)
  })

  it('child Motion initial prop should not be affected by parent Motion initial=false', async () => {
    const childX = motionValue(0)

    render(() => (
      <Motion initial={false} animate={{ x: 100 }}>
        <Motion animate={{ x: 50 }} style={{ x: childX }} />
      </Motion>
    ))

    expect(childX.get()).toBeLessThan(50)
  })

  it('parent variants control should effect child animate state', async () => {
    const childX = motionValue(0)

    render(() => (
      <Motion initial={false} animate="animate">
        <Motion
          variants={{
            animate: { x: 100 },
          }}
          style={{ x: childX }}
        />
      </Motion>
    ))

    await delay(100)

    expect(childX.get()).toBe(100)
  })
})
