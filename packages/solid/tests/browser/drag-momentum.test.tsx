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
// drag-momentum.ts — drag momentum / catch-and-release.
function setup() {
  return render(() => (
    <div style={{ height: '2000px', 'padding-top': '100px' }}>
      <motion.div
        id="box"
        data-testid="draggable"
        drag
        dragMomentum={true}
        initial={{
          width: 50,
          height: 1000,
          background: 'red',
          x: 0,
          y: 0,
        }}
      />
    </div>
  ))
}

describe('Drag Momentum', () => {
  it('fast flick after hold produces momentum', async () => {
    const wrapper = setup()
    await wait(200)
    const el = wrapper.getByTestId('draggable')
    const pointer = cyDrag(el, 25, 900)
    await wait(300) // simulate holding before flick
    await pointer.to(25, 895)
    await wait(50)
    await pointer.to(25, 800)
    await wait(50)
    pointer.end()
    // Momentum uses real frame timing, so under full-suite browser load the
    // exact frame where it crosses this threshold can drift. Cypress's
    // upstream `.should()` assertion retries; mirror that here.
    await expect.poll(() => el.getBoundingClientRect().top, { timeout: 1500 }).toBeLessThan(-200)
  })

  it('catch-and-release stops momentum', async () => {
    const wrapper = setup()
    await wait(200)
    const el = wrapper.getByTestId('draggable')
    const pointer = cyDrag(el, 25, 900)
    await pointer.to(25, 895)
    await wait(50)
    await pointer.to(25, 700)
    await wait(50)
    pointer.end()
    await wait(100)
    const caughtTop = Math.round(el.getBoundingClientRect().top)

    // Catch and release at a different point — momentum should stop.
    const catchPointer = cyDrag(el, 25, 500)
    await wait(50)
    catchPointer.end()
    await nextFrame()
    await wait(500)
    const finalTop = el.getBoundingClientRect().top
    expect(Math.abs(finalTop - caughtTop)).toBeLessThan(50)
  })
})
