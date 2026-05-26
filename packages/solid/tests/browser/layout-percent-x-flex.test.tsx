import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, For } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { wait } from './helpers'

afterEach(() => cleanup())

// Port of motion-upstream/packages/framer-motion/cypress/integration/layout-percent-x-flex.ts
// — fixture mirrors dev/react/src/tests/layout-percent-x-flex.tsx.
//
// Regression test for https://github.com/motiondivision/motion/issues/3401.
// Bug: layout animation breaks when x: "100%" (percentage) is in latestValues
// at the moment the layout update fires. Only the most-recently-added item
// has initial/animate props. Adding the next item flips shouldAnimate false
// for the previous item → its x animation stops with latestValues.x = "100%".
// A subsequent layout update with an unresolved percentage previously
// produced NaN in transformBox → identity projection → item teleported.
interface Item {
  id: number
  isAdded: boolean
}

function App() {
  const [items, setItems] = createSignal<Item[]>([
    { id: 0, isAdded: false },
    { id: 1, isAdded: false },
  ])

  const addItem = () => setItems((prev) => [...prev, { id: prev.length, isAdded: true }])

  return (
    <div
      style={{
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'center',
        padding: '20px',
      }}
    >
      <button id="add" onClick={addItem}>
        Add
      </button>
      <div style={{ display: 'flex', gap: '10px', 'margin-top': '20px' }}>
        <For each={items()}>
          {(item, i) => {
            const shouldAnimate = () => i() === items().length - 1 && item.isAdded
            return (
              <motion.div
                layout
                id={`item-${item.id}`}
                initial={shouldAnimate() ? { x: '100%' } : undefined}
                animate={shouldAnimate() ? { x: 0 } : undefined}
                transition={{ duration: 10 }}
                style={{
                  width: '100px',
                  height: '100px',
                  background: 'red',
                  'flex-shrink': 0,
                }}
              />
            )
          }}
        </For>
      </div>
    </div>
  )
}

describe('Layout animation: percentage x in flex container', () => {
  it('Correctly layout-animates when sibling added before keyframes resolve', async () => {
    render(() => <App />)
    await wait(50)
    const addBtn = document.getElementById('add') as HTMLButtonElement
    // First click: item-2 added with initial={x: "100%"}, animate={x: 0}
    addBtn.click()
    await wait(30)
    // Second click: item-3 added → shouldAnimate flips false on item-2
    // → its x animation stops → latestValues.x stays at "100%" → layout
    // update fires with an unresolved percentage.
    addBtn.click()
    await wait(300)

    const item2 = document.getElementById('item-2') as HTMLElement
    // If layout-animating correctly, a non-identity correction transform
    // is applied. If the bug triggered, transform stays "" / "none" and
    // item-2 snapped to its natural DOM position.
    const transform = item2.style.transform
    expect(transform).not.toBe('none')
    expect(transform).not.toBe('')
  })
})
