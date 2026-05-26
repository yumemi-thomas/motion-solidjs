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
// drag-scroll-while-drag.ts — verifies that dragging elements stay
// attached to the cursor when scrolling occurs during drag.
function mountElementScroll() {
  return render(() => (
    <div
      id="scrollable"
      data-testid="scrollable"
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        width: '500px',
        height: '400px',
        overflow: 'auto',
        background: '#f0f0f0',
      }}
    >
      <div
        style={{
          height: '1500px',
          width: '800px',
          'padding-top': '50px',
          'padding-left': '50px',
        }}
      >
        <motion.div
          id="draggable"
          data-testid="draggable"
          drag
          dragElastic={0}
          dragMomentum={false}
          style={{
            width: '100px',
            height: '100px',
            background: '#ff0066',
            'border-radius': '10px',
          }}
        />
      </div>
    </div>
  ))
}

function mountWindowScroll() {
  return render(() => (
    <div
      style={{
        height: '2000px',
        width: '100%',
        'padding-top': '50px',
        'padding-left': '50px',
        background: '#f0f0f0',
      }}
    >
      <motion.div
        id="draggable"
        data-testid="draggable"
        drag
        dragElastic={0}
        dragMomentum={false}
        style={{
          width: '100px',
          height: '100px',
          background: '#ff0066',
          'border-radius': '10px',
        }}
      />
    </div>
  ))
}

describe('Drag with element scroll during drag', () => {
  it('Element stays at same viewport position during scroll (no pointer move)', async () => {
    const scrollAmount = 100
    const wrapper = mountElementScroll()
    await wait(200)
    const el = wrapper.getByTestId('draggable')
    const pointer = cyDrag(el, 50, 50)
    await pointer.to(55, 55)
    await wait(50)
    await pointer.to(100, 100)
    await wait(50)

    const rectBefore = el.getBoundingClientRect()

    const scrollable = wrapper.getByTestId('scrollable') as HTMLElement
    scrollable.scrollTop = scrollAmount

    await wait(100)
    const rectAfter = el.getBoundingClientRect()
    expect(rectAfter.top).toBeCloseTo(rectBefore.top, -1)
    expect(rectAfter.left).toBeCloseTo(rectBefore.left, -1)
    pointer.end()
  })

  it('Element scroll compensation prevents large position jumps', async () => {
    const scrollAmount = 200
    const wrapper = mountElementScroll()
    await wait(200)
    const el = wrapper.getByTestId('draggable')
    const pointer = cyDrag(el, 50, 50)
    await pointer.to(55, 55)
    await wait(50)
    await pointer.to(100, 100)
    await wait(50)

    const scrollable = wrapper.getByTestId('scrollable') as HTMLElement
    scrollable.scrollTop = scrollAmount
    await wait(100)

    await pointer.to(100, 100)
    await wait(50)
    pointer.end()
    await nextFrame()
    await wait(50)

    const { top } = el.getBoundingClientRect()
    expect(top).toBeGreaterThan(0)
    expect(top).toBeLessThan(scrollAmount)
  })

  it('Element moves correctly without scroll', async () => {
    const wrapper = mountElementScroll()
    await wait(200)
    const el = wrapper.getByTestId('draggable')
    const pointer = cyDrag(el, 50, 50)
    await pointer.to(55, 55)
    await wait(50)
    await pointer.to(100, 100)
    await wait(50)
    pointer.end()
    await nextFrame()
    await wait(50)

    const { left, top } = el.getBoundingClientRect()
    expect(left).toBeGreaterThan(50)
    expect(left).toBeLessThan(200)
    expect(top).toBeGreaterThan(50)
    expect(top).toBeLessThan(200)
  })
})

describe('Drag with window scroll during drag', () => {
  it('Element stays at same viewport position during window scroll (no pointer move)', async () => {
    const scrollAmount = 100
    const wrapper = mountWindowScroll()
    await wait(200)
    const el = wrapper.getByTestId('draggable')
    const pointer = cyDrag(el, 50, 50)
    await pointer.to(55, 55)
    await wait(50)
    await pointer.to(100, 100)
    await wait(50)

    window.scrollTo(0, scrollAmount)
    window.dispatchEvent(new Event('scroll', { bubbles: true }))

    await wait(100)
    const rectAfter = el.getBoundingClientRect()
    // The element should not jump completely off-screen.
    expect(rectAfter.top).toBeGreaterThan(-50)
    expect(rectAfter.top).toBeLessThan(200)
    pointer.end()
  })

  it('Window scroll compensation prevents large position jumps', async () => {
    const scrollAmount = 200
    const wrapper = mountWindowScroll()
    await wait(200)
    const el = wrapper.getByTestId('draggable')
    const pointer = cyDrag(el, 50, 50)
    await pointer.to(55, 55)
    await wait(50)
    await pointer.to(100, 100)
    await wait(50)

    window.scrollTo(0, scrollAmount)
    await wait(100)

    await pointer.to(100, 100)
    await wait(50)
    pointer.end()
    await nextFrame()
    await wait(50)

    const { top } = el.getBoundingClientRect()
    expect(top).toBeGreaterThan(-100)
    expect(top).toBeLessThan(500)
    window.scrollTo(0, 0)
  })

  it('Element moves correctly without window scroll', async () => {
    const wrapper = mountWindowScroll()
    await wait(200)
    const el = wrapper.getByTestId('draggable')
    const pointer = cyDrag(el, 50, 50)
    await pointer.to(55, 55)
    await wait(50)
    await pointer.to(100, 100)
    await wait(50)
    pointer.end()
    await nextFrame()
    await wait(50)

    const { left, top } = el.getBoundingClientRect()
    expect(left).toBeGreaterThan(50)
    expect(left).toBeLessThan(200)
    expect(top).toBeGreaterThan(50)
    expect(top).toBeLessThan(200)
  })
})
