import { cleanup, fireEvent, render } from '@solidjs/testing-library'
import { motionValue } from 'motion-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSignal } from 'solid-js'
import { Motion, motion } from '@/components'
import {
  drag,
  nextFrame,
  pointerDown,
  pointerEnter,
  pointerLeave,
  pointerUp,
} from './drag-test-utils'

afterEach(() => {
  cleanup()
})

describe('press gesture', () => {
  // The auto-tabindex injection happens in `create-motion.ts#getAttrs`
  // at initial-render time, so it lands before motion-dom's press feature
  // would otherwise set it live — the test no longer depends on the
  // happy-dom-blocked `isHTMLElement` path inside motion-dom.
  it('adds tabindex=0 when whileTap is set', () => {
    const wrapper = render(() => <Motion data-testid="motion" whileTap={{ scale: 0.9 }} />)

    const motion = wrapper.getByTestId('motion')
    expect(motion.tabIndex).toBe(0)
  })

  it('does not add tabindex when whileTap is not set', () => {
    const wrapper = render(() => <Motion data-testid="motion" />)

    expect(wrapper.getByTestId('motion').tabIndex).toBe(-1)
  })
})

// Ported from motion/react: packages/framer-motion/src/gestures/__tests__/press.test.tsx
// React-isms translated to Solid:
//  - `rerender(<Component/>)` (used to force a commit so the gesture effect
//    runs) is dropped; Solid wires the feature on mount, so we just await a
//    frame after render.
//  - `useState` → `createSignal`.
//  - `fireEvent.{focus,blur,keyDown,keyUp}` come from @solidjs/testing-library.
//  - `MockDrag`/`drag` from upstream → our `drag()` helper (coordinates are
//    encoded directly on the dispatched PointerEvent rather than via
//    MotionConfig.transformPagePoint, which we don't expose).
describe('press', () => {
  it('press event listeners fire', async () => {
    const press = vi.fn()
    const wrapper = render(() => <motion.div onTap={() => press()} />)
    await nextFrame()

    pointerDown(wrapper.container.firstChild as Element)
    pointerUp(wrapper.container.firstChild as Element)
    await nextFrame()

    expect(press).toBeCalledTimes(1)
  })

  it("press event listeners don't fire if element is disabled", async () => {
    const press = vi.fn()
    const wrapper = render(() => <motion.button disabled onTap={() => press()} />)
    await nextFrame()

    pointerDown(wrapper.container.firstChild as Element)
    pointerUp(wrapper.container.firstChild as Element)
    await nextFrame()

    expect(press).toBeCalledTimes(0)
  })

  it('global press event listeners fire', async () => {
    const press = vi.fn()
    const wrapper = render(() => (
      <>
        <div data-testid="target" />
        <motion.div globalTapTarget onTap={() => press()} />
      </>
    ))
    await nextFrame()

    pointerDown(wrapper.getByTestId('target') as Element)
    pointerUp(wrapper.getByTestId('target') as Element)
    await nextFrame()

    expect(press).toBeCalledTimes(1)
  })

  it('press event listeners fire via keyboard', async () => {
    const press = vi.fn()
    const pressStart = vi.fn()
    const pressCancel = vi.fn()
    const wrapper = render(() => (
      <motion.div onTapStart={pressStart} onTap={press} onTapCancel={pressCancel} />
    ))
    await nextFrame()

    fireEvent.focus(wrapper.container.firstChild as Element)
    fireEvent.keyDown(wrapper.container.firstChild as Element, { key: 'Enter' })
    await nextFrame()

    expect(pressStart).toBeCalledTimes(1)

    fireEvent.keyUp(wrapper.container.firstChild as Element, { key: 'Enter' })
    await nextFrame()

    expect(pressStart).toBeCalledTimes(1)
    expect(press).toBeCalledTimes(1)
    expect(pressCancel).toBeCalledTimes(0)
  })

  it('press cancel event listeners fire via keyboard', async () => {
    const press = vi.fn()
    const pressStart = vi.fn()
    const pressCancel = vi.fn()
    const wrapper = render(() => (
      <motion.div onTapStart={pressStart} onTap={press} onTapCancel={pressCancel} />
    ))
    await nextFrame()

    fireEvent.focus(wrapper.container.firstChild as Element)
    fireEvent.keyDown(wrapper.container.firstChild as Element, { key: 'Enter' })
    await nextFrame()

    expect(pressStart).toBeCalledTimes(1)

    fireEvent.blur(wrapper.container.firstChild as Element)
    await nextFrame()

    expect(pressStart).toBeCalledTimes(1)
    expect(press).toBeCalledTimes(0)
    expect(pressCancel).toBeCalledTimes(1)
  })

  it('press cancel event listeners not fired via keyboard after keyUp', async () => {
    const press = vi.fn()
    const pressStart = vi.fn()
    const pressCancel = vi.fn()
    const wrapper = render(() => (
      <motion.div onTapStart={pressStart} onTap={press} onTapCancel={pressCancel} />
    ))
    await nextFrame()

    fireEvent.focus(wrapper.container.firstChild as Element)
    fireEvent.keyDown(wrapper.container.firstChild as Element, { key: 'Enter' })
    fireEvent.keyUp(wrapper.container.firstChild as Element, { key: 'Enter' })
    await nextFrame()

    expect(pressStart).toBeCalledTimes(1)

    fireEvent.blur(wrapper.container.firstChild as Element)
    await nextFrame()

    expect(press).toBeCalledTimes(1)
    expect(pressStart).toBeCalledTimes(1)
    expect(pressCancel).toBeCalledTimes(0)
  })

  it('press event listeners are cleaned up', async () => {
    const press = vi.fn()
    const [hasTap, setHasTap] = createSignal(true)
    const wrapper = render(() => <motion.div onTap={hasTap() ? () => press() : undefined} />)
    await nextFrame()

    pointerDown(wrapper.container.firstChild as Element)
    pointerUp(wrapper.container.firstChild as Element)
    await nextFrame()
    expect(press).toBeCalledTimes(1)

    setHasTap(false)
    await nextFrame()

    pointerDown(wrapper.container.firstChild as Element)
    pointerUp(wrapper.container.firstChild as Element)
    await nextFrame()
    expect(press).toBeCalledTimes(1)
  })

  it('onTapCancel is correctly removed from a component', async () => {
    const cancelA = vi.fn()
    const wrapper = render(() => (
      <>
        <motion.div data-testid="a" onTap={() => {}} onTapCancel={cancelA} />
        <motion.div data-testid="b" onTap={() => {}} />
      </>
    ))
    await nextFrame()

    const a = wrapper.getByTestId('a')
    const b = wrapper.getByTestId('b')

    pointerDown(a)
    pointerUp(a)
    await nextFrame()

    expect(cancelA).not.toHaveBeenCalled()

    pointerDown(b)
    pointerUp(b)
    await nextFrame()
    expect(cancelA).not.toHaveBeenCalled()
  })

  it('press event listeners fire if triggered by child', async () => {
    const press = vi.fn()
    const wrapper = render(() => (
      <motion.div onTap={() => press()}>
        <motion.div data-testid="child" />
      </motion.div>
    ))
    await nextFrame()

    pointerDown(wrapper.getByTestId('child'))
    pointerUp(wrapper.getByTestId('child'))
    await nextFrame()

    expect(press).toBeCalledTimes(1)
  })

  it('press event listeners fire if triggered by child and released on bound element', async () => {
    const press = vi.fn()
    const wrapper = render(() => (
      <motion.div onTap={() => press()}>
        <motion.div data-testid="child" />
      </motion.div>
    ))
    await nextFrame()

    pointerDown(wrapper.getByTestId('child'))
    pointerUp(wrapper.container.firstChild as Element)
    await nextFrame()

    expect(press).toBeCalledTimes(1)
  })

  it('press event listeners fire if triggered by bound element and released on child', async () => {
    const press = vi.fn()
    const wrapper = render(() => (
      <motion.div onTap={() => press()}>
        <motion.div data-testid="child" />
      </motion.div>
    ))
    await nextFrame()

    pointerDown(wrapper.container.firstChild as Element)
    pointerUp(wrapper.getByTestId('child'))
    await nextFrame()

    expect(press).toBeCalledTimes(1)
  })

  it('press cancel fires if press released outside element', async () => {
    const pressCancel = vi.fn()
    const wrapper = render(() => (
      <motion.div>
        <motion.div onTapCancel={() => pressCancel()} data-testid="child" />
      </motion.div>
    ))
    await nextFrame()

    pointerDown(wrapper.getByTestId('child'))
    pointerUp(wrapper.container.firstChild as Element)
    await nextFrame()

    expect(pressCancel).toBeCalledTimes(1)
  })

  it("press event listeners doesn't fire if parent is being dragged", async () => {
    const press = vi.fn()
    const wrapper = render(() => (
      <motion.div drag>
        <motion.div data-testid="pressTarget" onTap={() => press()} />
      </motion.div>
    ))
    await nextFrame()

    const pointer = await drag(wrapper.getByTestId('pressTarget')).to(1, 1)
    await pointer.to(10, 10)
    pointer.end()

    await nextFrame()
    expect(press).toBeCalledTimes(0)
  })

  it('press event listeners do fire if parent is being dragged only a little bit', async () => {
    const press = vi.fn()
    const wrapper = render(() => (
      <motion.div drag>
        <motion.div data-testid="pressTarget" onTap={() => press()} />
      </motion.div>
    ))
    await nextFrame()

    // Sub-threshold move, then release on the element. Upstream's MockDrag
    // routes pointerup through transformPagePoint so the press sees the bound
    // element as the up-target; our `drag().end()` releases on `window`, which
    // motion-dom's `isNodeOrChild` success check rejects — so release on the
    // element directly to mirror upstream's effective behaviour.
    await drag(wrapper.getByTestId('pressTarget')).to(0.5, 0.5)
    pointerUp(wrapper.getByTestId('pressTarget'), 0.5, 0.5)
    await nextFrame()

    expect(press).toBeCalledTimes(1)
  })

  it('press event listeners do fire after drag gesture on parent element', async () => {
    const press = vi.fn()
    const wrapper = render(() => (
      <motion.div drag data-testid="parent">
        <motion.div onTap={() => press()} data-testid="child" />
      </motion.div>
    ))
    await nextFrame()

    const childElement = wrapper.getByTestId('child')
    const parentElement = wrapper.getByTestId('parent')
    const pointer = await drag(parentElement, childElement).to(100, 100)
    pointer.end()
    await nextFrame()

    pointerDown(childElement)
    pointerUp(childElement)
    await nextFrame()

    expect(press).toBeCalledTimes(1)
  })

  it('press event listeners unset', async () => {
    const press = vi.fn()
    const wrapper = render(() => <motion.div onTap={() => press()} />)
    await nextFrame()

    pointerDown(wrapper.container.firstChild as Element)
    pointerUp(wrapper.container.firstChild as Element)

    pointerDown(wrapper.container.firstChild as Element)
    pointerUp(wrapper.container.firstChild as Element)

    pointerDown(wrapper.container.firstChild as Element)
    pointerUp(wrapper.container.firstChild as Element)
    await nextFrame()

    expect(press).toBeCalledTimes(3)
  })

  it('press gesture variant applies and unapplies', async () => {
    const opacityHistory: number[] = []
    const opacity = motionValue(0.5)
    const logOpacity = () => opacityHistory.push(opacity.get())
    const wrapper = render(() => (
      <motion.div
        initial={{ opacity: 0.5 }}
        transition={{ type: false }}
        whileTap={{ opacity: 1 }}
        style={{ opacity }}
      />
    ))
    await nextFrame()
    logOpacity() // 0.5

    pointerDown(wrapper.container.firstChild as Element)
    await nextFrame()
    logOpacity() // 1

    pointerUp(wrapper.container.firstChild as Element)
    await nextFrame()
    logOpacity() // 0.5

    expect(opacityHistory).toEqual([0.5, 1, 0.5])
  })

  it('press gesture variant applies and unapplies via keyboard', async () => {
    const opacityHistory: number[] = []
    const opacity = motionValue(0.5)
    const logOpacity = () => opacityHistory.push(opacity.get())
    const wrapper = render(() => (
      <motion.div
        initial={{ opacity: 0.5 }}
        transition={{ type: false }}
        whileTap={{ opacity: 1 }}
        style={{ opacity }}
      />
    ))
    await nextFrame()
    logOpacity() // 0.5

    fireEvent.focus(wrapper.container.firstChild as Element)
    fireEvent.keyDown(wrapper.container.firstChild as Element, { key: 'Enter' })
    await nextFrame()
    logOpacity() // 1

    fireEvent.keyUp(wrapper.container.firstChild as Element, { key: 'Enter' })
    await nextFrame()
    logOpacity() // 0.5

    expect(opacityHistory).toEqual([0.5, 1, 0.5])
  })

  it('press gesture variant applies and unapplies via blur cancel', async () => {
    const opacityHistory: number[] = []
    const opacity = motionValue(0.5)
    const logOpacity = () => opacityHistory.push(opacity.get())
    const wrapper = render(() => (
      <motion.div
        initial={{ opacity: 0.5 }}
        transition={{ type: false }}
        whileTap={{ opacity: 1 }}
        style={{ opacity }}
      />
    ))
    await nextFrame()
    logOpacity() // 0.5

    fireEvent.focus(wrapper.container.firstChild as Element)
    fireEvent.keyDown(wrapper.container.firstChild as Element, { key: 'Enter' })
    await nextFrame()
    logOpacity() // 1

    fireEvent.blur(wrapper.container.firstChild as Element)
    await nextFrame()
    logOpacity() // 0.5

    expect(opacityHistory).toEqual([0.5, 1, 0.5])
  })

  it('press gesture variant unapplies children', async () => {
    const opacityHistory: number[] = []
    const opacity = motionValue(0.5)
    const logOpacity = () => opacityHistory.push(opacity.get())
    const wrapper = render(() => (
      <motion.div whileTap="pressed">
        <motion.div
          data-testid="child"
          variants={{ pressed: { opacity: 1 } }}
          style={{ opacity }}
          transition={{ type: false }}
        />
      </motion.div>
    ))
    await nextFrame()
    logOpacity() // 0.5

    pointerDown(wrapper.getByTestId('child') as Element)
    await nextFrame()
    logOpacity() // 1

    pointerUp(wrapper.getByTestId('child') as Element)
    await nextFrame()
    logOpacity() // 0.5

    expect(opacityHistory).toEqual([0.5, 1, 0.5])
  })

  it('press gesture on children returns to parent-defined variant', async () => {
    const opacityHistory: number[] = []
    const opacity = motionValue(0.5)
    const logOpacity = () => opacityHistory.push(opacity.get())
    const wrapper = render(() => (
      <motion.div animate="visible" initial="hidden">
        <motion.div
          data-testid="child"
          variants={{ visible: { opacity: 1 }, hidden: { opacity: 0 } }}
          style={{ opacity }}
          transition={{ type: false }}
          whileTap={{ opacity: 0.5 }}
        />
      </motion.div>
    ))
    await nextFrame()
    logOpacity() // 1

    pointerDown(wrapper.getByTestId('child') as Element)
    await nextFrame()
    logOpacity() // 0.5

    pointerUp(wrapper.getByTestId('child') as Element)
    await nextFrame()
    logOpacity() // 1

    expect(opacityHistory).toEqual([1, 0.5, 1])
  })

  it('press gesture works with animation state', async () => {
    const aOpacity = motionValue(0.5)
    const bOpacity = motionValue(0.5)
    const childProps = {
      variants: {
        rest: { opacity: 0.5 },
        pressed: { opacity: 0.8 },
      },
      transition: { duration: 0.01 },
    }

    function Component() {
      const [isPressed, setPressedState] = createSignal(false)
      return (
        <motion.div data-testid="parent" animate={isPressed() ? ['pressed'] : ['rest']}>
          <motion.div
            data-testid="a"
            {...childProps}
            style={{ opacity: aOpacity }}
            onTapStart={() => setPressedState(true)}
          />
          <motion.div data-testid="b" {...childProps} style={{ opacity: bOpacity }} />
        </motion.div>
      )
    }

    const wrapper = render(() => <Component />)
    await nextFrame()

    pointerDown(wrapper.getByTestId('a') as Element)
    await new Promise((resolve) => setTimeout(resolve, 200))

    expect(aOpacity.get()).toBe(0.8)
    expect(bOpacity.get()).toBe(0.8)
  })

  it('press gesture variant applies and unapplies with whileHover', async () => {
    const opacityHistory: number[] = []
    const opacity = motionValue(0.5)
    const logOpacity = () => opacityHistory.push(opacity.get())
    const wrapper = render(() => (
      <motion.div
        initial={{ opacity: 0.5 }}
        transition={{ type: false }}
        whileHover={{ opacity: 0.75 }}
        whileTap={{ opacity: 1 }}
        style={{ opacity }}
      />
    ))
    await nextFrame()
    logOpacity() // 0.5

    pointerEnter(wrapper.container.firstChild as Element)
    await nextFrame()
    logOpacity() // 0.75

    pointerDown(wrapper.container.firstChild as Element)
    await nextFrame()
    logOpacity() // 1

    pointerUp(wrapper.container.firstChild as Element)
    await nextFrame()
    logOpacity() // 0.75

    pointerLeave(wrapper.container.firstChild as Element)
    await nextFrame()
    logOpacity() // 0.5

    pointerEnter(wrapper.container.firstChild as Element)
    await nextFrame()
    logOpacity() // 0.75

    pointerDown(wrapper.container.firstChild as Element)
    await nextFrame()
    logOpacity() // 1

    pointerLeave(wrapper.container.firstChild as Element)
    await nextFrame()
    logOpacity() // 1 (still pressed)

    pointerUp(wrapper.container.firstChild as Element)
    await nextFrame()
    logOpacity() // 0.5

    expect(opacityHistory).toEqual([0.5, 0.75, 1, 0.75, 0.5, 0.75, 1, 1, 0.5])
  })

  it('press gesture variant applies and unapplies as state changes', async () => {
    const opacityHistory: number[] = []
    const opacity = motionValue(0.5)
    const logOpacity = () => opacityHistory.push(opacity.get())
    const [isActive, setIsActive] = createSignal(false)
    const wrapper = render(() => (
      <motion.div
        initial={{ opacity: isActive() ? 1 : 0.5 }}
        animate={{ opacity: isActive() ? 1 : 0.5 }}
        whileHover={{ opacity: isActive() ? 1 : 0.75 }}
        whileTap={{ opacity: 1 }}
        transition={{ type: false }}
        style={{ opacity }}
      />
    ))
    await nextFrame()
    logOpacity() // 0.5

    pointerEnter(wrapper.container.firstChild as Element)
    await nextFrame()
    logOpacity() // 0.75

    pointerDown(wrapper.container.firstChild as Element)
    await nextFrame()
    logOpacity() // 1
    setIsActive(true)
    await nextFrame()

    pointerUp(wrapper.container.firstChild as Element)
    await nextFrame()
    logOpacity() // 1

    pointerLeave(wrapper.container.firstChild as Element)
    await nextFrame()
    logOpacity() // 1

    pointerEnter(wrapper.container.firstChild as Element)
    await nextFrame()
    logOpacity() // 1

    pointerDown(wrapper.container.firstChild as Element)
    await nextFrame()
    logOpacity() // 1

    pointerLeave(wrapper.container.firstChild as Element)
    await nextFrame()
    logOpacity() // 1

    pointerUp(wrapper.container.firstChild as Element)
    await nextFrame()
    logOpacity() // 1

    expect(opacityHistory).toEqual([0.5, 0.75, 1, 1, 1, 1, 1, 1, 1])
  })

  it('propagate={{ tap: false }} prevents parent onTap from firing', async () => {
    const parentTap = vi.fn()
    const childTap = vi.fn()
    const wrapper = render(() => (
      <motion.div onTap={() => parentTap()}>
        <motion.div data-testid="child" onTap={() => childTap()} propagate={{ tap: false }} />
      </motion.div>
    ))
    await nextFrame()

    pointerDown(wrapper.getByTestId('child'))
    pointerUp(wrapper.getByTestId('child'))
    await nextFrame()

    expect(childTap).toBeCalledTimes(1)
    expect(parentTap).toBeCalledTimes(0)
  })

  it('without propagate both parent and child onTap fire', async () => {
    const parentTap = vi.fn()
    const childTap = vi.fn()
    const wrapper = render(() => (
      <motion.div onTap={() => parentTap()}>
        <motion.div data-testid="child" onTap={() => childTap()} />
      </motion.div>
    ))
    await nextFrame()

    pointerDown(wrapper.getByTestId('child'))
    pointerUp(wrapper.getByTestId('child'))
    await nextFrame()

    expect(childTap).toBeCalledTimes(1)
    expect(parentTap).toBeCalledTimes(1)
  })

  it('propagate={{ tap: false }} isolates whileTap to child only', async () => {
    const parentOpacityHistory: number[] = []
    const childOpacityHistory: number[] = []
    const parentOpacity = motionValue(0.5)
    const childOpacity = motionValue(0.5)
    const logOpacities = () => {
      parentOpacityHistory.push(parentOpacity.get())
      childOpacityHistory.push(childOpacity.get())
    }
    const wrapper = render(() => (
      <motion.div
        initial={{ opacity: 0.5 }}
        transition={{ type: false }}
        whileTap={{ opacity: 1 }}
        style={{ opacity: parentOpacity }}
      >
        <motion.div
          data-testid="child"
          initial={{ opacity: 0.5 }}
          transition={{ type: false }}
          whileTap={{ opacity: 1 }}
          style={{ opacity: childOpacity }}
          propagate={{ tap: false }}
        />
      </motion.div>
    ))
    await nextFrame()
    logOpacities() // both 0.5

    pointerDown(wrapper.getByTestId('child'))
    await nextFrame()
    logOpacities() // child 1, parent 0.5

    pointerUp(wrapper.getByTestId('child'))
    await nextFrame()
    logOpacities() // both 0.5

    expect(parentOpacityHistory).toEqual([0.5, 0.5, 0.5])
    expect(childOpacityHistory).toEqual([0.5, 1, 0.5])
  })

  it('propagate={{ tap: false }} prevents all ancestor onTap handlers (three levels)', async () => {
    const grandparentTap = vi.fn()
    const parentTap = vi.fn()
    const childTap = vi.fn()
    const wrapper = render(() => (
      <motion.div onTap={() => grandparentTap()}>
        <motion.div onTap={() => parentTap()}>
          <motion.div data-testid="child" onTap={() => childTap()} propagate={{ tap: false }} />
        </motion.div>
      </motion.div>
    ))
    await nextFrame()

    pointerDown(wrapper.getByTestId('child'))
    pointerUp(wrapper.getByTestId('child'))
    await nextFrame()

    expect(childTap).toBeCalledTimes(1)
    expect(parentTap).toBeCalledTimes(0)
    expect(grandparentTap).toBeCalledTimes(0)
  })

  it('ignore press event when button is disabled', async () => {
    const press = vi.fn()
    const wrapper = render(() => <motion.button onTap={() => press()} disabled />)
    await nextFrame()

    pointerDown(wrapper.container.firstChild as Element)
    pointerUp(wrapper.container.firstChild as Element)
    await nextFrame()

    expect(press).toBeCalledTimes(0)
  })
})
