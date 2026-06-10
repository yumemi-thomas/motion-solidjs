import { cleanup, render } from '@solidjs/testing-library'
import { createEffect, createSignal, on } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { motionValue } from 'motion-dom'
import { motion } from '@/components'
import { wait } from './helpers'

afterEach(() => cleanup())

// Port of motion-upstream/packages/framer-motion/cypress/integration/layout.ts
// — the `Layout animation` describe block. Each `it` here is a 1:1 port of
// the matching upstream cypress test. Fixtures live in
// motion-upstream/dev/react/src/tests/layout*.tsx and were inlined into each
// test body so the Solid port stays self-contained.
function expectBboxClose(
  el: HTMLElement,
  expected: { top: number; left: number; width: number; height: number },
  tolerance = 2,
) {
  const bbox = el.getBoundingClientRect()
  expect(Math.abs(bbox.top - expected.top)).toBeLessThanOrEqual(tolerance)
  expect(Math.abs(bbox.left - expected.left)).toBeLessThanOrEqual(tolerance)
  expect(Math.abs(bbox.width - expected.width)).toBeLessThanOrEqual(tolerance)
  expect(Math.abs(bbox.height - expected.height)).toBeLessThanOrEqual(tolerance)
}

const baseBox = { position: 'absolute', top: 0, left: 0, background: 'red' } as const
const a = { ...baseBox, width: '100px', height: '200px' }
const b = { ...baseBox, top: '100px', left: '200px', width: '300px', height: '300px' }

describe('Layout animation', () => {
  it('fires layout={true} animations and onLayoutAnimationStart/Complete', async () => {
    const [state, setState] = createSignal(true)
    const backgroundColor = motionValue('red')

    render(() => (
      <motion.div
        id="box"
        data-testid="box"
        layout
        style={{ ...(state() ? a : b), 'background-color': backgroundColor }}
        onClick={() => setState(!state())}
        transition={{ duration: 0.5, ease: () => 0.5 }}
        onLayoutAnimationStart={() => backgroundColor.set('green')}
        onLayoutAnimationComplete={() => backgroundColor.set('blue')}
      />
    ))

    await wait(50)
    const box = document.getElementById('box') as HTMLElement
    expectBboxClose(box, { top: 0, left: 0, width: 100, height: 200 })

    box.click()
    await wait(50)
    // Solid port's layout-projection should fire start hook —
    // bg becomes green.
    expect(box.style.backgroundColor).toBe('green')

    await wait(50)
    // ease: () => 0.5 holds at 50% — midway bbox.
    expectBboxClose(box, { top: 50, left: 100, width: 200, height: 250 })

    // Animation is `duration: 0.5`; 600ms = full duration + buffer for
    // onLayoutAnimationComplete to fire.
    await wait(600)
    // onLayoutAnimationComplete should fire after duration —
    // bg becomes blue.
    expect(box.style.backgroundColor).toBe('blue')
  })

  it('fires layout="position" animations', async () => {
    const [state, setState] = createSignal(true)

    render(() => (
      <motion.div
        id="box"
        data-testid="box"
        layout="position"
        style={state() ? a : b}
        onClick={() => setState(!state())}
        transition={{ duration: 0.5, ease: () => 0.5 }}
      />
    ))

    await wait(50)
    const box = document.getElementById('box') as HTMLElement
    expectBboxClose(box, { top: 0, left: 0, width: 100, height: 200 })

    box.click()
    await wait(50)
    // Size jumps to final, position is mid-tween.
    expectBboxClose(box, { top: 50, left: 100, width: 300, height: 300 })
  })

  it('fires layout="size" animations', async () => {
    const [state, setState] = createSignal(true)

    render(() => (
      <motion.div
        id="box"
        data-testid="box"
        layout="size"
        style={state() ? a : b}
        onClick={() => setState(!state())}
        transition={{ duration: 0.5, ease: () => 0.5 }}
      />
    ))

    await wait(50)
    const box = document.getElementById('box') as HTMLElement
    expectBboxClose(box, { top: 0, left: 0, width: 100, height: 200 })

    box.click()
    await wait(100)
    // Position jumps to final (100, 200), size is mid-tween.
    expectBboxClose(box, { top: 100, left: 200, width: 200, height: 250 })
  })

  it("doesn't initiate a new animation if the viewport box hasn't updated between renders", async () => {
    const [count, setCount] = createSignal(0)

    render(() => (
      <motion.div
        id="box"
        data-testid="box"
        layout
        style={count() === 0 ? a : b}
        onClick={() => setCount(count() + 1)}
        transition={{ duration: 10, ease: () => 0.5 }}
      />
    ))

    await wait(50)
    const box = document.getElementById('box') as HTMLElement
    expectBboxClose(box, { top: 0, left: 0, width: 100, height: 200 })

    box.click()
    await wait(50)
    expectBboxClose(box, { top: 50, left: 100, width: 200, height: 250 })

    // Second click — props re-render but target box is identical. The
    // ease curve always returns 0.5, so any new animation would move
    // the box. It must stay put.
    box.click()
    await wait(50)
    expectBboxClose(box, { top: 50, left: 100, width: 200, height: 250 })
  })

  it("doesn't initiate a new animation if layoutDependency hasn't changed", async () => {
    const [state, setState] = createSignal(true)
    const backgroundColor = motionValue('red')

    render(() => (
      <motion.div
        id="box"
        data-testid="box"
        layout
        layoutDependency={0}
        style={{ ...(state() ? a : b), 'background-color': backgroundColor }}
        onClick={() => setState(!state())}
        transition={{ duration: 0.15, ease: () => 0.5 }}
        onLayoutAnimationComplete={() => backgroundColor.set('blue')}
      />
    ))

    await wait(50)
    const box = document.getElementById('box') as HTMLElement
    expectBboxClose(box, { top: 0, left: 0, width: 100, height: 200 })

    // First click — layoutDependency stays 0; layout shouldn't animate.
    // The style change is applied immediately so the bbox is at the
    // target without an intermediate tween.
    box.click()
    await wait(50)
    expectBboxClose(box, { top: 100, left: 200, width: 300, height: 300 })

    // Click again, still same layoutDependency — should snap back
    // without animating.
    box.click()
    await wait(50)
    expectBboxClose(box, { top: 0, left: 0, width: 100, height: 200 })
  })

  it('has a correct bounding box when a transform is applied', async () => {
    const [hover, setHover] = createSignal(false)

    const box = {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      background: 'red',
    } as const

    render(() => (
      <motion.div style={{ width: '400px', height: '400px', position: 'relative' }}>
        <motion.div
          id="parent"
          layout
          style={{
            position: 'absolute',
            width: '100px',
            height: '100px',
            left: '50%',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          <motion.div
            id="mid"
            layout
            style={{ width: '100%', height: '100%', position: 'relative' }}
          >
            <motion.div
              id="box"
              data-testid="box"
              layout
              style={hover() ? { ...box, left: '50px' } : box}
              onClick={() => setHover(!hover())}
              transition={{ duration: 0.2, ease: () => 0.5 }}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    ))

    await wait(50)
    const boxEl = document.getElementById('box') as HTMLElement
    expectBboxClose(boxEl, { top: 150, left: 200, width: 100, height: 100 })

    boxEl.click()
    await wait(50)
    expectBboxClose(boxEl, { top: 150, left: 225, width: 75, height: 100 })
  })

  it(// Fixed in: useMotionValueChild port + projection lifecycle callbacks.
  // motion-dom's target-box equality guard was already in place; what
  // was missing was the MotionValue-as-child rendering primitive so the
  // test fixture's `<motion.pre>{renderCount}</motion.pre>` actually
  // reads the live count.
  "doesn't start a new layout animation if the target doesn't change", async () => {
    const [state, setState] = createSignal(0)
    const renderCount = motionValue(0)

    const innerA = { ...baseBox, top: '100px', left: '100px', width: '100px', height: '200px' }
    const innerB = {
      ...baseBox,
      top: '100px',
      left: '200px',
      width: '300px',
      height: '300px',
    }

    render(() => {
      // Solid version of the upstream useEffect that auto-bumps state 1→2
      // after 50ms (to trigger the "same target" re-measure). Lives inside
      // the render callback so the render's createRoot owns it.
      createEffect(
        on(
          state,
          (s) => {
            if (s === 1) setTimeout(() => setState(2), 50)
          },
          { defer: true },
        ),
      )
      return (
        <>
          <button id="update" onClick={() => setState(state() + 1)}>
            Update
          </button>
          <motion.pre id="render-count">{renderCount}</motion.pre>
          <motion.div
            style={{
              position: 'relative',
              width: '500px',
              height: state() ? '500px' : '400px',
            }}
          >
            <motion.div
              id="box"
              data-testid="box"
              layout
              style={state() ? innerB : innerA}
              transition={{ duration: 1 }}
              onLayoutAnimationStart={() => renderCount.set(renderCount.get() + 1)}
            />
          </motion.div>
        </>
      )
    })

    await wait(50)
    ;(document.getElementById('update') as HTMLButtonElement).click()
    await wait(200)
    const countEl = document.getElementById('render-count') as HTMLElement
    expect(countEl.textContent).toBe('1')
  })

  it(// Fixed in: useMotionValueChild port + projection lifecycle callbacks
  // (same root cause as the previous test).
  "doesn't start a new layout animation if the target doesn't change, even if parent starts layout animation", async () => {
    const [state, setState] = createSignal(0)
    const renderCount = motionValue(0)

    const innerA = { ...baseBox, top: '100px', left: '100px', width: '100px', height: '200px' }
    const innerB = {
      ...baseBox,
      top: '100px',
      left: '200px',
      width: '300px',
      height: '300px',
    }

    render(() => {
      createEffect(
        on(
          state,
          (s) => {
            if (s === 1) setTimeout(() => setState(2), 50)
          },
          { defer: true },
        ),
      )
      return (
        <>
          <button id="update" onClick={() => setState(state() + 1)}>
            Update
          </button>
          <motion.pre id="render-count">{renderCount}</motion.pre>
          <motion.div
            layout
            style={{
              position: 'relative',
              width: '500px',
              height: state() ? '500px' : '400px',
            }}
          >
            <motion.div
              id="box"
              data-testid="box"
              layout
              style={state() ? innerB : innerA}
              transition={{ duration: 1 }}
              onLayoutAnimationStart={() => renderCount.set(renderCount.get() + 1)}
            />
          </motion.div>
        </>
      )
    })

    await wait(50)
    ;(document.getElementById('update') as HTMLButtonElement).click()
    await wait(200)
    const countEl = document.getElementById('render-count') as HTMLElement
    expect(countEl.textContent).toBe('1')
  })

  it('fires layout="x" animations, only animating the x axis', async () => {
    const [state, setState] = createSignal(true)

    render(() => (
      <motion.div
        id="box"
        data-testid="box"
        // upstream passes type=`x`; Solid's LayoutOptions type only
        // declares 'position' | 'size' | 'preserve-aspect'. Cast so
        // the test still encodes the upstream coverage gap.
        layout={'x' as unknown as 'position'}
        style={state() ? a : b}
        onClick={() => setState(!state())}
        transition={{ duration: 0.5, ease: () => 0.5 }}
      />
    ))

    await wait(50)
    const box = document.getElementById('box') as HTMLElement
    expectBboxClose(box, { top: 0, left: 0, width: 100, height: 200 })

    box.click()
    await wait(50)
    // Only x animates → y/height jump to final, x/width tween.
    expectBboxClose(box, { top: 100, left: 100, width: 200, height: 300 })
  })

  it('fires layout="y" animations, only animating the y axis', async () => {
    const [state, setState] = createSignal(true)

    render(() => (
      <motion.div
        id="box"
        data-testid="box"
        layout={'y' as unknown as 'position'}
        style={state() ? a : b}
        onClick={() => setState(!state())}
        transition={{ duration: 0.5, ease: () => 0.5 }}
      />
    ))

    await wait(50)
    const box = document.getElementById('box') as HTMLElement
    expectBboxClose(box, { top: 0, left: 0, width: 100, height: 200 })

    box.click()
    await wait(50)
    // Only y animates → x/width jump to final, y/height tween.
    expectBboxClose(box, { top: 50, left: 200, width: 300, height: 250 })
  })
})
