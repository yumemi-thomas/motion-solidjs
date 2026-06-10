// Ported from motion/react: packages/framer-motion/src/motion/__tests__/variant.test.tsx
// (the `describe("animate prop as variant")` block). The stagger cases that
// already live in ./variant.test.tsx are not duplicated here. The React
// `Suspense`/`StrictMode`/`visualElementStore` block is React-internal and is
// covered for Solid by tests/browser/variant-propagation-suspense.test.tsx, so
// it is omitted.
//
// React-isms translated to Solid:
//  - `rerender(<C prop={y}/>)` → a `createSignal` that the JSX reads.
//  - `useState` → `createSignal`, `useMotionValue` → `motionValue`,
//    `useEffect` → `onMount`, `React.memo(Child)` → a plain component.
//  - jest-dom's `toHaveStyle` → the local `expectStyle` helper (reads inline
//    style, normalising whitespace/colour spacing; treats an empty transform
//    as `none`, matching motion-dom's buildTransform default).
import { cleanup, render } from '@solidjs/testing-library'
import { frame, motionValue, stagger } from 'motion-dom'
import type { Variants } from 'motion-dom'
import { createSignal, onMount } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Motion, MotionConfig, motion } from '@/components'
import {
  nextFrame,
  pointerDown,
  pointerEnter,
  pointerUp,
} from '../../features/gestures/drag-test-utils'

afterEach(() => cleanup())

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))
const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase()

function styleOf(el: Element, prop: string): string {
  const raw = (el as HTMLElement).style.getPropertyValue(prop)
  if (prop === 'transform' && raw === '') return 'none'
  return raw
}

function expectStyle(el: Element, decl: string) {
  const idx = decl.indexOf(':')
  const prop = decl.slice(0, idx).trim()
  const expected = decl.slice(idx + 1).trim()
  expect(norm(styleOf(el, prop))).toBe(norm(expected))
}

function expectNotStyle(el: Element, decl: string) {
  const idx = decl.indexOf(':')
  const prop = decl.slice(0, idx).trim()
  const expected = decl.slice(idx + 1).trim()
  expect(norm(styleOf(el, prop))).not.toBe(norm(expected))
}

describe('animate prop as variant', () => {
  it('animates to set variant', async () => {
    const variants: Variants = {
      hidden: { opacity: 0, x: -100, transition: { type: false } },
      visible: { opacity: 1, x: 100, transition: { type: false } },
    }
    const x = motionValue(0)
    const result = await new Promise<number>((resolve) => {
      render(() => (
        <motion.div
          animate="visible"
          variants={variants}
          style={{ x }}
          onAnimationComplete={() => resolve(x.get())}
        />
      ))
    })
    expect(result).toBe(100)
  })

  it('fires onAnimationStart when animation begins', async () => {
    const onStart = vi.fn()
    await new Promise<void>((resolve) => {
      render(() => (
        <motion.div
          animate="visible"
          transition={{ type: false }}
          onAnimationStart={onStart}
          onAnimationComplete={() => resolve()}
        />
      ))
    })
    expect(onStart).toBeCalledTimes(1)
  })

  it('fires onAnimationStart with the animation definition', async () => {
    const onStart = vi.fn()
    await new Promise<void>((resolve) => {
      render(() => (
        <motion.div
          animate="visible"
          transition={{ type: false }}
          onAnimationStart={(definition: unknown) => onStart(definition)}
          onAnimationComplete={() => resolve()}
        />
      ))
    })
    expect(onStart).toBeCalledWith('visible')
  })

  it('child animates to set variant', async () => {
    const variants: Variants = {
      hidden: { opacity: 0, x: -100, transition: { type: false } },
      visible: { opacity: 1, x: 100, transition: { type: false } },
    }
    const childVariants: Variants = {
      hidden: { opacity: 0, x: -100, transition: { type: false } },
      visible: { opacity: 1, x: 50, transition: { type: false } },
    }
    const x = motionValue(0)
    const result = await new Promise<number>((resolve) => {
      render(() => (
        <motion.div
          animate="visible"
          variants={variants}
          onAnimationComplete={() => resolve(x.get())}
        >
          <motion.div variants={childVariants} style={{ x }} />
        </motion.div>
      ))
    })
    expect(result).toBe(50)
  })

  it('child animates to set variant even if variants are not found on parent', async () => {
    const childVariants: Variants = {
      hidden: { opacity: 0, x: -100, transition: { type: false } },
      visible: { opacity: 1, x: 50, transition: { type: false } },
    }
    const x = motionValue(0)
    const result = await new Promise<number>((resolve) => {
      render(() => (
        <motion.div animate="visible" onAnimationComplete={() => resolve(x.get())}>
          <motion.div variants={childVariants} style={{ x }} />
        </motion.div>
      ))
    })
    expect(result).toBe(50)
  })

  it('applies applyOnEnd if set on initial', () => {
    const variants: Variants = {
      visible: { background: '#f00', transitionEnd: { display: 'none' } },
    }
    const wrapper = render(() => <motion.div variants={variants} initial="visible" />)
    expectStyle(wrapper.container.firstChild as Element, 'display: none')
  })

  it('applies applyOnEnd and end of animation', async () => {
    const variants: Variants = {
      hidden: { background: '#00f' },
      visible: { background: '#f00', transitionEnd: { display: 'none' } },
    }
    const display = motionValue('block')
    const result = await new Promise<string>((resolve) => {
      render(() => (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={variants}
          transition={{ type: false }}
          onAnimationComplete={() => frame.postRender(() => resolve(display.get()))}
          style={{ display }}
        />
      ))
    })
    expect(result).toBe('none')
  })

  it('accepts custom transition', async () => {
    const variants: Variants = {
      hidden: { background: '#00f' },
      visible: { background: '#f00', transition: { from: '#555', ease: () => 0.5 } },
    }
    const background = motionValue('#00f')
    const result = await new Promise<string>((resolve) => {
      render(() => (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={variants}
          transition={{ type: false }}
          onUpdate={() => resolve(background.get())}
          style={{ background }}
        />
      ))
    })
    expect(result).toBe('rgba(190, 60, 60, 1)')
  })

  it('respects orchestration props in transition prop', async () => {
    const opacity = motionValue(0)
    render(() => (
      <motion.div
        variants={{ visible: { opacity: 1 }, hidden: { opacity: 0 } }}
        initial="hidden"
        animate="visible"
        transition={{ type: false, delayChildren: 1 }}
      >
        <motion.div
          variants={{ visible: { opacity: 0.9 }, hidden: { opacity: 0 } }}
          transition={{ type: false }}
          style={{ opacity }}
        />
      </motion.div>
    ))
    await nextFrame()
    expect(opacity.get()).toBe(0)
  })

  it('delay propagates throughout children', async () => {
    const opacity = motionValue(0)
    const variants: Variants = { visible: { opacity: 1 }, hidden: { opacity: 0 } }
    render(() => (
      <motion.div
        variants={variants}
        initial="hidden"
        animate="visible"
        transition={{ type: false, delayChildren: 1 }}
      >
        <motion.div variants={variants} transition={{ type: false }}>
          <motion.div variants={variants} style={{ opacity }} />
        </motion.div>
      </motion.div>
    ))
    await delay(300)
    expect(opacity.get()).toBe(0)
  })

  it('propagates through components with no `animate` prop', async () => {
    const opacity = motionValue(0)
    const variants: Variants = { visible: { opacity: 1 } }
    render(() => (
      <motion.div
        variants={variants}
        initial="hidden"
        animate="visible"
        transition={{ type: false }}
      >
        <motion.div>
          <motion.div variants={variants} transition={{ type: false }} style={{ opacity }} />
        </motion.div>
      </motion.div>
    ))
    await nextFrame()
    expect(opacity.get()).toBe(1)
  })

  it("doesn't propagate to a component with its own `animate` prop", async () => {
    const opacity = motionValue(1)
    const parentVariants = { initial: { x: 0 }, animate: { x: 100 } }
    const childVariants = { initial: { opacity: 0 }, animate: { opacity: 1 } }
    render(() => (
      <motion.div
        initial="initial"
        animate="animate"
        variants={parentVariants}
        transition={{ duration: 0.05 }}
      >
        <motion.div
          animate="initial"
          variants={childVariants}
          style={{ opacity }}
          transition={{ duration: 0.05 }}
        />
      </motion.div>
    ))
    await delay(100)
    expect(opacity.get()).toBe(0)
  })

  it('when: afterChildren works correctly', async () => {
    const parentOpacity = motionValue(0.1)
    const childOpacity = motionValue(0.1)
    const variants: Variants = {
      hidden: { opacity: 0, display: 'block' },
      visible: { opacity: 1, transitionEnd: { display: 'none' } },
    }
    const [animate, setAnimate] = createSignal('hidden')

    await new Promise<void>((resolve) => {
      // A single stable handler that branches on the current animate target —
      // avoids React's `rerender(<C onAnimationComplete=.../>)` handler swap.
      const onParentComplete = () => {
        if (animate() === 'visible') {
          expect(parentOpacity.get()).toBe(1)
          expect(childOpacity.get()).toBe(1)

          setAnimate('hidden')
          setTimeout(() => {
            expect(parentOpacity.get()).toBe(1)
            expect(childOpacity.get()).not.toBe(1)
          }, 50)
        } else {
          expect(parentOpacity.get()).toBe(0)
          expect(childOpacity.get()).toBe(0)
          resolve()
        }
      }

      render(() => (
        <motion.div
          variants={variants}
          initial={false}
          transition={{ duration: 0.1, when: 'afterChildren' }}
          animate={animate()}
          style={{ opacity: parentOpacity }}
          onAnimationComplete={onParentComplete}
        >
          <motion.div>
            <motion.div
              variants={variants}
              transition={{ duration: 0.1 }}
              style={{ opacity: childOpacity }}
            />
          </motion.div>
        </motion.div>
      ))

      // Defer to the next microtask so the initial (animate="hidden",
      // initial={false}) render settles and isInitialRender flips to false —
      // mirroring React's separate rerender commit. A synchronous setAnimate
      // would race the deferred initial animateChanges and be swallowed by the
      // initial={false} suppression gate.
      queueMicrotask(() => setAnimate('visible'))

      setTimeout(() => {
        expect(parentOpacity.get()).toBe(0)
        expect(childOpacity.get()).not.toBe(0)
      }, 50)
    })
  })

  // Adapted: upstream uses a transparent motion(Fragment) wrapper; the Solid
  // port has no Fragment renderer, so a real <Motion> wrapper provides the
  // variant context. Verifies the same value-removal-fallback behavior (an
  // inherited initial variant wins over the child's plain `style` value, and a
  // removed value falls back to the initial variant).
  it('FRAMER BUG: When a value is removed from an element as the result of a parent variant, fallback to style', async () => {
    const [animate, setAnimate] = createSignal<string | undefined>(undefined)
    const wrapper = render(() => (
      <Motion initial="a" animate={animate()}>
        <motion.div
          data-testid="child"
          variants={{ a: { opacity: 0.5 }, b: { opacity: 1 }, c: {} }}
          transition={{ type: false }}
          style={{ opacity: 0 }}
        />
      </Motion>
    ))
    const element = wrapper.getByTestId('child')
    expectStyle(element, 'opacity: 0.5')

    setAnimate('a')
    await nextFrame()
    expectStyle(element, 'opacity: 0.5')

    setAnimate('b')
    await nextFrame()
    expectStyle(element, 'opacity: 1')

    setAnimate('c')
    await nextFrame()
    expectStyle(element, 'opacity: 0') // Contained in variant a, which is set as initial
  })

  it('initial: false correctly propagates', async () => {
    const opacity = motionValue(0.5)
    render(() => (
      <motion.div initial={false} animate="visible">
        <motion.div>
          <motion.div
            variants={{ visible: { opacity: 0.9 }, hidden: { opacity: 0 } }}
            style={{ opacity }}
          />
        </motion.div>
      </motion.div>
    ))
    await delay(200)
    expect(opacity.get()).toBe(0.9)
  })

  it("initial=false doesn't propagate to props", () => {
    const wrapper = render(() => (
      <motion.div initial={false} animate="test">
        <motion.div data-testid="child" animate={{ opacity: 0.4 }} />
      </motion.div>
    ))
    expectNotStyle(wrapper.getByTestId('child'), 'opacity: 0.4')
  })

  it('nested controlled variants switch correctly', async () => {
    const parentOpacity = motionValue(0.2)
    const childOpacity = motionValue(0.1)
    const [isOpen, setIsOpen] = createSignal(false)
    render(() => (
      <motion.div
        variants={{ visible: { opacity: 0.3 }, hidden: { opacity: 0.4 } }}
        initial="hidden"
        animate={isOpen() ? 'visible' : 'hidden'}
        transition={{ type: false }}
        style={{ opacity: parentOpacity }}
      >
        <motion.div
          variants={{ visible: { opacity: 0.5 }, hidden: { opacity: 0.6 } }}
          initial="hidden"
          transition={{ type: false }}
          animate={isOpen() ? 'visible' : 'hidden'}
          style={{ opacity: childOpacity }}
        />
      </motion.div>
    ))

    await nextFrame()
    expect(parentOpacity.get()).toBe(0.4)
    expect(childOpacity.get()).toBe(0.6)

    setIsOpen(true)
    await nextFrame()
    expect([parentOpacity.get(), childOpacity.get()]).toEqual([0.3, 0.5])
  })

  it('Child variants correctly calculate delay based on delayChildren: stagger()', async () => {
    const isCorrectlyStaggered = await new Promise<boolean>((resolve) => {
      const childVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.1 } },
      }
      function Component() {
        const a = motionValue(0)
        const b = motionValue(0)
        onMount(() =>
          a.on('change', (latest: number) => {
            if (latest >= 1 && b.get() === 0) resolve(true)
          }),
        )
        return (
          <motion.div
            variants={{
              hidden: {},
              visible: { x: 100, transition: { delayChildren: stagger(0.15) } },
            }}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={childVariants} style={{ opacity: a }} />
            <motion.div variants={childVariants} style={{ opacity: b }} />
          </motion.div>
        )
      }
      render(() => <Component />)
    })
    expect(isCorrectlyStaggered).toBe(true)
  })

  it('Child variants with value-specific transitions correctly calculate delay based on delayChildren: stagger()', async () => {
    const isCorrectlyStaggered = await new Promise<boolean>((resolve) => {
      const childVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { opacity: { duration: 0.1 } } },
      }
      function Component() {
        const a = motionValue(0)
        const b = motionValue(0)
        onMount(() =>
          a.on('change', (latest: number) => {
            if (latest >= 1 && b.get() === 0) resolve(true)
          }),
        )
        return (
          <motion.div
            variants={{
              hidden: {},
              visible: { x: 100, transition: { delayChildren: stagger(0.15) } },
            }}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={childVariants} style={{ opacity: a }} />
            <motion.div variants={childVariants} style={{ opacity: b }} />
          </motion.div>
        )
      }
      render(() => <Component />)
    })
    expect(isCorrectlyStaggered).toBe(true)
  })

  it('Child variants correctly calculate delay based on staggerChildren (deprecated)', async () => {
    const isCorrectlyStaggered = await new Promise<boolean>((resolve) => {
      const childVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.1 } },
      }
      function Component() {
        const a = motionValue(0)
        const b = motionValue(0)
        onMount(() =>
          a.on('change', (latest: number) => {
            if (latest >= 1 && b.get() === 0) resolve(true)
          }),
        )
        return (
          <motion.div
            variants={{ hidden: {}, visible: { x: 100, transition: { staggerChildren: 0.15 } } }}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={childVariants} style={{ opacity: a }} />
            <motion.div variants={childVariants} style={{ opacity: b }} />
          </motion.div>
        )
      }
      render(() => <Component />)
    })
    expect(isCorrectlyStaggered).toBe(true)
  })

  it('onUpdate', async () => {
    let latest = {}
    const result = await new Promise<Record<string, number | string>>((resolve) => {
      render(() => (
        <motion.div
          onUpdate={(l: Record<string, number | string>) => {
            latest = l
          }}
          initial={{ x: 0, y: 0 }}
          animate={{ x: 100, y: 100 }}
          transition={{ duration: 0.1 }}
          onAnimationComplete={() =>
            frame.postRender(() => resolve(latest as Record<string, number | string>))
          }
        />
      ))
    })
    expect(result).toEqual({ x: 100, y: 100 })
  })

  it('onUpdate doesnt fire if no values have changed', async () => {
    const onUpdate = vi.fn()
    const x = motionValue(0)
    const [xTarget, setXTarget] = createSignal(0)
    await new Promise<void>((resolve) => {
      render(() => (
        <motion.div
          animate={{ x: xTarget() }}
          transition={{ type: false }}
          onUpdate={(latest: Record<string, unknown>) => {
            expect(latest.willChange).not.toBe('auto')
            onUpdate(latest)
          }}
          style={{ x, 'will-change': 'transform' }}
        />
      ))
      setTimeout(() => setXTarget(1), 30)
      setTimeout(() => setXTarget(1), 60)
      setTimeout(() => resolve(), 90)
    })
    expect(onUpdate).toHaveBeenCalledTimes(1)
  })

  it('new child items animate from initial to animate', async () => {
    const x = motionValue(0)
    const [length, setLength] = createSignal(1)
    const variants: Variants = {
      hidden: { opacity: 0, x: -100, transition: { type: false } },
      visible: { opacity: 1, x: 100, transition: { type: false } },
    }
    render(() => (
      <motion.div initial="hidden" animate="visible">
        <motion.div>
          {Array.from({ length: length() }, (_, i) => (
            <motion.div variants={variants} style={{ x: i === 1 ? x : 0 }} />
          ))}
        </motion.div>
      </motion.div>
    ))
    setLength(2)
    await nextFrame()
    expect(x.get()).toBe(100)
  })

  it('style is used as fallback when a variant is removed from animate', async () => {
    const [animate, setAnimate] = createSignal<string | undefined>(undefined)
    const wrapper = render(() => (
      <motion.div
        animate={animate()}
        variants={{ a: { opacity: 1 } }}
        transition={{ type: false }}
        style={{ opacity: 0 }}
      />
    ))
    const element = wrapper.container.firstChild as Element
    expectStyle(element, 'opacity: 0')

    setAnimate('a')
    await nextFrame()
    expectStyle(element, 'opacity: 1')

    setAnimate(undefined)
    await nextFrame()
    expectStyle(element, 'opacity: 0')
  })

  it('style is active once value has been removed from animate', async () => {
    const [animate, setAnimate] = createSignal<string | undefined>(undefined)
    const [opacity, setOpacity] = createSignal(0)
    const wrapper = render(() => (
      <motion.div
        animate={animate()}
        variants={{ a: { opacity: 1, rotate: 1 } }}
        transition={{ type: false }}
        style={{ opacity: opacity(), rotate: opacity() }}
      />
    ))
    const element = wrapper.container.firstChild as Element
    expectStyle(element, 'opacity: 0')
    expectStyle(element, 'transform: none')

    setAnimate('a')
    await nextFrame()
    expectStyle(element, 'opacity: 1')
    expectStyle(element, 'transform: rotate(1deg)')

    setAnimate(undefined)
    await nextFrame()
    expectStyle(element, 'opacity: 0')
    expectStyle(element, 'transform: none')

    setOpacity(0.5)
    await nextFrame()
    expectStyle(element, 'opacity: 0.5')
    expectStyle(element, 'transform: rotate(0.5deg)')

    setAnimate('a')
    await nextFrame()
    expectStyle(element, 'opacity: 1')
    expectStyle(element, 'transform: rotate(1deg)')

    setOpacity(0.75)
    await nextFrame()
    expectStyle(element, 'opacity: 1')
    expectStyle(element, 'transform: rotate(1deg)')
  })

  it('variants work the same whether defined inline or not', async () => {
    const variants = { foo: { opacity: [1, 0, 1] } }
    const outputA: number[] = []
    const outputB: number[] = []
    const [activeVariants, setActiveVariants] = createSignal<string[]>(['foo'])
    render(() => (
      <>
        <motion.div
          class="box bg-blue"
          animate={activeVariants()}
          variants={{ foo: { opacity: [1, 0, 1] } }}
          transition={{ duration: 0.1 }}
          onUpdate={({ opacity }: { opacity: number }) => outputA.push(opacity)}
        />
        <motion.div
          class="box bg-green"
          animate={activeVariants()}
          variants={variants}
          transition={{ duration: 0.1 }}
          onUpdate={({ opacity }: { opacity: number }) => outputB.push(opacity)}
        />
      </>
    ))
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        setActiveVariants(['foo', 'bar'])
        setTimeout(resolve, 100)
      }, 100)
    })
    expect(outputA.length).toEqual(outputB.length)
  })

  it('style is used as fallback when a variant changes to not contain that style', async () => {
    const [animate, setAnimate] = createSignal<string | undefined>(undefined)
    const wrapper = render(() => (
      <motion.div
        animate={animate()}
        variants={{ a: { opacity: 1 }, b: { x: 100 } }}
        transition={{ type: false }}
        style={{ opacity: 0 }}
      />
    ))
    const element = wrapper.container.firstChild as Element
    expectStyle(element, 'opacity: 0')

    setAnimate('a')
    await nextFrame()
    expectStyle(element, 'opacity: 1')

    setAnimate('b')
    await nextFrame()
    expectStyle(element, 'opacity: 0')
  })

  it('Children correctly animate to removed values even when not rendering along with parents', async () => {
    const Child = () => (
      <motion.div
        variants={{ visible: { x: 100, opacity: 1 }, hidden: { opacity: 0 } }}
        transition={{ type: false }}
      />
    )
    const [isVisible, setIsVisible] = createSignal(false)
    const wrapper = render(() => (
      <motion.div initial={{ x: 0 }} animate={isVisible() ? 'visible' : 'hidden'}>
        <Child />
      </motion.div>
    ))
    const element = wrapper.container.firstChild?.firstChild as Element

    setIsVisible(true)
    await nextFrame()
    expectStyle(element, 'transform: translateX(100px)')

    setIsVisible(false)
    await nextFrame()
    expectStyle(element, 'transform: none')
  })

  it("Protected keys don't persist after setActive fires", async () => {
    const [isHover, setIsHover] = createSignal(false)
    const [variant, setVariant] = createSignal('a')

    const variants = () => {
      const v = [variant()]
      if (isHover()) v.push(`${variant()}-hover`)
      return v
    }

    const wrapper = render(() => (
      <MotionConfig transition={{ type: false }}>
        <motion.div
          data-testid="parent"
          animate={variants()}
          onHoverStart={() => setIsHover(true)}
          onHoverEnd={() => setIsHover(false)}
        >
          <motion.div
            data-testid="variant-trigger"
            onTap={() => setVariant('b')}
            style={{ width: '300px', height: '300px', 'background-color': 'rgb(255,255,0)' }}
            variants={{ b: { backgroundColor: 'rgb(0,255,255)' } }}
          >
            <motion.div
              data-testid="inner"
              style={{ width: '100px', height: '100px', 'background-color': 'rgb(255,255,0)' }}
              variants={{
                'a-hover': { backgroundColor: 'rgb(150,150,0)' },
                b: { backgroundColor: 'rgb(0,255,255)' },
                'b-hover': { backgroundColor: 'rgb(0, 150,150)' },
              }}
            />
          </motion.div>
        </motion.div>
      </MotionConfig>
    ))
    const inner = wrapper.getByTestId('inner')
    expectStyle(inner, 'background-color: rgb(255,255,0)')

    pointerEnter(wrapper.getByTestId('parent'))
    await nextFrame()
    await nextFrame()
    await nextFrame()
    expectStyle(inner, 'background-color: rgb(150,150,0)')

    pointerDown(wrapper.getByTestId('variant-trigger'))
    pointerUp(wrapper.getByTestId('variant-trigger'))
    await nextFrame()
    await nextFrame()
    await nextFrame()
    expectStyle(inner, 'background-color: rgb(0, 150,150)')
  })

  it('child onAnimationStart triggers from parent animations', async () => {
    const variants: Variants = {
      hidden: { opacity: 0, x: -100, transition: { type: false } },
      visible: { opacity: 1, x: 100, transition: { type: false } },
    }
    const childVariants: Variants = {
      hidden: { opacity: 0, x: -100, transition: { type: false } },
      visible: { opacity: 1, x: 50, transition: { type: false } },
    }
    const result = await new Promise<string>((resolve) => {
      render(() => (
        <motion.div animate="visible" variants={variants}>
          <motion.div variants={childVariants} onAnimationStart={(name: string) => resolve(name)} />
        </motion.div>
      ))
    })
    expect(result).toBe('visible')
  })

  it('child onAnimationComplete triggers from parent animations', async () => {
    const variants: Variants = {
      hidden: { opacity: 0, x: -100, transition: { type: false } },
      visible: { opacity: 1, x: 100, transition: { type: false } },
    }
    const childVariants: Variants = {
      hidden: { opacity: 0, x: -100, transition: { type: false } },
      visible: { opacity: 1, x: 50, transition: { type: false } },
    }
    const result = await new Promise<string>((resolve) => {
      render(() => (
        <motion.div animate="visible" variants={variants}>
          <motion.div
            variants={childVariants}
            onAnimationComplete={(name: string) => resolve(name)}
          />
        </motion.div>
      ))
    })
    expect(result).toBe('visible')
  })

  it('changing values within an inherited variant triggers an animation', async () => {
    const [x, setX] = createSignal(0)
    const wrapper = render(() => (
      <motion.div initial={false} animate="variant">
        <motion.div
          data-testid="element"
          variants={{ variant: { x: x() } }}
          transition={{ type: false }}
        />
      </motion.div>
    ))
    await nextFrame()
    const element = wrapper.getByTestId('element')
    expectStyle(element, 'transform: none')

    setX(100)
    await nextFrame()
    expectStyle(element, 'transform: translateX(100px)')
  })

  it('transitionEnd from instant animation does not override subsequent variant', async () => {
    const [variant, setVariant] = createSignal('off')
    const wrapper = render(() => (
      <motion.div
        data-testid="target"
        animate={variant()}
        initial="off"
        variants={{
          on: { opacity: 1, transition: { type: false }, transitionEnd: { display: 'flex' } },
          off: { opacity: 0.5, display: 'none', transition: { type: false } },
        }}
        style={{ display: 'none' }}
      />
    ))
    const element = wrapper.getByTestId('target')
    await nextFrame()

    setVariant('on')
    setVariant('off')

    await nextFrame()
    await nextFrame()
    expectStyle(element, 'display: none')
  })
})
