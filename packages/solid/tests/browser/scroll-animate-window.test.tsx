import { cleanup, render } from '@solidjs/testing-library'
import { onCleanup, onMount } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { animate, animateMini, scroll } from 'motion'
import { motionValue } from 'motion-dom'
import { wait } from './helpers'

afterEach(() => {
  window.scrollTo(0, 0)
  cleanup()
})

// Port of motion-upstream/packages/framer-motion/cypress/integration/scroll.ts
// — the `scroll-animate-window` sub-tests (animate via scroll(), main
// thread + WAAPI).
describe('scroll() animation — window', () => {
  it('updates animation on first frame, before scroll event', async () => {
    const progress = motionValue(0)
    render(() => {
      onMount(() => {
        const a = scroll(
          animate('#color', {
            x: [0, 100],
            opacity: [0, 1],
            backgroundColor: ['#fff', '#000'],
          }),
        )
        const b = scroll(animateMini('#color', { color: ['#000', '#fff'] }))
        const c = scroll(animate(progress, 100))
        onCleanup(() => {
          a()
          b()
          c()
        })
      })
      return (
        <>
          <div style={{ height: '100vh', background: 'red' }} />
          <div style={{ height: '100vh', background: 'green' }} />
          <div style={{ height: '100vh', background: 'blue' }} />
          <div style={{ height: '100vh', background: 'yellow' }} />
          <div
            id="color"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100px',
              height: '100px',
            }}
          />
        </>
      )
    })

    await wait(100)
    const el = document.getElementById('color') as HTMLElement
    expect(getComputedStyle(el).backgroundColor).toBe('rgb(255, 255, 255)')
  })

  it('drives main-thread + WAAPI animations through scroll', async () => {
    const progress = motionValue(0)
    render(() => {
      onMount(() => {
        const a = scroll(
          animate('#color', {
            x: [0, 100],
            opacity: [0, 1],
            backgroundColor: ['#fff', '#000'],
          }),
        )
        const b = scroll(animateMini('#color', { color: ['#000', '#fff'] }))
        const c = scroll(animate(progress, 100))
        onCleanup(() => {
          a()
          b()
          c()
        })
      })
      return (
        <>
          <div style={{ height: '100vh', background: 'red' }} />
          <div style={{ height: '100vh', background: 'green' }} />
          <div style={{ height: '100vh', background: 'blue' }} />
          <div style={{ height: '100vh', background: 'yellow' }} />
          <div
            id="color"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100px',
              height: '100px',
            }}
          />
        </>
      )
    })

    await wait(100)
    // Scroll halfway down the page.
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo(0, max / 2)
    await wait(300)
    const el = document.getElementById('color') as HTMLElement
    // Main thread animate() uses linear RGB mixing for backgroundColor;
    // animateMini uses straight RGB for color. At ~halfway both should
    // be roughly grey-ish.
    const bg = getComputedStyle(el).backgroundColor
    const colorRgb = getComputedStyle(el).color
    expect(bg).not.toBe('rgb(255, 255, 255)')
    expect(bg).not.toBe('rgb(0, 0, 0)')
    expect(colorRgb).not.toBe('rgb(0, 0, 0)')
    expect(colorRgb).not.toBe('rgb(255, 255, 255)')

    const opacity = parseFloat(getComputedStyle(el).opacity)
    expect(opacity).toBeGreaterThan(0.4)
    expect(opacity).toBeLessThan(0.6)
    expect(el.style.transform).toContain('translateX(')
  })
})
