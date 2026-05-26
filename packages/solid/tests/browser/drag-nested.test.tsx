import { cleanup, render } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
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
// drag-nested.ts (fixture: drag-layout-nested.tsx). Nested draggables —
// parent + inner child — should track independently and not lose drag
// when the gesture switches between them.

interface MountOpts {
  parentLayout?: boolean
  childLayout?: boolean
  constraints?: boolean
  animation?: boolean
  bothAxes?: boolean
  parentDrag?: boolean | 'x' | 'y'
  childDrag?: boolean | 'x' | 'y'
}

function mount(opts: MountOpts = {}) {
  let parentDrag: boolean | 'x' | 'y' = opts.parentDrag ?? true
  let childDrag: boolean | 'x' | 'y' = opts.childDrag ?? true
  if (opts.bothAxes) {
    parentDrag = 'y'
    childDrag = 'x'
  }
  return render(() => (
    <div>
      <motion.div
        id="parent"
        drag={parentDrag}
        dragMomentum={opts.animation ?? false}
        dragElastic={opts.constraints && opts.animation ? 0.5 : false}
        dragConstraints={opts.constraints ? { top: -10, right: 100 } : undefined}
        layout={opts.parentLayout}
        style={{
          position: 'absolute',
          background: '#ff0055',
          top: '100px',
          left: '100px',
          width: '300px',
          height: '300px',
          'border-radius': '10px',
        }}
      >
        <motion.div
          id="child"
          drag={childDrag}
          dragMomentum={opts.animation ?? false}
          dragElastic={opts.constraints && opts.animation ? 0.5 : false}
          dragConstraints={opts.constraints ? { top: 0, left: -100, right: 100 } : undefined}
          layout={opts.childLayout}
          style={{
            position: 'relative',
            top: '50px',
            left: '50px',
            width: '600px',
            height: '200px',
            background: '#ffcc00',
            'border-radius': '10px',
          }}
        >
          <motion.div
            id="control"
            layoutId="test"
            style={{
              position: 'relative',
              top: '50px',
              left: '50px',
              width: '100px',
              height: '100px',
              background: '#ffaa00',
              'border-radius': '10px',
            }}
          />
        </motion.div>
      </motion.div>
    </div>
  ))
}

function bbox(el: Element) {
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

async function dragSeq(target: HTMLElement) {
  const pointer = cyDrag(target, 5, 5)
  await wait(50)
  await pointer.to(10, 10)
  await wait(50)
  await pointer.to(50, 50)
  await wait(50)
  pointer.end()
  await nextFrame()
}

describe('Nested drag (no layout)', () => {
  it('Neither: parent + child drag independently', async () => {
    const wrapper = mount()
    await wait(200)
    const parent = wrapper.container.querySelector('#parent') as HTMLElement
    const child = wrapper.container.querySelector('#child') as HTMLElement
    const control = wrapper.container.querySelector('#control') as HTMLElement

    expect(bbox(parent)).toEqual({ top: 100, left: 100, width: 300, height: 300 })
    expect(bbox(child)).toEqual({ top: 150, left: 150, width: 600, height: 200 })
    expect(bbox(control).top).toBe(200)
    expect(bbox(control).left).toBe(200)

    await dragSeq(parent)

    expect(bbox(parent).top).toBe(150)
    expect(bbox(parent).left).toBe(150)
    expect(bbox(child).top).toBe(200)
    expect(bbox(child).left).toBe(200)
    expect(bbox(control).top).toBe(250)
    expect(bbox(control).left).toBe(250)

    // Drag the child next — only the child should move (parent stays
    // at 150,150).
    await dragSeq(child)

    expect(bbox(parent).top).toBe(150)
    expect(bbox(parent).left).toBe(150)
    expect(bbox(child).top).toBe(250)
    expect(bbox(child).left).toBe(250)
    expect(bbox(control).top).toBe(300)
    expect(bbox(control).left).toBe(300)
  })
})

describe('Nested drag with layout', () => {
  // `layout` is accepted but the layout-projection engine isn't fully
  // wired. The basic drag math still works because static-bbox
  // dragConstraints + elasticity are computed without projection.
  it('Parent: layout, Child: layout with elastic constraint snap-back', async () => {
    const wrapper = mount({
      parentLayout: true,
      childLayout: true,
      constraints: true,
      animation: true,
    })
    await wait(200)
    const parent = wrapper.container.querySelector('#parent') as HTMLElement

    const pointer = cyDrag(parent, 5, 10)
    await wait(50)
    await pointer.to(10, 10)
    await wait(50)
    await pointer.to(200, 10)
    await wait(50)
    expect(bbox(parent).left).toBe(250)
    pointer.end()
    // Elastic snap-back uses motion's default spring (~400-600ms).
    // 1s is full settle + buffer.
    await wait(1000)
    // Settles at left + right-constraint = 100 + 100 = 200.
    expect(bbox(parent).left).toBe(200)
  })
})
