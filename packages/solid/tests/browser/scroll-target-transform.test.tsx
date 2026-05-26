import { cleanup, render } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { createScroll } from '@/primitives/create-scroll'
import { createTransform } from '@/primitives/create-transform'
import { wait } from './helpers'

afterEach(() => {
  window.scrollTo(0, 0)
  cleanup()
})

// Port of motion-upstream/packages/framer-motion/cypress/integration/
// scroll-target-transform.ts
describe('scroll-target-transform', () => {
  function setup() {
    return render(() => {
      let targetRef!: HTMLDivElement
      const scrollState = createScroll({
        target: () => targetRef,
        offset: ['start end', 'end start'],
      })
      const opacity = createTransform(scrollState.scrollYProgress, [0, 1], [1, 0])
      const y = createTransform(scrollState.scrollYProgress, [0, 1], [0, -100])
      return (
        <>
          <div style={{ height: '100vh' }} />
          <div
            ref={(el) => (targetRef = el)}
            style={{
              height: '100vh',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
            }}
          >
            <motion.div
              id="target"
              style={{
                width: '100px',
                height: '100px',
                background: 'red',
                opacity,
                y,
              }}
            />
          </div>
          <div style={{ height: '100vh' }} />
          <div style={{ height: '100vh' }} />
          <span id="has-accelerate">
            {scrollState.scrollYProgress.accelerate ? 'true' : 'false'}
          </span>
        </>
      )
    })
  }

  it('reports whether ScrollTimeline acceleration is available', async () => {
    setup()
    await wait(200)
    const el = document.getElementById('has-accelerate') as HTMLElement
    // ScrollTimeline isn't usable for a target whose offset spans
    // start end → end start, so accelerate is `false`.
    expect(el.innerText).toBe('false')
  })

  it('drives opacity through scroll', async () => {
    setup()
    await wait(200)
    const before = parseFloat(getComputedStyle(document.getElementById('target')!).opacity)
    expect(before).toBeGreaterThan(0)

    window.scrollTo(0, document.documentElement.scrollHeight)
    await wait(300)
    const after = parseFloat(getComputedStyle(document.getElementById('target')!).opacity)
    expect(after).toBeLessThan(1)
  })
})
