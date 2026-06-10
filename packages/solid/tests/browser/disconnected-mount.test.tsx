import { render as solidRender } from 'solid-js/web'
import { afterEach, describe, expect, it } from 'vitest'
import { Motion } from '@/components'

// Pins the connection gate in create-motion.ts (`onConnected` + rAF poll):
// when a subtree is built off-document and inserted later (CSR route
// transitions), the initial animation pass must wait for the
// disconnected→connected transition — motion-dom's keyframe resolver can't
// read baseline values from a disconnected element, so dispatching at mount
// would leave style-read properties stuck at their initial value.
//
// Waits are FRAME-counted, not wall-clock: the gate gives up (and flushes)
// after 60 rAF frames, so frame-based waits stay on the right side of the
// cap regardless of environment frame rate.

const frames = (n: number) =>
  new Promise<void>((resolve) => {
    let i = 0
    const tick = () => (++i >= n ? resolve() : void requestAnimationFrame(tick))
    requestAnimationFrame(tick)
  })

const untilStyle = async (el: HTMLElement, prop: string, value: string, capFrames = 120) => {
  for (let i = 0; i < capFrames; i++) {
    if (el.style.getPropertyValue(prop) === value) return
    await frames(1)
  }
}

describe('mount while disconnected', () => {
  let dispose: (() => void) | undefined
  let container: HTMLDivElement | undefined

  afterEach(() => {
    dispose?.()
    container?.remove()
  })

  it('defers the initial animation until the element connects', async () => {
    container = document.createElement('div')
    dispose = solidRender(
      () => (
        <Motion
          data-testid="m"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ type: false }}
        />
      ),
      container,
    )
    const el = container.querySelector('[data-testid="m"]')
    if (!(el instanceof HTMLElement)) throw new Error('motion element not rendered')
    expect(el.isConnected).toBe(false)

    // Mounted but off-document, well under the 60-frame cap: the gate must
    // hold the animation back.
    await frames(10)
    expect(el.style.opacity).toBe('0')

    document.body.appendChild(container)
    await untilStyle(el, 'opacity', '0.5')
    expect(el.style.opacity).toBe('0.5')
  })

  it('flushes anyway once the 60-frame leak guard expires', async () => {
    container = document.createElement('div')
    dispose = solidRender(
      () => (
        <Motion
          data-testid="m"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ type: false }}
        />
      ),
      container,
    )
    const el = container.querySelector('[data-testid="m"]')
    if (!(el instanceof HTMLElement)) throw new Error('motion element not rendered')

    // Never attached: after the cap the gate gives up and dispatches anyway
    // (bounded wait, not a dropped animation).
    await frames(65)
    await untilStyle(el, 'opacity', '0.5')
    expect(el.style.opacity).toBe('0.5')
  })
})
