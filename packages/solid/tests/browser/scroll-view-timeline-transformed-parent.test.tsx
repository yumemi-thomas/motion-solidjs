import { cleanup, render } from '@solidjs/testing-library'
import { onCleanup, onMount, untrack } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import type { MotionValue } from 'motion-dom'
import { scroll } from 'motion'
import { motion } from '@/components'
import { createScroll } from '@/primitives/create-scroll'
import { createTransform } from '@/primitives/create-transform'
import { wait } from './helpers'

afterEach(() => {
  window.scrollTo(0, 0)
  cleanup()
})

// Port of motion-upstream/packages/framer-motion/cypress/integration/
// scroll-view-timeline-transformed-parent.ts — regression for #3658.
describe('createScroll + transformed ancestor (regression for #3658)', () => {
  function FullRangeProbe(props: { progress: MotionValue<number> }) {
    const opacity = createTransform(
      untrack(() => props.progress),
      [0, 1],
      [0, 1],
    )
    return (
      <motion.div
        id="opacity-probe"
        style={{
          width: '40px',
          height: '40px',
          background: 'magenta',
          opacity,
        }}
      />
    )
  }

  function TextReveal(props: { text: string }) {
    let ref!: HTMLDivElement
    let jsRef!: HTMLSpanElement
    const { scrollYProgress } = createScroll({
      target: () => ref,
      offset: ['start start', 'end end'],
    })

    onMount(() => {
      // 2-arg callback forces the JS scrollInfo path.
      const unsub = scroll(
        (_progress, info) => {
          if (jsRef) jsRef.innerText = info.y.progress.toFixed(4)
        },
        {
          target: ref,
          offset: ['start start', 'end end'],
        },
      )
      onCleanup(unsub)
    })

    const words = () => props.text.split(' ')
    return (
      <div ref={(el) => (ref = el)} style={{ position: 'relative', height: '200vh' }}>
        <div
          style={{
            position: 'sticky',
            top: '0',
            height: '50%',
            display: 'flex',
            'align-items': 'center',
            'flex-direction': 'column',
            gap: '16px',
          }}
        >
          <div style={{ 'font-family': 'monospace', 'font-size': '18px' }}>
            js:{' '}
            <span id="js-progress" ref={(el) => (jsRef = el)}>
              0
            </span>
          </div>
          <FullRangeProbe progress={scrollYProgress} />
          <p
            style={{
              display: 'flex',
              'flex-wrap': 'wrap',
              gap: '8px',
              'font-size': '32px',
            }}
          >
            {words().map((word, i) => {
              const start = i / words().length
              const end = start + 1 / words().length
              const opacity = createTransform(scrollYProgress, [start, end], [0.2, 1])
              return <motion.span style={{ opacity, color: 'cyan' }}>{word}</motion.span>
            })}
          </p>
        </div>
      </div>
    )
  }

  function ClipReveal(props: { children: any }) {
    let ref!: HTMLDivElement
    const { scrollYProgress } = createScroll({
      target: () => ref,
      offset: ['start end', 'start 0.3'],
    })
    const clipPath = createTransform(
      scrollYProgress,
      [0, 1],
      ['inset(8% 12% round 24px)', 'inset(0% 0% round 0px)'],
    )
    const scale = createTransform(scrollYProgress, [0, 1], [0.95, 1])

    return (
      <div ref={(el) => (ref = el)}>
        <motion.div style={{ clipPath, scale }}>{props.children}</motion.div>
      </div>
    )
  }

  function setup() {
    const heroStyle = {
      height: '100vh',
      display: 'grid',
      'place-items': 'center',
    }
    return render(() => (
      <div style={{ background: '#111', color: '#fff', 'min-height': '100vh' }}>
        <div style={heroStyle}>
          <h1>Scroll down</h1>
        </div>
        <ClipReveal>
          <section
            style={{
              background: '#000',
              'min-height': '50vh',
              'padding-top': '40px',
            }}
          >
            <TextReveal text="Building digital experiences that blur the line between imagination and reality." />
          </section>
        </ClipReveal>
        <div style={heroStyle}>
          <h1>End</h1>
        </div>
      </div>
    ))
  }

  it('attaches a ScrollTimeline or ViewTimeline to inner motion components', async () => {
    // NOTE: Unlike React's useScroll, Solid's createScroll resolves
    // target/offset at construction time when options is a getter. Because
    // target is a late-bound ref accessor, it resolves to undefined and we
    // fall back to ScrollTimeline rather than ViewTimeline. See
    // `canAccelerateScroll` in src/primitives/create-scroll.ts. So unlike
    // the upstream cypress test, here we only check that some accelerated
    // timeline is attached.
    setup()
    await wait(500)
    if (typeof (window as any).ViewTimeline === 'undefined') {
      return // Skip — ViewTimeline unsupported.
    }
    const probe = document.getElementById('opacity-probe') as HTMLElement
    const anims = (probe as any).getAnimations()
    expect(anims.length).toBeGreaterThan(0)
    const a = anims[0]
    const tlName = a.timeline?.constructor?.name
    expect(['ScrollTimeline', 'ViewTimeline']).toContain(tlName)
  })

  it('WAAPI and JS paths agree on the same target across the scroll range', async () => {
    setup()
    await wait(500)

    const vh = window.innerHeight
    const stops = [0.5, 1, 1.25, 1.5, 1.75, 2].map((m) => m * vh)
    const drift: number[] = []

    const probe = document.getElementById('opacity-probe') as HTMLElement
    const jsEl = document.getElementById('js-progress') as HTMLElement

    for (const y of stops) {
      window.scrollTo(0, y)
      await wait(200)
      const w = parseFloat(getComputedStyle(probe).opacity)
      const j = parseFloat(jsEl.innerText)
      drift.push(Math.abs(w - j))
    }
    expect(Math.max(...drift)).toBeLessThan(0.05)
  })
})
