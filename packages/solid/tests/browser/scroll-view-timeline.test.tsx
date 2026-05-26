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
// scroll-view-timeline.ts — verifies that targets with default/Enter-preset
// offsets get ViewTimeline acceleration, but string offsets do NOT.
describe('scroll-view-timeline', () => {
  function DefaultTarget() {
    let ref!: HTMLDivElement
    const { scrollYProgress } = createScroll({ target: () => ref })
    const opacity = createTransform(scrollYProgress, [0, 1], [1, 0])
    return (
      <div ref={(el) => (ref = el)} style={targetStyle}>
        <motion.div id="default-target" style={{ ...box, opacity }} />
        <span id="default-accelerate">{scrollYProgress.accelerate ? 'true' : 'false'}</span>
      </div>
    )
  }

  function EnterTarget() {
    let ref!: HTMLDivElement
    const { scrollYProgress } = createScroll({
      target: () => ref,
      offset: [
        [0, 1],
        [1, 1],
      ],
    })
    const opacity = createTransform(scrollYProgress, [0, 1], [0, 1])
    return (
      <div ref={(el) => (ref = el)} style={targetStyle}>
        <motion.div id="enter-target" style={{ ...box, opacity }} />
        <span id="enter-accelerate">{scrollYProgress.accelerate ? 'true' : 'false'}</span>
      </div>
    )
  }

  function StringOffsetTarget() {
    let ref!: HTMLDivElement
    const { scrollYProgress } = createScroll({
      target: () => ref,
      offset: ['start end', 'end start'],
    })
    const opacity = createTransform(scrollYProgress, [0, 1], [1, 0])
    return (
      <div ref={(el) => (ref = el)} style={targetStyle}>
        <motion.div id="string-target" style={{ ...box, opacity }} />
        <span id="string-accelerate">{scrollYProgress.accelerate ? 'true' : 'false'}</span>
      </div>
    )
  }

  const spacer = { height: '100vh' }
  const targetStyle = {
    height: '100vh',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    'flex-direction': 'column' as const,
  }
  const box = {
    width: '100px',
    height: '100px',
    background: 'red',
  }

  function setup() {
    return render(() => (
      <>
        <div style={spacer} />
        <DefaultTarget />
        <div style={spacer} />
        <EnterTarget />
        <div style={spacer} />
        <StringOffsetTarget />
        <div style={spacer} />
      </>
    ))
  }

  it('accelerates target with default offset when ViewTimeline supported', async () => {
    setup()
    await wait(200)
    const el = document.getElementById('default-accelerate') as HTMLElement
    const expected = typeof (window as any).ViewTimeline !== 'undefined' ? 'true' : 'false'
    expect(el.innerText).toBe(expected)
  })

  it('accelerates target with Enter preset offset when ViewTimeline supported', async () => {
    setup()
    await wait(200)
    const el = document.getElementById('enter-accelerate') as HTMLElement
    const expected = typeof (window as any).ViewTimeline !== 'undefined' ? 'true' : 'false'
    expect(el.innerText).toBe(expected)
  })

  it('does NOT accelerate target with string offset', async () => {
    setup()
    await wait(200)
    const el = document.getElementById('string-accelerate') as HTMLElement
    expect(el.innerText).toBe('false')
  })
})
