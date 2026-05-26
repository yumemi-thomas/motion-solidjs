import { cleanup, render } from '@solidjs/testing-library'
import { createMemo, createSignal, For, onCleanup, onMount } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { Reorder } from '@/components/reorder'
import { cyDrag, nextFrame } from '../features/gestures/drag-test-utils'
import { wait } from './helpers'

afterEach(() => cleanup())

const ITEM_HEIGHT = 50
const TOTAL = 50
const allItems = Array.from({ length: TOTAL }, (_, i) => `Item ${i}`)

// Tiny hand-rolled virtualizer — Solid analog of @tanstack/react-virtual
// used in motion-upstream/dev/react/src/tests/reorder-virtualized.tsx. We
// keep the same shape: paddingTop / window / paddingBottom and a `Show`
// of only the slice that intersects the scroll window.
function Fixture() {
  const [items, setItems] = createSignal(allItems)
  let scrollRef!: HTMLDivElement
  const [scrollTop, setScrollTop] = createSignal(0)
  const containerHeight = 300

  onMount(() => {
    const onScroll = () => setScrollTop(scrollRef.scrollTop)
    scrollRef.addEventListener('scroll', onScroll, { passive: true })
    onCleanup(() => scrollRef.removeEventListener('scroll', onScroll))
  })

  const virtualWindow = createMemo(() => {
    const top = scrollTop()
    const start = Math.max(0, Math.floor(top / ITEM_HEIGHT))
    const end = Math.min(items().length, Math.ceil((top + containerHeight) / ITEM_HEIGHT))
    return { start, end }
  })

  const virtualItems = createMemo(() => {
    const w = virtualWindow()
    const list: { index: number; value: string }[] = []
    for (let i = w.start; i < w.end; i++) {
      list.push({ index: i, value: items()[i] })
    }
    return list
  })

  const paddingTop = createMemo(() => virtualWindow().start * ITEM_HEIGHT)
  const paddingBottom = createMemo(() => (items().length - virtualWindow().end) * ITEM_HEIGHT)

  return (
    <div>
      <div
        ref={(el) => (scrollRef = el)}
        style={{ height: `${containerHeight}px`, overflow: 'auto' }}
      >
        <Reorder.Group
          axis="y"
          values={items()}
          onReorder={setItems}
          style={{ 'list-style': 'none', padding: 0, margin: 0 }}
        >
          {paddingTop() > 0 && (
            <li
              style={{
                height: `${paddingTop()}px`,
                padding: 0,
                border: 'none',
              }}
            />
          )}
          <For each={virtualItems()}>
            {(virtualItem) => (
              <Reorder.Item
                value={virtualItem.value}
                id={virtualItem.value.replace(/\s/g, '-')}
                style={{
                  height: `${ITEM_HEIGHT}px`,
                  padding: '10px',
                  'box-sizing': 'border-box',
                  background: `hsl(${(virtualItem.index * 7.2) % 360}, 80%, 90%)`,
                  'border-bottom': '1px solid rgba(0,0,0,0.1)',
                  cursor: 'grab',
                }}
              >
                {virtualItem.value}
              </Reorder.Item>
            )}
          </For>
          {paddingBottom() > 0 && (
            <li
              style={{
                height: `${paddingBottom()}px`,
                padding: 0,
                border: 'none',
              }}
            />
          )}
        </Reorder.Group>
      </div>
      <p id="item-count" data-count={items().length}>
        {items().length} items
      </p>
      <p id="item-order" data-order={JSON.stringify(items())}>
        {items().join(', ')}
      </p>
      <p id="visible-count" data-count={virtualItems().length}>
        {virtualItems().length} visible
      </p>
    </div>
  )
}

// Port of motion-upstream/packages/framer-motion/cypress/integration/
// reorder-virtualized.ts. Verifies that reordering a virtualized list does
// not "lose" items that aren't currently rendered.
//
// Fixed in Reorder.Group: previously the Solid port emitted onReorder
// output rebuilt from *measured* (currently-rendered) items only, dropping
// unrendered values. Now mirrors upstream React semantics — Group.updateOrder
// applies the visible swap to a copy of the full `values` prop so unmeasured
// items keep their relative positions (see src/components/reorder/group.tsx).
describe('reorder-virtualized', () => {
  it('preserves all items after reorder (impl gap in Reorder.Group)', async () => {
    render(() => <Fixture />)
    await wait(200)

    const itemCount = document.getElementById('item-count') as HTMLElement
    expect(itemCount.getAttribute('data-count')).toBe(String(TOTAL))

    const visibleCount = document.getElementById('visible-count') as HTMLElement
    const visible = parseInt(visibleCount.getAttribute('data-count') ?? '0', 10)
    expect(visible).toBeGreaterThan(0)
    expect(visible).toBeLessThan(TOTAL)

    const item1 = document.getElementById('Item-1') as HTMLElement
    const pointer = cyDrag(item1, 50, 25)
    await pointer.to(50, 30)
    await wait(50)
    await pointer.to(50, 55)
    await wait(100)
    pointer.end()
    await wait(200)
    await nextFrame()

    expect(itemCount.getAttribute('data-count')).toBe(String(TOTAL))

    const orderEl = document.getElementById('item-order') as HTMLElement
    const order: string[] = JSON.parse(orderEl.getAttribute('data-order') ?? '[]')
    expect(order.length).toBe(TOTAL)
    const sorted = [...order].sort()
    const expected = Array.from({ length: TOTAL }, (_, i) => `Item ${i}`).sort()
    expect(sorted).toEqual(expected)
    // Item 1 is no longer at index 1 (it was dragged past Item 2)
    expect(order[1]).not.toBe('Item 1')
    // Unmeasured items at the end are still there
    expect(order).toContain('Item 49')
  })
})
