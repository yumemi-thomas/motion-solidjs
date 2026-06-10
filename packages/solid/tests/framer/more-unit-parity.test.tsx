import { cleanup, render } from '@solidjs/testing-library'
import { buildHTMLStyles, motionValue, visualElementStore } from 'motion-dom'
import type { HTMLRenderState } from 'motion-dom'
import { createRoot, createSignal, onMount } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { Motion, motion } from '@/components'
import { mountedStates } from '@/core/create-motion'
import { createTransform } from '@/primitives/create-transform'
import { createMotionTemplate, createMotionValueEvent, createSpring } from '@/primitives'
import { createInView } from '@/primitives/create-in-view'
import { wait } from '../browser/helpers'

afterEach(() => cleanup())

function getHTMLElement(id: string): HTMLElement {
  const element = document.getElementById(id)
  if (!(element instanceof HTMLElement)) throw new Error(`Expected HTMLElement #${id}`)
  return element
}

function expectRef<T>(value: T | undefined, name: string): T {
  if (!value) throw new Error(`Expected ${name}`)
  return value
}

function createHTMLRenderState(): HTMLRenderState {
  return {
    transform: {},
    transformOrigin: {},
    style: {},
    vars: {},
  }
}

// Solid primitives map to upstream React hooks (create* == use*). Upstream unit tests from
// github.com/motiondivision/motion, paths relative to motion-upstream/.
describe('additional framer source-unit parity', () => {
  // packages/framer-motion/src/render/html/utils/__tests__/build-styles.test.ts
  // describe("buildHTMLStyles") (impl: packages/motion-dom/src/render/html/utils/build-styles.ts).
  it('buildHTMLStyles applies transform and transform origin values', () => {
    const state = createHTMLRenderState()
    buildHTMLStyles(state, { x: 10, originX: 0, originY: 1 })
    expect(state.style.transform).toBe('translateX(10px)')
    expect(state.style.transformOrigin).toBe('0% 100% 0')
  })

  // packages/framer-motion/src/motion/__tests__/unmount-motion-value.test.tsx
  // describe("motion value lifecycle on unmount (#3315)") — isAnimating() stays true after unmount.
  it('motion value animation survives unmount until auto-stop frame', async () => {
    const [shown, setShown] = createSignal(true)
    let node: HTMLElement | undefined

    render(() => (
      <>
        {shown() ? (
          <Motion
            id="box"
            ref={(el) => (node = el)}
            animate={{ x: 100 }}
            transition={{ duration: 10, ease: 'linear' }}
          />
        ) : null}
      </>
    ))

    await wait(50)
    const element = node
    if (!element) throw new Error('Expected mounted node')
    const handle = mountedStates.get(element)
    const x = handle?.visualElement?.getValue('x')
    if (!x) throw new Error('Expected x MotionValue')
    expect(x.isAnimating()).toBe(true)
    setShown(false)
    expect(x.isAnimating()).toBe(true)
  })

  // No standalone upstream test; visualElementStore is exercised within unmount-motion-value.test.tsx.
  // Source: packages/motion-dom/src/render/store.ts (export const visualElementStore = new WeakMap()).
  it('visualElementStore tracks mounted motion elements', async () => {
    render(() => <Motion id="box" />)
    await wait(20)
    expect(visualElementStore.get(getHTMLElement('box'))).toBeDefined()
  })

  // packages/framer-motion/src/value/__tests__/use-transform.test.tsx
  // describe("as input/output range") > test("sets initial value").
  it('createTransform maps source values', async () => {
    await createRoot(async (dispose) => {
      const source = motionValue(0)
      const mapped = createTransform(source, [0, 100], [0, 1])
      source.set(50)
      await wait(20)
      expect(mapped.get()).toBe(0.5)
      dispose()
    })
  })

  // packages/framer-motion/src/value/__tests__/use-spring.test.tsx describe("useSpring with numbers")
  // > test("can create a MotionValue that responds to changes from another MotionValue").
  it('createSpring follows source values', async () => {
    await createRoot(async (dispose) => {
      const source = motionValue(0)
      const spring = createSpring(source, { stiffness: 1000, damping: 100 })
      // Retarget from onMount so the change lands after createSpring's attach effect.
      onMount(() => source.set(100))
      await wait(100)
      expect(spring.get()).toBeGreaterThan(0)
      dispose()
    })
  })

  // packages/framer-motion/src/value/__tests__/use-motion-template.test.tsx
  // describe("useMotionTemplate") > test("responds to manual setting from parent value").
  it('createMotionTemplate recomposes latest values', async () => {
    await createRoot(async (dispose) => {
      const x = motionValue(10)
      const template = createMotionTemplate`translateX(${x}px)`
      expect(template.get()).toBe('translateX(10px)')
      x.set(20)
      await wait(20)
      expect(template.get()).toBe('translateX(20px)')
      dispose()
    })
  })

  // packages/framer-motion/src/utils/__tests__/use-motion-value-event.test.tsx describe("useMotionValueEvent").
  // Upstream only type-checks the change callback; this additionally asserts it fires with the new value.
  it('createMotionValueEvent observes changes', () => {
    const value = motionValue(0)
    const calls: number[] = []
    render(() => {
      createMotionValueEvent(value, 'change', (latest) => calls.push(latest))
      return null
    })
    value.set(1)
    expect(calls).toEqual([1])
  })

  // packages/framer-motion/src/utils/__tests__/use-in-view.test.tsx
  // describe("useInView") > test("Can change initial value").
  it('createInView supports an initial true value', async () => {
    let ref: HTMLDivElement | undefined
    render(() => {
      const inView = createInView(() => expectRef(ref, 'box'), { initial: true })
      return (
        <>
          <div id="box" ref={(el) => (ref = el)} style={{ width: '100px', height: '100px' }} />
          <span id="value">{inView() ? 'true' : 'false'}</span>
        </>
      )
    })

    await wait(100)
    expect(getHTMLElement('value').textContent).toBe('true')
  })

  // Closest: packages/framer-motion/src/components/utils/__tests__/tag-proxy.test.tsx
  // describe("tagProxy") (asserts custom tagName); motion.create(string) itself is exercised in
  // packages/framer-motion/src/motion/__tests__/create-component.test.tsx (no custom-tag assertion).
  it('motion component creates custom tags', () => {
    const Custom = motion.create('section')
    const wrapper = render(() => <Custom data-testid="custom" />)
    expect(wrapper.getByTestId('custom').tagName).toBe('SECTION')
  })
})
