import { cleanup, render } from '@solidjs/testing-library'
import { onMount } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { cyDrag, drag, nextFrame, pointerUp } from '../features/gestures/drag-test-utils'
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

interface Opts {
  axis?: 'x' | 'y'
  lock?: boolean
  isPercentage?: boolean
  top?: number
  left?: number
  right?: number
  bottom?: number
  showChild?: boolean
  return?: boolean | 'x' | 'y'
  x?: number | string
  y?: number | string
  layout?: boolean | 'position' | 'size'
}

function mount(opts: Opts = {}) {
  const x = opts.isPercentage ? `${opts.x}%` : (opts.x ?? 0)
  const y = opts.isPercentage ? `${opts.y}%` : (opts.y ?? 0)

  const r = render(() => {
    onMount(() => window.scrollTo(0, 100))
    return (
      <div style={{ height: '2000px', 'padding-top': '100px' }}>
        <motion.div
          id="box"
          data-testid="draggable"
          drag={opts.axis ? opts.axis : true}
          dragElastic={0}
          dragMomentum={false}
          dragConstraints={{
            top: opts.top,
            left: opts.left,
            right: opts.right,
            bottom: opts.bottom,
          }}
          dragSnapToOrigin={opts.return}
          dragDirectionLock={!!opts.lock}
          layout={opts.layout}
          initial={{
            width: 50,
            height: 50,
            background: 'red',
            x,
            y,
          }}
        >
          {opts.showChild ? (
            <div
              data-testid="draggable-child"
              style={{ width: '50px', height: '50px', background: 'blue' }}
            />
          ) : null}
        </motion.div>
      </div>
    )
  })
  return r
}

describe('Drag', () => {
  it('drags the element by the defined distance', async () => {
    const wrapper = mount()
    await wait(200)
    const el = wrapper.getByTestId('draggable')
    const pointer = await drag(el).to(10, 10)
    await pointer.to(200, 300)
    pointer.end()
    await nextFrame()
    await wait(50)
    const rect = el.getBoundingClientRect()
    expect(rect.left).toBe(200)
    expect(rect.top).toBe(300)
  })

  it('drags the element via a child', async () => {
    const wrapper = mount({ showChild: true })
    await wait(200)
    const parent = wrapper.getByTestId('draggable')
    const child = wrapper.getByTestId('draggable-child')
    const pointer = await drag(parent, child).to(10, 10)
    await pointer.to(200, 300)
    pointer.end()
    await nextFrame()
    await wait(50)
    const rect = parent.getBoundingClientRect()
    expect(rect.left).toBe(200)
    expect(rect.top).toBe(300)
  })

  it('locks drag to x', async () => {
    const wrapper = mount({ axis: 'x' })
    await wait(200)
    const el = wrapper.getByTestId('draggable')
    const pointer = await drag(el).to(10, 10)
    await pointer.to(200, 300)
    pointer.end()
    await nextFrame()
    await wait(50)
    const rect = el.getBoundingClientRect()
    expect(rect.left).toBe(200)
    expect(rect.top).toBe(0)
  })

  it('locks drag to y', async () => {
    const wrapper = mount({ axis: 'y' })
    await wait(200)
    const el = wrapper.getByTestId('draggable')
    const pointer = await drag(el).to(10, 10)
    await pointer.to(200, 300)
    pointer.end()
    await nextFrame()
    await wait(50)
    const rect = el.getBoundingClientRect()
    expect(rect.left).toBe(0)
    expect(rect.top).toBe(300)
  })

  // Upstream's cypress `trigger("pointerdown", 5, 5)` then moves (10,10),
  // (10,200), (200,10) → expects `left=0, top=200`. With cyDrag (cypress-
  // style element-relative coords), the same pointer sequence reaches
  // motion-dom's drag controls.
  // Matches upstream's cypress sequence (5,5)→(10,10)→(10,200)→(200,10) with
  // the same 100ms waits cypress inserts via `.wait(100)`. The wait gives
  // motion-dom's frame loop time to apply the locked-axis position update
  // before the next pointermove; cyDrag re-reads the element bbox per move,
  // so the post-lock move (200, 10) lands at viewport (200, 205) — offset
  // (195, 200) — and the final y=200. Without the waits the bbox is stale
  // and the test settles ~at y=5.
  it('direction locks to y', async () => {
    const wrapper = mount({ lock: true })
    await wait(200)
    const el = wrapper.getByTestId('draggable')
    const pointer = cyDrag(el, 5, 5)
    await pointer.to(10, 10)
    await wait(100)
    await pointer.to(10, 200)
    await wait(100)
    await pointer.to(200, 10)
    await wait(100)
    pointer.end()
    await nextFrame()
    await wait(50)
    const rect = el.getBoundingClientRect()
    expect(rect.left).toBe(0)
    expect(rect.top).toBe(200)
    pointerUp(window, 200, 10)
  })
})
