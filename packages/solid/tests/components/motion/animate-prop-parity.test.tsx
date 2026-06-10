// Ported from motion/react: packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx
// Cases already covered by ./animate-prop.test.tsx (animates to set prop,
// accepts custom transition, onAnimationStart, transition/transitionEnd on
// subsequent renders, display none<->block, no-op values, different keyframes)
// are not duplicated. The React `Suspense` remount case is React-internal and
// is covered for Solid by tests/browser/suspense-animation-resume.test.tsx.
//
// React-isms translated to Solid: `rerender` → `createSignal`; `useRef`/
// `createRef` → a plain `let ref`; `useMotionValue` → `motionValue`;
// `useMotionValueEvent` → `mv.on(event, fn)`; jest-dom's `toHaveStyle` → the
// local `expectStyle` helper (inline style read, whitespace/colour normalised,
// empty transform treated as `none`).
import { cleanup, render } from '@solidjs/testing-library'
import { frame, motionValue } from 'motion-dom'
import { MotionGlobalConfig } from 'motion-utils'
import { createSignal, Show } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { motion } from '@/components'
import { nextFrame } from '../../features/gestures/drag-test-utils'

afterEach(() => cleanup())

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))
const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase()

function styleOf(el: Element, prop: string): string {
  const raw = (el as HTMLElement).style.getPropertyValue(prop)
  if (prop === 'transform' && raw === '') return 'none'
  return raw
}
// Normalise a CSS value the way jest-dom's toHaveStyle does: round-trip it
// through a real style declaration so colours (hsl/hex/rgba) collapse to the
// same rgb(a) form jsdom's cssstyle produces.
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

describe('animate prop as object (react parity)', () => {
  it('animates to set prop and preserves existing initial transform props', async () => {
    const element = await new Promise<Element>((resolve) => {
      const wrapper = render(() => (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ x: 20 }}
          onAnimationComplete={() =>
            setTimeout(() => resolve(wrapper.container.firstChild as Element), 20)
          }
        />
      ))
    })
    expectStyle(element, 'transform: translateX(20px) scale(0)')
  })

  it('style doesnt overwrite in subsequent renders', async () => {
    const history: number[] = []
    const [rotate, setRotate] = createSignal(1000)
    const [onComplete, setOnComplete] = createSignal<VoidFunction | undefined>(undefined)
    const result = await new Promise<boolean>((resolve) => {
      const checkOverride = () => {
        setTimeout(() => {
          let styleHasOverridden = false
          let prev = 0
          for (let i = 0; i < history.length; i++) {
            if (history[i] < prev) {
              styleHasOverridden = true
              break
            }
            prev = history[i]
          }
          resolve(styleHasOverridden)
        }, 20)
      }
      render(() => (
        <motion.div
          animate={{ rotate: `${rotate()}deg` }}
          transition={{ duration: 0.05 }}
          style={{ rotate: '0deg' }}
          onUpdate={({ rotate }: { rotate: string }) => history.push(parseFloat(rotate))}
          onAnimationComplete={onComplete()}
        />
      ))
      setTimeout(() => {
        setOnComplete(() => checkOverride)
        setRotate(1001)
      }, 120)
    })
    expect(result).toBe(false)
  })

  it('applies custom transform', async () => {
    const element = await new Promise<Element>((resolve) => {
      const wrapper = render(() => (
        <motion.div
          initial={{ x: 10 }}
          animate={{ x: 30 }}
          transition={{ duration: 0.01 }}
          transformTemplate={({ x }: { x: string }, generated: string) =>
            `translateY(${x}) ${generated}`
          }
          onAnimationComplete={() =>
            requestAnimationFrame(() => resolve(wrapper.container.firstChild as Element))
          }
        />
      ))
    })
    expectStyle(element, 'transform: translateY(30px) translateX(30px)')
  })

  it('animating between none/block fires onAnimationComplete', async () => {
    const result = await new Promise<boolean>((resolve) => {
      render(() => (
        <motion.div
          initial={{ display: 'none' }}
          animate={{ display: 'block' }}
          transition={{ duration: 0.01 }}
          onAnimationComplete={() => resolve(true)}
        />
      ))
    })
    expect(result).toBe(true)
  })

  it('animate visibility hidden => visible immediately switches to visible', async () => {
    const visibility = motionValue('visible')
    let hasChecked = false
    const result = await new Promise<[boolean, string]>((resolve) => {
      render(() => (
        <motion.div
          initial={{ visibility: 'hidden', opacity: 0 }}
          animate={{ visibility: 'visible', opacity: 1 }}
          style={{ visibility }}
          transition={{ duration: 0.1 }}
          onUpdate={(latest: { visibility?: string }) => {
            if (!hasChecked) {
              expect(latest.visibility).toBe('visible')
              hasChecked = true
            }
          }}
          onAnimationComplete={() => resolve([hasChecked, visibility.get()])}
        />
      ))
    })
    expect(result).toEqual([true, 'visible'])
  })

  it('animate visibility visible => hidden switches to hidden on animation end', async () => {
    const visibility = motionValue('hidden')
    let hasChecked = false
    const result = await new Promise<[boolean, string]>((resolve) => {
      render(() => (
        <motion.div
          initial={{ visibility: 'visible', opacity: 1 }}
          animate={{ visibility: 'hidden', opacity: 0 }}
          style={{ visibility }}
          transition={{ duration: 0.1 }}
          onUpdate={(latest: { visibility?: string }) => {
            if (!hasChecked) {
              expect(latest.visibility).toBe('visible')
              hasChecked = true
            }
          }}
          onAnimationComplete={() => resolve([hasChecked, visibility.get()])}
        />
      ))
    })
    expect(result).toEqual([true, 'hidden'])
  })

  it('keyframes - accepts ease as an array', async () => {
    const x = motionValue(0)
    const easingListener = vi.fn()
    const easing = (v: number) => {
      easingListener()
      return v
    }
    const result = await new Promise<typeof easingListener>((resolve) => {
      render(() => (
        <motion.div
          animate={{ x: [0, 1, 2] }}
          transition={{ ease: [easing, easing], duration: 0.1 }}
          style={{ x }}
          onAnimationComplete={() => resolve(easingListener)}
        />
      ))
    })
    expect(result).toHaveBeenCalled()
  })

  it('will switch from non-animatable value to animatable value', async () => {
    const element = await new Promise<Element>((resolve) => {
      const wrapper = render(() => (
        <motion.div
          animate={{ fontWeight: 100 }}
          style={{ 'font-weight': 'normal' }}
          onAnimationComplete={() => resolve(wrapper.container.firstChild as Element)}
        />
      ))
    })
    expectStyle(element, 'font-weight: 100')
  })

  it("doesn't animate no-op keyframes", async () => {
    let isAnimating = false
    render(() => (
      <motion.div
        initial={{ opacity: 1, x: 0 }}
        animate={{ opacity: [1, 1], x: [0, 0] }}
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
    await nextFrame()
    await nextFrame()
    expect(isAnimating).toBe(false)
  })

  it('does animate no-op values if velocity is non-zero and animation type is spring', async () => {
    let isAnimating = false
    const result = await new Promise<boolean>((resolve) => {
      render(() => (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1, transition: { type: 'spring', velocity: 100 } }}
          onAnimationStart={() => {
            isAnimating = true
          }}
          onAnimationComplete={() => {
            isAnimating = false
          }}
        />
      ))
      frame.postRender(() => frame.postRender(() => resolve(isAnimating)))
    })
    expect(result).toBe(true)
  })

  it("doesn't animate zIndex", async () => {
    const wrapper = render(() => <motion.div animate={{ zIndex: 100 }} />)
    await nextFrame()
    expectStyle(wrapper.container.firstChild as Element, 'z-index: 100')
  })

  it('when value is removed from animate, animates back to value originally defined in initial prop', async () => {
    let ref!: HTMLDivElement
    const [animate, setAnimate] = createSignal<Record<string, number>>({ opacity: 1 })
    render(() => (
      <motion.div
        ref={(el) => (ref = el)}
        initial={{ opacity: 0 }}
        animate={animate()}
        transition={{ type: false }}
      />
    ))
    await nextFrame()
    expectStyle(ref, 'opacity: 1')

    setAnimate({})
    await nextFrame()
    expectStyle(ref, 'opacity: 0')
  })

  it('when value is removed from animate, animates back to value currently defined in initial prop', async () => {
    let ref!: HTMLDivElement
    const [animate, setAnimate] = createSignal<Record<string, number>>({ opacity: 1 })
    const [initial, setInitial] = createSignal<Record<string, number>>({ opacity: 0 })
    render(() => (
      <motion.div
        ref={(el) => (ref = el)}
        initial={initial()}
        animate={animate()}
        transition={{ type: false }}
      />
    ))
    await nextFrame()
    expectStyle(ref, 'opacity: 1')

    setInitial({ opacity: 0.5 })
    setAnimate({})
    await nextFrame()
    expectStyle(ref, 'opacity: 0.5')
  })

  it('when value is removed from both animate and initial, perform no animation', async () => {
    let ref!: HTMLDivElement
    const [animate, setAnimate] = createSignal<Record<string, number>>({ opacity: 1 })
    const [initial, setInitial] = createSignal<Record<string, number>>({ opacity: 0 })
    render(() => (
      <motion.div
        ref={(el) => (ref = el)}
        initial={initial()}
        animate={animate()}
        transition={{ type: false }}
      />
    ))
    await nextFrame()
    expectStyle(ref, 'opacity: 1')

    setInitial({})
    setAnimate({})
    await nextFrame()
    expectStyle(ref, 'opacity: 1')
  })

  it('accepts default transition prop', async () => {
    const x = motionValue(0)
    const opacity = motionValue(0)
    const result = await new Promise<[number, number]>((resolve) => {
      render(() => (
        <motion.div
          animate={{ opacity: 1, x: 20 }}
          transition={{ default: { type: false }, x: { type: 'tween', from: 10, ease: () => 0.5 } }}
          onUpdate={() => frame.read(() => resolve([x.get(), opacity.get()]))}
          style={{ x, opacity }}
        />
      ))
    })
    expect(result).toEqual([15, 1])
  })

  it('accepts base transition settings', async () => {
    const x = motionValue(0)
    const opacity = motionValue(0)
    const result = await new Promise<[number, number]>((resolve) => {
      render(() => (
        <motion.div
          animate={{ opacity: 1, x: 20 }}
          transition={{ type: false, duration: 1, x: { type: 'tween', from: 10, ease: () => 0.5 } }}
          onUpdate={() => frame.read(() => resolve([x.get(), opacity.get()]))}
          style={{ x, opacity }}
        />
      ))
    })
    expect(result).toEqual([15, 1])
  })

  it('when value is removed from animate, animate back to value read from DOM', async () => {
    let ref!: HTMLDivElement
    const [animate, setAnimate] = createSignal<Record<string, number>>({ opacity: 1 })
    render(() => (
      <motion.div
        ref={(el) => (ref = el)}
        style={{ opacity: 0.5 }}
        animate={animate()}
        transition={{ type: false }}
      />
    ))
    await nextFrame()
    expectStyle(ref, 'opacity: 1')

    setAnimate({})
    await nextFrame()
    expectStyle(ref, 'opacity: 0.5')
  })

  it('respects repeatDelay prop', async () => {
    const x = motionValue(0)
    const result = await new Promise<number>((resolve) => {
      x.on('change', () => setTimeout(() => resolve(x.get()), 50))
      render(() => (
        <motion.div
          animate={{ x: [0, 20] }}
          transition={{
            x: { type: 'tween', duration: 0, repeatDelay: 0.1, repeat: 1, repeatType: 'reverse' },
          }}
          style={{ x }}
        />
      ))
    })
    expect(result).toBe(20)
  })

  const finalKeyframe = (
    repeatType: 'reverse' | 'mirror' | 'loop',
    repeat: number,
    expected: number,
  ) =>
    it(`Correctly applies final keyframe with repeatType ${repeatType} and ${repeat % 2 ? 'odd' : 'even'} numbered repeat`, async () => {
      const x = motionValue(0)
      const result = await new Promise<number>((resolve) => {
        render(() => (
          <motion.div
            animate={{ x: [0, 20] }}
            transition={{
              x: { type: 'tween', duration: 0.1, repeatDelay: 0.1, repeat, repeatType },
            }}
            onAnimationComplete={() => frame.postRender(() => resolve(x.get()))}
            style={{ x }}
          />
        ))
      })
      expect(result).toBe(expected)
    })

  finalKeyframe('reverse', 1, 0)
  finalKeyframe('mirror', 1, 0)
  finalKeyframe('loop', 1, 20)
  finalKeyframe('reverse', 2, 20)
  finalKeyframe('mirror', 2, 20)
  finalKeyframe('loop', 2, 20)

  it('animates previously unseen properties, instant animation', async () => {
    const [animate, setAnimate] = createSignal<Record<string, number>>({ x: 100 })
    const wrapper = render(() => <motion.div animate={animate()} transition={{ type: false }} />)
    setAnimate({ y: 100 })
    await nextFrame()
    expectStyle(wrapper.container.firstChild as Element, 'transform: translateY(100px)')
  })

  it('animates previously unseen properties', async () => {
    const [animate, setAnimate] = createSignal<Record<string, number>>({ x: 100 })
    const wrapper = render(() => <motion.div animate={animate()} transition={{ duration: 0 }} />)
    setAnimate({ y: 100 })
    await nextFrame()
    await nextFrame()
    expectStyle(wrapper.container.firstChild as Element, 'transform: translateY(100px)')
  })

  it('converts unseen zero unit types to number', async () => {
    const element = await new Promise<Element>((resolve) => {
      const wrapper = render(() => (
        <motion.div
          animate={{ borderRadius: 20 }}
          transition={{ duration: 0.01 }}
          onAnimationComplete={() => resolve(wrapper.container.firstChild as Element)}
          style={{ 'border-radius': '0px' }}
        />
      ))
    })
    expectStyle(element, 'border-radius: 20px')
  })

  it('animates previously unseen CSS variables', async () => {
    let latestColor = ''
    const result = await new Promise<string>((resolve) => {
      render(() => (
        <motion.div
          style={{ '--foo': '#fff' } as Record<string, string>}
          animate={{ '--foo': '#000' } as Record<string, string>}
          onUpdate={(latest: Record<string, string>) => {
            latestColor = latest['--foo']
          }}
          onAnimationComplete={() => resolve(latestColor)}
          transition={{ type: false }}
        />
      ))
    })
    expect(result).toBe('#000')
  })

  it('forces an animation to fallback if has been set to `null`', async () => {
    const [animate, setAnimate] = createSignal<Record<string, number | null>>({ x: 100 })
    const [onComplete, setOnComplete] = createSignal<VoidFunction | undefined>(undefined)
    const wrapper = render(() => (
      <motion.div
        animate={animate()}
        onAnimationComplete={onComplete()}
        transition={{ type: false }}
      />
    ))
    await nextFrame()

    setAnimate({ x: null })
    await nextFrame()
    expectStyle(wrapper.container.firstChild as Element, 'transform: none')

    const result = await new Promise<boolean>((resolve) => {
      setOnComplete(() => () => resolve(true))
      setAnimate({ x: 100 })
    })
    expect(result).toBe(true)
  })

  it("mount animation doesn't run if `initial={false}`", async () => {
    const onComplete = vi.fn()
    const x = motionValue(0)
    const y = motionValue(0)
    const z = motionValue(0)
    render(() => (
      <motion.div
        initial={false}
        animate={{ x: 20, y: 20, transitionEnd: { x: 10, z: 20 } }}
        transition={{ type: false }}
        style={{ x, y, z }}
        onAnimationComplete={onComplete}
      />
    ))
    await delay(10)
    expect(onComplete).not.toBeCalled()
    expect([x.get(), y.get(), z.get()]).toEqual([10, 20, 20])
  })

  it('unmount cancels active animations', async () => {
    const onComplete = vi.fn()
    const [isVisible, setIsVisible] = createSignal(true)
    render(() => (
      <Show when={isVisible()}>
        <motion.div
          animate={{ x: 20 }}
          transition={{ duration: 0.2 }}
          onAnimationComplete={() => onComplete()}
        />
      </Show>
    ))
    await delay(100)
    setIsVisible(false)
    await delay(200)
    expect(onComplete).not.toBeCalled()
  })

  it('animate prop accepts pathOffset', () => {
    render(() => <motion.div animate={{ pathOffset: 1, pathSpacing: 1 }} />)
  })

  it('Correctly animates from RGB to HSLA', async () => {
    let ref!: HTMLDivElement
    await new Promise<void>((resolve) => {
      render(() => (
        <motion.div
          ref={(el) => (ref = el)}
          initial={{ backgroundColor: 'rgb(0, 153, 255)' }}
          animate={{ backgroundColor: 'hsl(345, 100%, 60%)' }}
          onAnimationComplete={() => resolve()}
          transition={{ duration: 0.01 }}
        />
      ))
    })
    expectStyle(ref, 'background-color: hsl(345, 100%, 60%)')
  })

  it('Correctly animates from HEX to HSLA', async () => {
    let ref!: HTMLDivElement
    await new Promise<void>((resolve) => {
      render(() => (
        <motion.div
          ref={(el) => (ref = el)}
          initial={{ backgroundColor: '#0088ff' }}
          animate={{ backgroundColor: 'hsl(345, 100%, 60%)' }}
          onAnimationComplete={() => resolve()}
          transition={{ duration: 0.01 }}
        />
      ))
    })
    expectStyle(ref, 'background-color: hsl(345, 100%, 60%)')
  })

  it('Correctly animates from HSLA to Hex', async () => {
    let ref!: HTMLDivElement
    await new Promise<void>((resolve) => {
      render(() => (
        <motion.div
          ref={(el) => (ref = el)}
          initial={{ backgroundColor: 'hsla(345, 100%, 60%, 1)' }}
          animate={{ backgroundColor: '#0088ff' }}
          onAnimationComplete={() => resolve()}
          transition={{ duration: 0.01 }}
        />
      ))
    })
    expectStyle(ref, 'background-color: rgba(0, 136, 255, 1)')
  })

  it('Correctly animates from HSLA to RGB', async () => {
    let ref!: HTMLDivElement
    await new Promise<void>((resolve) => {
      render(() => (
        <motion.div
          ref={(el) => (ref = el)}
          initial={{ backgroundColor: 'hsla(345, 100%, 60%, 1)' }}
          animate={{ backgroundColor: 'rgba(0, 136, 255, 1)' }}
          onAnimationComplete={() => resolve()}
          transition={{ duration: 0.01 }}
        />
      ))
    })
    expectStyle(ref, 'background-color: rgba(0, 136, 255, 1)')
  })

  it('animationStart event fires as expected', async () => {
    const x = motionValue(0)
    const fn = vi.fn()
    x.on('animationStart', fn)
    await new Promise<void>((resolve) => {
      render(() => (
        <motion.div
          animate={{ x: 100 }}
          transition={{ duration: 0.01 }}
          style={{ x }}
          onUpdate={() => resolve()}
        />
      ))
    })
    expect(fn).toHaveBeenCalled()
  })

  it("doesn't error when provided unknown animation type", () => {
    render(() => (
      <motion.div animate={{ x: 100 }} transition={{ type: 'test' } as unknown as object} />
    ))
  })

  it('correctly implements custom mix function', async () => {
    ;(MotionGlobalConfig as { mix?: unknown }).mix = () => () => 'black'
    const result = await new Promise<boolean>((resolve) => {
      render(() => (
        <motion.div
          initial={{ backgroundColor: 'rgba(255, 255, 0, 1)' }}
          animate={{ backgroundColor: 'color(display-p3 0 1 0 / 0.5)' }}
          transition={{ duration: 0.1 }}
          onUpdate={({ backgroundColor }: { backgroundColor: string }) => {
            expect(backgroundColor).toBe('black')
            delete (MotionGlobalConfig as { mix?: unknown }).mix
            resolve(true)
          }}
        />
      ))
    })
    expect(result).toBe(true)
  })

  it('Correctly animates complex value types on first rerender', async () => {
    const output: string[] = []
    const result = await new Promise<string[]>((resolve) => {
      render(() => (
        <motion.div
          animate={{
            background: 'linear-gradient(0deg, hsl(216, 100%, 50%) 0%, hsl(301, 100%, 50%) 100%)',
          }}
          onUpdate={({ background }: { background: string }) => output.push(background)}
          onAnimationComplete={() => resolve(output)}
          style={{
            background: 'linear-gradient(180deg, hsl(216, 100%, 50%) 0%, hsl(301, 100%, 50%) 100%)',
          }}
        />
      ))
    })
    expect(result.length).not.toBe(1)
  })

  // Adapted from upstream's "Doesn't double-add listeners". Upstream asserts
  // exactly 1 change listener (React's single VE subscription) — a React-internal
  // detail. The Solid port intentionally uses two idempotent subscribers: a
  // registry-writer (`mv.on('change', scheduleWrite)`) that writes the DOM, plus
  // the motion-dom VE. So we verify the meaningful behavior — an externally
  // provided motion value is driven to its target — and guard against truly
  // redundant subscriptions beyond that architectural baseline (2).
  it('drives an externally-provided motion value without redundant subscriptions', async () => {
    const x = motionValue(0)
    const getChangeCount = () =>
      (x as unknown as { events: { change: { getSize(): number } } }).events.change.getSize()
    let countAtStart = 0
    await new Promise<void>((resolve) => {
      render(() => (
        <motion.div
          animate={{ x: 100 }}
          transition={{ duration: 0.01 }}
          onAnimationStart={() => {
            countAtStart = getChangeCount()
          }}
          onAnimationComplete={() => resolve()}
          style={{ x }}
        />
      ))
    })
    expect(x.get()).toBe(100)
    expect(countAtStart).toBeLessThanOrEqual(2)
  })

  it('Positional values without specific handlers are not measured', async () => {
    const result = await new Promise<boolean>((resolve) => {
      render(() => (
        <motion.div
          initial={{ rotate: '10deg', x: 100 }}
          animate={{ rotate: '2turn', x: 200 }}
          transition={{ duration: 0.01 }}
          onAnimationComplete={() => resolve(true)}
        />
      ))
    })
    expect(result).toBe(true)
  })
})
