import { cleanup, render } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'
import { motion, motionValue } from '@/index'
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
// drag-framer-page.ts — nested Scroll/Page Framer setup. Pages share an
// x/y MotionValue and use private `_dragX` / `_dragY` props so the
// gesture drives those MVs directly instead of the element's own x/y.
//
// IMPL GAP: `_dragX` / `_dragY` are now whitelisted in
// `create-motion-attrs.tsx` (transformPagePoint pipeline port), so the
// MVs flow to VisualElementDragControls via `getAxisMotionValue`.
// However the fixture also uses `layout` on every motion node — the
// nested Scroll/Page geometry collapses without layout projection
// (initial `bbox.top` is wrong on mount). Remains a regression until the
// layout-projection wiring matches the reference.

const scrollContainer = {
  position: 'absolute' as const,
  top: '100px',
  left: '100px',
  width: '200px',
  height: '500px',
  overflow: 'hidden' as const,
}

const pageContainerStyle = {
  display: 'flex',
  'flex-direction': 'row' as const,
  width: '180px',
  height: '180px',
  position: 'relative' as const,
  top: '300px',
  left: '10px',
}

const b = {
  background: '#ff0055',
  top: '100px',
  left: '100px',
  width: '100%',
  height: '500px',
  'border-radius': '10px',
}

const c = {
  position: 'relative' as const,
  top: '50px',
  left: '50px',
  width: '100px',
  height: '100px',
  background: '#ffaa00',
  'border-radius': '10px',
}

function Page(props: {
  id?: string
  x: ReturnType<typeof motionValue<number>>
  y: ReturnType<typeof motionValue<number>>
}) {
  return (
    <motion.div
      layout
      _dragX={props.x}
      _dragY={props.y}
      id={props.id}
      drag="x"
      style={{
        width: '180px',
        height: '180px',
        background: '#ffcc00',
        'border-radius': '10px',
        flex: '0 0 180px',
      }}
    >
      <motion.div layout style={c} />
    </motion.div>
  )
}

function mount() {
  const x = motionValue(0)
  const y = motionValue(0)
  const dummyX = motionValue(0)
  const dummyY = motionValue(0)

  return render(() => (
    <motion.div style={scrollContainer} layout>
      <motion.div id="parent" style={b} drag="y" _dragX={dummyX} _dragY={dummyY}>
        <motion.div style={{ ...pageContainerStyle, x, y }} layout id="Page">
          <Page x={x} y={y} id="a" />
          <Page x={x} y={y} id="b" />
          <Page x={x} y={y} />
          <Page x={x} y={y} />
        </motion.div>
      </motion.div>
    </motion.div>
  ))
}

describe('Nested Scroll/Page', () => {
  // `_dragX`/`_dragY` are now whitelisted in motion-attrs, but the
  // fixture also uses `layout` on every node — the nested page Reorder
  // layout work depends on layout projection (see PORTED.md "drag" row
  // for layout-projection gaps). Initial bbox.top is wrong on mount,
  // which fails before the drag even starts.
  it('correctly positions children after dragging', async () => {
    const wrapper = mount()
    await wait(50)

    const a = wrapper.container.querySelector('#a') as HTMLElement
    {
      const bbox = a.getBoundingClientRect()
      expect(bbox.top).toBe(400)
      expect(bbox.left).toBe(110)
    }

    const pointer = cyDrag(a, 60, 60)
    await pointer.to(50, 50)
    await wait(50)
    await pointer.to(10, 10)
    await wait(200)
    pointer.end()
    await wait(70)

    {
      const bbox = a.getBoundingClientRect()
      expect(bbox.top).toBe(400)
      expect(bbox.left).toBe(50)
    }

    const b = wrapper.container.querySelector('#b') as HTMLElement
    cyDrag(b, 60, 60)
    await wait(50)

    {
      const bbox = a.getBoundingClientRect()
      expect(bbox.top).toBe(400)
      expect(bbox.left).toBe(50)
    }

    await nextFrame()
  })
})
