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
// scroll-accelerate.ts — checks that ScrollTimeline-backed acceleration
// is propagated to direct useTransform results but NOT to chained ones.
describe('scroll-accelerate', () => {
  function setup() {
    return render(() => {
      const { scrollYProgress } = createScroll()
      const opacity = createTransform(scrollYProgress, [0, 0.5, 1], [1, 0.5, 0])
      const backgroundColor = createTransform(scrollYProgress, [0, 1], ['#ff0000', '#0000ff'])

      const intermediate = createTransform(scrollYProgress, [0, 1], [1, 0.5])
      const chainedOpacity = createTransform(intermediate, [1, 0.75], [0, 1])

      const spacer = { height: '100vh' }
      const box = {
        position: 'fixed' as const,
        top: '0',
        left: '0',
        width: '100px',
        height: '100px',
      }

      return (
        <>
          <div style={spacer} />
          <div style={spacer} />
          <div style={spacer} />
          <div style={spacer} />
          <motion.div id="direct" style={{ ...box, opacity, backgroundColor }} />
          <motion.div id="chained" style={{ ...box, opacity: chainedOpacity, top: '110px' }} />
          <span id="direct-accelerated">{opacity.accelerate ? 'true' : 'false'}</span>
          <span id="chained-accelerated">{chainedOpacity.accelerate ? 'true' : 'false'}</span>
          <span id="bg-accelerated">{backgroundColor.accelerate ? 'true' : 'false'}</span>
        </>
      )
    })
  }

  it('propagates acceleration for direct createTransform from scroll', async () => {
    setup()
    await wait(200)
    const el = document.getElementById('direct-accelerated') as HTMLElement
    const expected = typeof (window as any).ScrollTimeline !== 'undefined' ? 'true' : 'false'
    expect(el.innerText).toBe(expected)
  })

  it('propagates acceleration for non-acceleratable properties too', async () => {
    setup()
    await wait(200)
    const el = document.getElementById('bg-accelerated') as HTMLElement
    const expected = typeof (window as any).ScrollTimeline !== 'undefined' ? 'true' : 'false'
    expect(el.innerText).toBe(expected)
  })

  it('does not propagate acceleration for chained createTransform', async () => {
    setup()
    await wait(200)
    const el = document.getElementById('chained-accelerated') as HTMLElement
    expect(el.innerText).toBe('false')
  })
})
