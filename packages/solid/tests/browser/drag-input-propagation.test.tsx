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
// drag-input-propagation.ts — #1674: interactive children must not start
// drag on their own pointerdown.
function setup() {
  return render(() => (
    <div style={{ padding: '100px' }}>
      <motion.div
        id="draggable"
        data-testid="draggable"
        drag
        dragElastic={0}
        dragMomentum={false}
        style={{
          width: '400px',
          height: '200px',
          background: 'red',
          display: 'flex',
          'flex-wrap': 'wrap',
          'align-items': 'center',
          'justify-content': 'center',
          gap: '10px',
          padding: '10px',
        }}
      >
        <input type="text" data-testid="input" value="Select me" />
        <textarea data-testid="textarea">Text</textarea>
        <button data-testid="button">Click</button>
        <a href="#test" data-testid="link">
          Link
        </a>
        <select data-testid="select">
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </select>
        <input type="checkbox" data-testid="checkbox" />
        <div contentEditable data-testid="contenteditable">
          Edit me
        </div>
      </motion.div>
    </div>
  ))
}

function dragOn(testId: string, wrapper: ReturnType<typeof setup>) {
  const el = wrapper.getByTestId(testId)
  const pointer = cyDrag(el, 5, 5)
  return pointer
}

describe('Drag Input Propagation', () => {
  it('does NOT drag when starting from an <input>', async () => {
    const wrapper = setup()
    await wait(200)
    const initial = wrapper.getByTestId('draggable').getBoundingClientRect()
    const pointer = dragOn('input', wrapper)
    await pointer.to(10, 10)
    await pointer.to(200, 200)
    pointer.end()
    await nextFrame()
    await wait(50)
    const after = wrapper.getByTestId('draggable').getBoundingClientRect()
    expect(after.left).toBe(initial.left)
    expect(after.top).toBe(initial.top)
  })

  it('does NOT drag when starting from a <textarea>', async () => {
    const wrapper = setup()
    await wait(200)
    const initial = wrapper.getByTestId('draggable').getBoundingClientRect()
    const pointer = dragOn('textarea', wrapper)
    await pointer.to(10, 10)
    await pointer.to(200, 200)
    pointer.end()
    await nextFrame()
    await wait(50)
    const after = wrapper.getByTestId('draggable').getBoundingClientRect()
    expect(after.left).toBe(initial.left)
    expect(after.top).toBe(initial.top)
  })

  it('does NOT drag when starting from a <select>', async () => {
    const wrapper = setup()
    await wait(200)
    const initial = wrapper.getByTestId('draggable').getBoundingClientRect()
    const pointer = dragOn('select', wrapper)
    await pointer.to(10, 10)
    await pointer.to(200, 200)
    pointer.end()
    await nextFrame()
    await wait(50)
    const after = wrapper.getByTestId('draggable').getBoundingClientRect()
    expect(after.left).toBe(initial.left)
    expect(after.top).toBe(initial.top)
  })

  it('does NOT drag when starting from a contentEditable element', async () => {
    const wrapper = setup()
    await wait(200)
    const initial = wrapper.getByTestId('draggable').getBoundingClientRect()
    const pointer = dragOn('contenteditable', wrapper)
    await pointer.to(10, 10)
    await pointer.to(200, 200)
    pointer.end()
    await nextFrame()
    await wait(50)
    const after = wrapper.getByTestId('draggable').getBoundingClientRect()
    expect(after.left).toBe(initial.left)
    expect(after.top).toBe(initial.top)
  })

  it('DOES drag when starting from a <button>', async () => {
    const wrapper = setup()
    await wait(200)
    const initial = wrapper.getByTestId('draggable').getBoundingClientRect()
    const pointer = dragOn('button', wrapper)
    await pointer.to(10, 10)
    await pointer.to(200, 200)
    pointer.end()
    await nextFrame()
    await wait(50)
    const after = wrapper.getByTestId('draggable').getBoundingClientRect()
    expect(after.left).not.toBe(initial.left)
  })
})
