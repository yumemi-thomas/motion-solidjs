import { cleanup, render } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'
import { MotionConfig, motion } from '@/components'
import { createDragControls } from '@/primitives/create-drag-controls'
import { correctParentTransform } from '@/utils'
import { cyDrag, drag, nextFrame } from '../features/gestures/drag-test-utils'
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

function getHTMLElement(id: string): HTMLElement {
  const element = document.getElementById(id)
  if (!(element instanceof HTMLElement)) throw new Error(`Expected HTMLElement #${id}`)
  return element
}

function bbox(el: Element) {
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

// Drag fixtures from github.com/motiondivision/motion live under
// motion-upstream/dev/react/src/tests/; cypress specs under
// motion-upstream/packages/framer-motion/cypress/integration/.
describe('Drag additional upstream parity', () => {
  // Stay-close to motion-upstream/dev/react/src/tests/drag-3d-parent.tsx (perspective
  // parent). The fixture has no cypress spec, so we assert the minimal observable
  // behaviour: drag tracks the pointer inside a perspective-transformed parent.
  it('drag tracks the pointer inside a perspective (3d) parent', async () => {
    render(() => (
      <div style={{ transform: 'translateZ(0)', perspective: '1000px' }}>
        <motion.div
          id="box"
          drag
          dragMomentum={false}
          style={{ width: '50px', height: '50px', background: 'red' }}
        />
      </div>
    ))

    await wait(50)
    const box = getHTMLElement('box')
    const pointer = await drag(box).to(100, 80)
    pointer.end()
    await nextFrame()
    expect(box.getBoundingClientRect().left).toBeCloseTo(100, 1)
    expect(box.getBoundingClientRect().top).toBeCloseTo(80, 1)
  })

  // Port of motion-upstream/packages/framer-motion/cypress/integration/drag-rotated-parent.ts
  // ("Element follows cursor when parent is rotated 180deg"). The child of a 180deg-rotated
  // parent must follow the cursor (left > 350), corrected via MotionConfig.transformPagePoint
  // + correctParentTransform. Same setup + assertion as drag-rotated-parent.test.tsx.
  it('Element follows cursor when parent is rotated 180deg', async () => {
    let ref!: HTMLDivElement
    const wrapper = render(() => (
      <motion.div
        ref={(el) => (ref = el)}
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          width: '400px',
          height: '400px',
          rotate: '180deg',
        }}
      >
        <MotionConfig transformPagePoint={correctParentTransform(() => ref)}>
          <motion.div
            data-testid="draggable"
            drag
            dragElastic={0}
            dragMomentum={false}
            style={{ width: '100px', height: '100px', background: 'red' }}
          />
        </MotionConfig>
      </motion.div>
    ))

    await wait(200)
    const el = wrapper.getByTestId('draggable')
    await wait(100)
    const pointer = cyDrag(el, 50, 50)
    await pointer.to(55, 55) // past threshold
    await wait(50)
    await pointer.to(150, 50) // move right
    await wait(50)
    pointer.end()
    await nextFrame()
    await wait(50)
    expect(el.getBoundingClientRect().left).toBeGreaterThan(350)
  })

  // Port of motion-upstream/dev/react/src/tests/drag-snap-to-cursor.tsx — starting a drag
  // from an external trigger via dragControls.start(e, { snapToCursor: true }) jumps the
  // draggable so its centre lands on the pointer, then tracks it. The fixture has no cypress
  // spec; we assert the snap by checking the box centre follows the cursor.
  it('snapToCursor jumps the draggable to the pointer on drag start', async () => {
    const dragControls = createDragControls()
    const wrapper = render(() => (
      <>
        <div
          data-testid="trigger"
          onPointerDown={(e) => dragControls.start(e, { snapToCursor: true })}
          style={{ width: '200px', height: '200px' }}
        />
        <motion.div
          data-testid="draggable"
          drag
          dragControls={dragControls}
          dragMomentum={false}
          style={{ width: '100px', height: '100px', background: 'white' }}
        />
      </>
    ))

    await wait(50)
    const trigger = wrapper.getByTestId('trigger')
    const box = wrapper.getByTestId('draggable')
    // pointerdown fires on the trigger (page origin 0,0), then the pointer moves to
    // (160, 40). snapToCursor centres the box on the pointerdown point, so the box
    // centre should end up at the final pointer position.
    const pointer = await drag(box, trigger).to(160, 40)
    await nextFrame()
    pointer.end()
    await nextFrame()
    const rect = box.getBoundingClientRect()
    expect(Math.abs(rect.left + rect.width / 2 - 160)).toBeLessThanOrEqual(3)
    expect(Math.abs(rect.top + rect.height / 2 - 40)).toBeLessThanOrEqual(3)
  })

  // No upstream test exists for onMeasureDragConstraints. The callback only fires when
  // dragConstraints is an element ref (resolveRefConstraints early-returns for object
  // constraints — matching upstream VisualElementDragControls). Faithful minimal setup:
  // a ref constraints box whose measured constraints are tightened by the callback.
  it('applies constraints returned by onMeasureDragConstraints', async () => {
    let constraintsRef!: HTMLDivElement
    const wrapper = render(() => (
      <motion.div
        ref={(el) => (constraintsRef = el)}
        style={{
          width: '500px',
          height: '500px',
          position: 'relative',
          background: 'rgba(0,0,255,0.1)',
        }}
      >
        <motion.div
          data-testid="draggable"
          drag
          dragElastic={0}
          dragMomentum={false}
          dragConstraints={() => constraintsRef}
          onMeasureDragConstraints={() => ({ top: 0, left: 0, right: 20, bottom: 20 })}
          style={{ width: '100px', height: '100px', background: 'red' }}
        />
      </motion.div>
    ))

    await wait(200)
    const box = wrapper.getByTestId('draggable')
    const start = bbox(box)
    const pointer = cyDrag(box, 5, 5)
    await pointer.to(10, 10)
    await wait(50)
    await pointer.to(400, 400)
    await wait(50)
    pointer.end()
    await nextFrame()
    await wait(50)
    const end = bbox(box)
    // The callback clamps translation to 20px on each axis.
    expect(end.left - start.left).toBeLessThanOrEqual(22)
    expect(end.top - start.top).toBeLessThanOrEqual(22)
  })

  // Port of motion-upstream/packages/framer-motion/cypress/integration/drag-nested.ts
  // (fixture drag-layout-nested.tsx), the "Neither" case: a parent and a nested child drag
  // independently with exact bounding boxes. Same geometry + assertions as
  // drag-nested.test.tsx.
  it('nested parent + child drag independently with stable bounding boxes', async () => {
    const wrapper = render(() => (
      <div>
        <motion.div
          id="parent"
          drag
          dragMomentum={false}
          dragElastic={false}
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
            drag
            dragMomentum={false}
            dragElastic={false}
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

    await wait(200)
    const parent = wrapper.container.querySelector('#parent') as HTMLElement
    const child = wrapper.container.querySelector('#child') as HTMLElement
    const control = wrapper.container.querySelector('#control') as HTMLElement

    expect(bbox(parent)).toEqual({ top: 100, left: 100, width: 300, height: 300 })
    expect(bbox(child)).toEqual({ top: 150, left: 150, width: 600, height: 200 })
    expect(bbox(control).top).toBe(200)
    expect(bbox(control).left).toBe(200)

    // Drag the parent — parent + descendants shift by (40, 40).
    let pointer = cyDrag(parent, 5, 5)
    await wait(50)
    await pointer.to(10, 10)
    await wait(50)
    await pointer.to(50, 50)
    await wait(50)
    pointer.end()
    await nextFrame()

    expect(bbox(parent).top).toBe(150)
    expect(bbox(parent).left).toBe(150)
    expect(bbox(child).top).toBe(200)
    expect(bbox(child).left).toBe(200)
    expect(bbox(control).top).toBe(250)
    expect(bbox(control).left).toBe(250)

    // Drag the child — only the child + control move; the parent stays put.
    pointer = cyDrag(child, 5, 5)
    await wait(50)
    await pointer.to(10, 10)
    await wait(50)
    await pointer.to(50, 50)
    await wait(50)
    pointer.end()
    await nextFrame()

    expect(bbox(parent).top).toBe(150)
    expect(bbox(parent).left).toBe(150)
    expect(bbox(child).top).toBe(250)
    expect(bbox(child).left).toBe(250)
    expect(bbox(control).top).toBe(300)
    expect(bbox(control).left).toBe(300)
  })
})
