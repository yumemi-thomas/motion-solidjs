import { render } from '@solidjs/testing-library'
import { onCleanup, onMount } from 'solid-js'
import { describe, expect, it } from 'vitest'
import { animateMini, stagger } from 'motion'
import { wait, getEl } from './helpers'

const boxStyle = {
  width: '100px',
  height: '100px',
  'background-color': '#fff',
}

describe('animateMini()', () => {
  it('correctly runs an animation', async () => {
    let ref!: HTMLDivElement
    const { unmount } = render(() => {
      onMount(() => {
        const animation = animateMini(ref, { width: 200 }, { duration: 0.1 })
        onCleanup(() => animation.cancel())
      })
      return <div id="box" ref={(el) => (ref = el)} style={boxStyle} />
    })

    await wait(200)
    const el = getEl('#box')
    expect(el.getBoundingClientRect().width).toBe(200)
    expect(el.style.width).toBe('200px')
    unmount()
  })

  it('complete() correctly finishes the animation', async () => {
    let ref!: HTMLDivElement
    const { unmount } = render(() => {
      onMount(() => {
        const animation = animateMini(ref, { width: 200 }, { duration: 20 })
        animation.complete()
        onCleanup(() => animation.cancel())
      })
      return <div id="box" ref={(el) => (ref = el)} style={boxStyle} />
    })

    await wait(200)
    const el = getEl('#box')
    expect(el.getBoundingClientRect().width).toBe(200)
    expect(el.style.width).toBe('200px')
    unmount()
  })

  it('pause() correctly pauses the animation', async () => {
    let ref!: HTMLDivElement
    const { unmount } = render(() => {
      onMount(() => {
        const animation = animateMini(ref, { width: 200 }, { duration: 1 })
        const id = setTimeout(() => animation.pause(), 100)
        onCleanup(() => {
          clearTimeout(id)
          animation.cancel()
        })
      })
      return <div id="box" ref={(el) => (ref = el)} style={boxStyle} />
    })

    await wait(400)
    const el = getEl('#box')
    expect(el.getBoundingClientRect().width).toBeLessThan(200)
    unmount()
  })

  it('autoplay: false leaves the box at its initial state', async () => {
    let ref!: HTMLDivElement
    const { unmount } = render(() => {
      onMount(() => {
        const animation = animateMini(ref, { width: 200 }, { duration: 0.1, autoplay: false })
        onCleanup(() => animation.cancel())
      })
      return <div id="box" ref={(el) => (ref = el)} style={boxStyle} />
    })

    await wait(200)
    const el = getEl('#box')
    expect(el.getBoundingClientRect().width).toBe(100)
    expect(el.style.width).toBe('100px')
    unmount()
  })

  it('play() correctly resumes the animation', async () => {
    let ref!: HTMLDivElement
    const { unmount } = render(() => {
      onMount(() => {
        const animation = animateMini(ref, { width: 200 }, { duration: 0.1 })
        animation.pause()
        animation.play()
        onCleanup(() => animation.cancel())
      })
      return <div id="box" ref={(el) => (ref = el)} style={boxStyle} />
    })

    await wait(200)
    const el = getEl('#box')
    expect(el.getBoundingClientRect().width).toBe(200)
    expect(el.style.width).toBe('200px')
    unmount()
  })

  it('fires its promise on end', async () => {
    let ref!: HTMLDivElement
    const { unmount } = render(() => {
      onMount(() => {
        const animation = animateMini(ref, { width: 200 }, { duration: 0.1 })
        animation.then(() => {
          ref.style.backgroundColor = 'red'
        })
        onCleanup(() => animation.cancel())
      })
      return <div id="box" ref={(el) => (ref = el)} style={boxStyle} />
    })

    await wait(200)
    const el = getEl('#box')
    expect(el.style.backgroundColor).toBe('red')
    unmount()
  })

  it('correctly reads wildcard keyframes', async () => {
    let ref!: HTMLDivElement
    const { unmount } = render(() => {
      onMount(() => {
        const animation = animateMini(ref, { width: [null, 200] }, { duration: 0.1 })
        onCleanup(() => animation.cancel())
      })
      return (
        <div id="box" ref={(el) => (ref = el)} style={boxStyle}>
          content
        </div>
      )
    })

    await wait(200)
    const el = getEl('#box')
    expect(el.getBoundingClientRect().width).toBe(200)
    expect(el.style.width).toBe('200px')
    unmount()
  })

  it('works correctly with stagger', async () => {
    const { unmount } = render(() => {
      onMount(() => {
        const controls = animateMini(
          '#box',
          { opacity: [0, 1] },
          { duration: 0.2, delay: stagger(0.5) },
        )
        onCleanup(() => controls.stop())
      })
      return (
        <div style={{ position: 'relative', padding: '100px' }}>
          <div
            id="box"
            style={{
              width: '100px',
              height: '100px',
              'background-color': 'red',
              opacity: 0,
            }}
          />
        </div>
      )
    })

    await wait(500)
    const el = getEl('#box')
    expect(el.style.opacity).toBe('1')
    unmount()
  })

  it('works correctly with CSS variables', async () => {
    let ref!: HTMLDivElement
    const { unmount } = render(() => {
      onMount(() => {
        try {
          CSS.registerProperty({
            name: '--x',
            syntax: '<length>',
            inherits: false,
            initialValue: '0px',
          })
        } catch {
          // already registered
        }

        const animation = animateMini(ref, { '--x': ['0px', '500px'] }, { duration: 0.1 })
        onCleanup(() => animation.cancel())
      })
      return (
        <div
          id="box"
          ref={(el) => (ref = el)}
          style={{
            width: '100px',
            height: '100px',
            'background-color': '#fff',
            left: 'var(--x)',
            position: 'relative',
          }}
        >
          content
        </div>
      )
    })

    await wait(500)
    const el = getEl('#box')
    expect(el.style.getPropertyValue('--x')).toBe('500px')
    expect(el.getBoundingClientRect().left).toBe(500)
    unmount()
  })
})
