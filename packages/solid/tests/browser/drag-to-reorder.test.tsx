import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, For } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { Reorder } from '@/components'
import { cyDrag, nextFrame } from '../features/gestures/drag-test-utils'
import { wait } from './helpers'

afterEach(() => {
  window.dispatchEvent(
    new PointerEvent('pointerup', {
      bubbles: true,
      isPrimary: true,
      pointerId: 1,
      pointerType: 'mouse',
    }),
  )
  cleanup()
})

// Port of motion-upstream/packages/framer-motion/cypress/integration/
// drag-to-reorder.ts. Reorder.Group + Reorder.Item with body-flex
// centering — works without layout projection because Reorder.Item
// uses `dragSnapToOrigin`, so the dragged element settles back to its
// (post-reorder) DOM-flow position with y=0.

const initialItems = ['Tomato', 'Cucumber', 'Mustard', 'Chicken']

const styles = `
body {
  width: 100vw;
  height: 100vh;
  background: #ffaa00;
  overflow: hidden;
  padding: 0;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}
ul, li {
  list-style: none;
  padding: 0;
  margin: 0;
  font-weight: 700;
  font-size: 24px;
}
ul {
  position: relative;
  width: 300px;
}
li {
  border-radius: 10px;
  margin-bottom: 10px;
  width: 100%;
  padding: 20px;
  position: relative;
  background: white;
  border-radius: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}
`

function mount(axis: 'x' | 'y' = 'y') {
  const [items, setItems] = createSignal(initialItems)
  return render(() => (
    <Reorder.Group
      axis={axis}
      onReorder={setItems}
      style={axis === 'y' ? {} : { display: 'flex' }}
      values={items()}
    >
      <For each={items()}>
        {(item) => (
          <Reorder.Item
            value={item}
            id={item}
            dragTransition={{ bounceStiffness: 2000, bounceDamping: 10000 }}
            transition={{ duration: 0.1 }}
          >
            <span>{item}</span>
          </Reorder.Item>
        )}
      </For>
      <style>{styles}</style>
    </Reorder.Group>
  ))
}

function expectBboxWithin(
  el: HTMLElement,
  expected: { top: number; left: number; width: number; height: number },
) {
  const r = el.getBoundingClientRect()
  expect(r.left).toBeGreaterThan(expected.left - 2)
  expect(r.left).toBeLessThan(expected.left + 2)
  expect(r.top).toBeGreaterThan(expected.top - 2)
  expect(r.top).toBeLessThan(expected.top + 2)
  expect(r.width).toBeGreaterThan(expected.width - 2)
  expect(r.width).toBeLessThan(expected.width + 2)
  expect(r.height).toBeGreaterThan(expected.height - 2)
  expect(r.height).toBeLessThan(expected.height + 2)
}

describe('Drag to reorder', () => {
  it('Y axis', async () => {
    const wrapper = mount('y')
    await wait(50)
    const tomato = wrapper.container.querySelector('#Tomato') as HTMLElement
    const cucumber = wrapper.container.querySelector('#Cucumber') as HTMLElement
    expectBboxWithin(tomato, { height: 68, left: 350, top: 174, width: 340 })
    expectBboxWithin(cucumber, { height: 68, left: 350, top: 253, width: 340 })

    const pointer = cyDrag(tomato, 360, 175)
    await wait(50)
    await pointer.to(360, 180)
    await wait(50)
    await pointer.to(360, 200)
    await wait(50)
    await pointer.to(360, 220)
    await wait(100)

    expectBboxWithin(tomato, { height: 68, left: 350, top: 249, width: 340 })
    expectBboxWithin(cucumber, { height: 68, left: 350, top: 174, width: 340 })

    pointer.end()
    await wait(100)
    expectBboxWithin(tomato, { height: 68, left: 350, top: 252, width: 340 })

    await nextFrame()
  })

  it('X axis', async () => {
    const wrapper = mount('x')
    await wait(50)
    const tomato = wrapper.container.querySelector('#Tomato') as HTMLElement
    const cucumber = wrapper.container.querySelector('#Cucumber') as HTMLElement
    expectBboxWithin(tomato, { height: 68, left: 350, top: 291, width: 340 })
    expectBboxWithin(cucumber, { height: 68, left: 690, top: 291, width: 340 })

    const pointer = cyDrag(tomato, 360, 175)
    await wait(50)
    await pointer.to(365, 175)
    await wait(50)
    await pointer.to(425, 175)
    await wait(50)
    await pointer.to(475, 175)
    await wait(100)

    expectBboxWithin(tomato, { height: 68, left: 535, top: 291, width: 340 })
    expectBboxWithin(cucumber, { height: 68, left: 350, top: 291, width: 340 })

    pointer.end()
    await nextFrame()
  })

  it('Move around', async () => {
    const wrapper = mount('y')
    await wait(50)
    const tomato = wrapper.container.querySelector('#Tomato') as HTMLElement
    expectBboxWithin(tomato, { height: 68, left: 350, top: 174, width: 340 })

    const baseY = 175
    const delta = 20
    const steps = [-4, 14, -8, 4, -5, 2, -6]

    const pointer = cyDrag(tomato, 360, baseY)
    await wait(150)
    for (const step of steps) {
      const y = step > 0 ? delta : -delta
      for (let i = 0; i < Math.abs(step); i++) {
        await pointer.to(360, baseY + y)
        await wait(150)
      }
    }
    pointer.end()
    await wait(150)

    expectBboxWithin(tomato, { height: 68, left: 350, top: 174, width: 340 })
  })
})
