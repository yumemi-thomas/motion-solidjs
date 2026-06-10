import { cleanup, render } from '@solidjs/testing-library'
import { motionValue } from 'motion-dom'
import { createSignal, Show } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { AnimatePresence, motion } from '@/components'
import { wait } from './helpers'

afterEach(() => cleanup())

function getHTMLElement(id: string): HTMLElement {
  const element = document.getElementById(id)
  if (!(element instanceof HTMLElement)) throw new Error(`Expected HTMLElement #${id}`)
  return element
}

function expectBox(
  element: HTMLElement,
  expected: { top: number; left: number; width: number; height: number },
  tolerance = 2,
) {
  const box = element.getBoundingClientRect()
  expect(Math.abs(box.top - expected.top)).toBeLessThanOrEqual(tolerance)
  expect(Math.abs(box.left - expected.left)).toBeLessThanOrEqual(tolerance)
  expect(Math.abs(box.width - expected.width)).toBeLessThanOrEqual(tolerance)
  expect(Math.abs(box.height - expected.height)).toBeLessThanOrEqual(tolerance)
}

// Ports of layout fixtures + cypress assertions from github.com/motiondivision/motion.
// Cypress specs live in motion-upstream/packages/framer-motion/cypress/integration/layout.ts;
// React fixtures live under motion-upstream/dev/react/src/tests/.
describe('Layout additional upstream parity', () => {
  // Fixture: motion-upstream/dev/react/src/tests/layout-dependency.tsx (?test=layout-dependency).
  // Assertion: layout.ts it("Doesn't initiate a new animation if layoutDependency hasn't changed").
  it('layoutDependency prevents layout animation when unchanged', async () => {
    const [state, setState] = createSignal(true)
    const backgroundColor = motionValue('red')

    render(() => (
      <motion.div
        id="box"
        layout
        layoutDependency={0}
        style={{
          position: 'absolute',
          top: state() ? '0px' : '100px',
          left: state() ? '0px' : '200px',
          width: state() ? '100px' : '300px',
          height: state() ? '200px' : '300px',
          'background-color': backgroundColor,
        }}
        transition={{ duration: 0.15, ease: () => 0.5 }}
        onLayoutAnimationComplete={() => backgroundColor.set('blue')}
      />
    ))

    await wait(50)
    setState(false)
    await wait(50)
    expectBox(getHTMLElement('box'), { top: 100, left: 200, width: 300, height: 300 })
    expect(backgroundColor.get()).toBe('red')
  })

  // Fixture: motion-upstream/dev/react/src/tests/layout-dependency-child.tsx (?test=layout-dependency-child).
  // Assertion: layout.ts it("Exiting children correctly animate when layoutDependency changes") —
  // when the child exits AND layoutDependency bumps in the same click, the exiting child's
  // bounding box must stay put (it must not jump/relayout as the parent resizes).
  it('exiting child keeps its box when layoutDependency changes', async () => {
    const duration = 10
    const commonVariant = {
      position: 'absolute',
      boxSizing: 'border-box',
      left: 25,
      width: 100,
      height: 25,
      backgroundColor: 'blue',
    } as const
    const variants = {
      visible: { opacity: 1, ...commonVariant },
      hidden: { opacity: 0, ...commonVariant },
    }
    const outerBase = {
      top: '10px',
      left: '10px',
      position: 'absolute' as const,
      'background-color': 'red',
      overflow: 'visible' as const,
    }

    const [divState, setDivState] = createSignal(false)
    const [animating, setAnimating] = createSignal(false)
    const [transitionId, setTransitionId] = createSignal(0)
    const layoutDependency = () => (animating() ? transitionId() : -1)

    const wrapper = render(() => (
      <>
        <motion.div
          layout
          layoutDependency={layoutDependency()}
          onAnimationComplete={() => setAnimating(false)}
          style={
            divState()
              ? { ...outerBase, width: '100px', height: '75px' }
              : { ...outerBase, width: '200px', height: '100px' }
          }
          transition={{ duration, ease: () => 0.5 }}
        >
          <AnimatePresence>
            <Show when={!divState()}>
              <motion.div
                id="child"
                layout
                layoutDependency={layoutDependency()}
                variants={variants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ duration, ease: () => 0.5, repeatDelay: 0.001 }}
              />
            </Show>
          </AnimatePresence>
        </motion.div>
        <button
          data-testid="animate"
          onClick={() => {
            setDivState(!divState())
            setTransitionId(transitionId() + 1)
            setAnimating(true)
          }}
        >
          Animate
        </button>
      </>
    ))

    await wait(50)
    const initial = getHTMLElement('child').getBoundingClientRect()
    // Same-click state change: remove the child (exit) AND bump layoutDependency.
    wrapper.getByTestId('animate').click()
    await wait(100)
    const after = getHTMLElement('child').getBoundingClientRect()
    // Upstream (layout.ts:179) asserts exact equality. The Solid port applies a
    // near-identity projection transform that introduces a ~1e-5px float artifact
    // (e.g. left 35 → 34.999996), so we assert sub-pixel stability instead of bit-exact.
    expect(Math.abs(after.top - initial.top)).toBeLessThan(0.001)
    expect(Math.abs(after.left - initial.left)).toBeLessThan(0.001)
    expect(Math.abs(after.width - initial.width)).toBeLessThan(0.001)
    expect(Math.abs(after.height - initial.height)).toBeLessThan(0.001)
  })

  // Fixture: motion-upstream/dev/react/src/tests/layout-relative-target-change.tsx.
  // (Fixture has no driving cypress spec; cf. layout-relative-delay.ts / layout-relative-drag.ts.)
  it('relative target changes are projected through a transformed parent', async () => {
    const [parentMoved, setParentMoved] = createSignal(false)
    const [inset, setInset] = createSignal(false)

    render(() => (
      <motion.div style={{ width: '400px', height: '400px', position: 'relative' }}>
        <motion.div
          id="parent"
          layout
          style={{
            position: 'absolute',
            width: '200px',
            height: '200px',
            left: parentMoved() ? '100%' : '0px',
            top: '50%',
            background: 'green',
          }}
          transformTemplate={(_, generated) => `translateY(-50%) ${generated}`}
          transition={{ duration: 5, ease: () => 0.5 }}
        >
          <motion.div
            id="box"
            layout
            style={{
              position: 'absolute',
              background: 'red',
              inset: inset() ? '-20px' : '0px',
            }}
            transition={{ duration: 1, ease: () => 0.5 }}
          />
        </motion.div>
      </motion.div>
    ))

    await wait(50)
    setParentMoved(true)
    setInset(true)
    await wait(100)
    const parent = getHTMLElement('parent').getBoundingClientRect()
    const box = getHTMLElement('box').getBoundingClientRect()
    // The inset child stays centred on its (moved + translateY(-50%)) parent —
    // i.e. the relative target is correctly projected through the transform.
    const parentCenterX = parent.left + parent.width / 2
    const parentCenterY = parent.top + parent.height / 2
    const boxCenterX = box.left + box.width / 2
    const boxCenterY = box.top + box.height / 2
    expect(Math.abs(boxCenterX - parentCenterX)).toBeLessThanOrEqual(5)
    expect(Math.abs(boxCenterY - parentCenterY)).toBeLessThanOrEqual(5)
  })

  // Fixture: motion-upstream/dev/react/src/tests/layout-scaled-child-in-transformed-parent.tsx
  // (?test=layout-scaled-child-in-transformed-parent).
  // Assertion: layout.ts it("Has a correct bounding box when a transform is applied").
  it('scaled child in transformed parent measures from the correct box', async () => {
    const [shifted, setShifted] = createSignal(false)

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
              layout
              style={{
                position: 'absolute',
                inset: '0px',
                left: shifted() ? '50px' : '0px',
                background: 'red',
              }}
              transition={{ duration: 0.2, ease: () => 0.5 }}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    ))

    await wait(50)
    setShifted(true)
    await wait(50)
    const box = getHTMLElement('box').getBoundingClientRect()
    expect(box.left).toBeGreaterThan(200)
    expect(box.width).toBeLessThanOrEqual(100)
  })
})
