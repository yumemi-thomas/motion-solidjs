import { cleanup, render } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'
import { Reorder } from '@/components/reorder'
import { motionValue } from 'motion-dom'
import { createSignal } from 'solid-js'
import {
  nextFrame,
  pointerDown,
  pointerMove,
  pointerUp,
} from '../features/gestures/drag-test-utils'
import { wait } from './helpers'

afterEach(() => {
  window.scrollTo(0, 0)
  cleanup()
})

const initialItems = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

function Item(props: { item: number }) {
  const y = motionValue(0)
  const hue = () => props.item * 30
  return (
    <Reorder.Item
      value={props.item}
      id={String(props.item)}
      style={{
        y,
        'background-color': `hsl(${hue()}, 70%, 50%)`,
        height: '60px',
        cursor: 'grab',
        'border-radius': '5px',
        'margin-bottom': '10px',
        position: 'relative',
        width: '100%',
        'flex-shrink': 0,
        'list-style': 'none',
      }}
      data-testid={String(props.item)}
    />
  )
}

function ScrollableContainerFixture() {
  const [items, setItems] = createSignal(initialItems)
  return (
    <div data-testid="scroll-container" style={{ height: '300px', overflow: 'auto' }}>
      <Reorder.Group axis="y" onReorder={setItems} values={items()}>
        {items().map((item) => (
          <Item item={item} />
        ))}
      </Reorder.Group>
    </div>
  )
}

// Port of motion-upstream/packages/framer-motion/cypress/integration/
// reorder-auto-scroll.ts. Fixed in Reorder.Item: `autoScrollIfNeeded()` is
// now ported as `src/components/reorder/auto-scroll.ts` and wired into
// Reorder.Item's onDrag handler — when the pointer is near the leading or
// trailing edge of the scrollable ancestor (with velocity toward that
// edge), the ancestor scrolls.
describe('reorder-auto-scroll', () => {
  it('auto-scrolls down when dragging near bottom edge (needs autoScrollIfNeeded port)', async () => {
    render(() => <ScrollableContainerFixture />)
    await wait(200)

    const container = document.querySelector('[data-testid="scroll-container"]') as HTMLElement
    expect(container.scrollTop).toBe(0)

    const item0 = document.querySelector('[data-testid="0"]') as HTMLElement
    const rect = container.getBoundingClientRect()
    const nearBottom = rect.bottom - rect.top - 20

    const itemRect = item0.getBoundingClientRect()
    pointerDown(item0, itemRect.left + 50, itemRect.top + 25)
    pointerMove(window, rect.left + 50, rect.top + 30)
    await nextFrame()
    await wait(50)
    pointerMove(window, rect.left + 50, rect.top + nearBottom)
    await nextFrame()
    await wait(300)
    expect(container.scrollTop).toBeGreaterThan(0)
    pointerUp(window, rect.left + 50, rect.top + nearBottom)
    await nextFrame()
  })

  it('auto-scrolls up when dragging near top edge (needs autoScrollIfNeeded port)', async () => {
    render(() => <ScrollableContainerFixture />)
    await wait(200)

    const container = document.querySelector('[data-testid="scroll-container"]') as HTMLElement
    container.scrollTop = 200
    await wait(100)
    expect(container.scrollTop).toBe(200)

    const item8 = document.querySelector('[data-testid="8"]') as HTMLElement
    // Upstream cypress's `pointerdown` without `force:true` scrolls the
    // target element into view before dispatching (cypress's actionability
    // check). cyDrag doesn't replicate that, so do it manually here —
    // otherwise item 8 stays below the visible region, the pointer lands in
    // the bottom threshold zone instead of the top, and the up-scroll never
    // triggers.
    item8.scrollIntoView({ block: 'start' })
    await wait(50)
    const beforeDrag = container.scrollTop

    const itemRect = item8.getBoundingClientRect()
    const rect = container.getBoundingClientRect()
    pointerDown(item8, itemRect.left + 50, itemRect.top + 25)
    pointerMove(window, rect.left + 50, rect.top + 20)
    await nextFrame()
    await wait(50)
    pointerMove(window, rect.left + 50, rect.top - 100)
    await nextFrame()
    await wait(300)
    expect(container.scrollTop).toBeLessThan(beforeDrag)
    pointerUp(window, rect.left + 50, rect.top - 100)
    await nextFrame()
  })
})
