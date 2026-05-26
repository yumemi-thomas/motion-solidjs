import { cleanup, render } from '@solidjs/testing-library'
import { createEffect, createSignal, onCleanup } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { Reorder } from '@/components/reorder'
import { cyDrag, nextFrame } from '../features/gestures/drag-test-utils'
import { wait } from './helpers'

// Restore the configured viewport (1000x660 in vitest.browser.config.ts) so
// the rest of the suite doesn't inherit a narrower size after the resize
// sub-test.
afterEach(async () => {
  cleanup()
  await page.viewport(1000, 660)
})

const initialItems = ['Tomato', 'Cucumber', 'Cheese', 'Lettuce']

function Fixture() {
  const [axis, setAxis] = createSignal<'x' | 'y'>('y')
  const [items, setItems] = createSignal(initialItems)

  createEffect(() => {
    const media = window.matchMedia('(min-width: 500px)')
    const change = (event: MediaQueryListEvent) => {
      setAxis(event.matches ? 'x' : 'y')
    }
    setAxis(media.matches ? 'x' : 'y')
    media.addEventListener('change', change)
    onCleanup(() => media.removeEventListener('change', change))
  })

  return (
    <div>
      <div data-testid="current-order">{items().join(',')}</div>
      <div data-testid="current-axis">{axis()}</div>
      <Reorder.Group
        as="div"
        axis={axis()}
        values={items()}
        onReorder={setItems}
        style={{
          display: 'grid',
          'grid-auto-flow': axis() === 'x' ? 'column' : 'row',
          gap: '10px',
          padding: '10px',
          'list-style': 'none',
        }}
      >
        {items().map((item) => (
          <Reorder.Item
            as="div"
            value={item}
            data-testid={item}
            style={{
              padding: '20px',
              background: '#eee',
              cursor: 'grab',
              'min-width': '80px',
              'min-height': '50px',
            }}
          >
            {item}
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  )
}

// Port of motion-upstream/packages/framer-motion/cypress/integration/
// reorder-axis-change.ts (regression for #3022). Upstream uses
// `cy.viewport(W,H)` to flip the matchMedia threshold mid-test; we use
// vitest browser-mode's `page.viewport(w, h)` (vitest-dev/vitest#5811)
// for the equivalent. The default viewport (1000x660, see
// vitest.browser.config.ts) is wider than 500 so axis starts at "x";
// the baseline sub-test drags horizontally and the resize sub-test
// shrinks below 500 and drags vertically.
describe('reorder-axis-change', () => {
  it('renders with axis="x" at the test viewport (>500 wide)', async () => {
    render(() => <Fixture />)
    await wait(200)
    const axisLabel = document.querySelector('[data-testid="current-axis"]') as HTMLElement
    expect(axisLabel.textContent).toBe('x')
  })

  it('reorders along its axis without an axis change', async () => {
    render(() => <Fixture />)
    await wait(200)

    const tomato = document.querySelector('[data-testid="Tomato"]') as HTMLElement
    // Axis is 'x' (viewport > 500). Drag Tomato right past Cucumber.
    const pointer = cyDrag(tomato, 25, 40)
    await pointer.to(30, 40)
    await wait(50)
    await pointer.to(50, 40)
    await wait(50)
    await pointer.to(80, 40)
    await wait(50)
    await pointer.to(110, 40)
    await wait(50)
    await pointer.to(140, 40)
    await wait(100)
    pointer.end()
    await nextFrame()

    const orderEl = document.querySelector('[data-testid="current-order"]') as HTMLElement
    expect(orderEl.textContent).not.toBe('Tomato,Cucumber,Cheese,Lettuce')
  })

  it('reorders correctly after axis changes via resize', async () => {
    render(() => <Fixture />)
    await wait(200)

    const axisLabel = document.querySelector('[data-testid="current-axis"]') as HTMLElement
    expect(axisLabel.textContent).toBe('x')

    // Shrink below the matchMedia threshold (`min-width: 500px`) so the
    // Fixture's media-query listener flips axis to 'y'. Equivalent to
    // upstream's `cy.viewport(400, 600).wait(500)`.
    await page.viewport(400, 600)
    await wait(500)
    expect(axisLabel.textContent).toBe('y')

    const tomato = document.querySelector('[data-testid="Tomato"]') as HTMLElement
    // Axis is now 'y' — drag Tomato down past Cucumber (cypress sequence).
    const pointer = cyDrag(tomato, 40, 25)
    await pointer.to(40, 30)
    await wait(50)
    await pointer.to(40, 50)
    await wait(50)
    await pointer.to(40, 80)
    await wait(50)
    await pointer.to(40, 110)
    await wait(50)
    await pointer.to(40, 140)
    await wait(100)
    pointer.end()
    await nextFrame()

    const orderEl = document.querySelector('[data-testid="current-order"]') as HTMLElement
    expect(orderEl.textContent).not.toBe('Tomato,Cucumber,Cheese,Lettuce')
  })
})
