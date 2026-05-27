import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, Show } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { createScroll } from '@/primitives/create-scroll'
import { wait } from './helpers'

afterEach(() => {
  window.scrollTo(0, 0)
  cleanup()
})

// Port of motion-upstream/packages/framer-motion/cypress/integration/
// use-scroll-target-late-ref.ts
describe('createScroll with a target ref hydrated after effects', () => {
  it('tracks the late target element, not the whole window', async () => {
    const [mounted, setMounted] = createSignal(false)
    let targetRef: HTMLDivElement | undefined

    render(() => {
      const scroll = createScroll({
        target: () => targetRef,
        offset: ['start end', 'end start'],
      })

      queueMicrotask(() => setMounted(true))

      return (
        <>
          <div style={{ height: '1000px' }} />
          <Show when={mounted()}>
            <div id="target" ref={(el) => (targetRef = el)} style={{ height: '100px' }} />
          </Show>
          <div style={{ height: '1000px' }} />
          <div id="progress">{scroll.scrollYProgress.get().toFixed(3)}</div>
        </>
      )
    })

    await wait(100)
    expect(document.querySelectorAll('#target')).toHaveLength(1)

    window.scrollTo(0, 400)
    await wait(1000)

    const progress = parseFloat(document.getElementById('progress')?.textContent ?? '1')
    expect(progress).toBeLessThan(0.05)
  })
})
