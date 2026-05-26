import { render } from '@solidjs/testing-library'
import { onCleanup, onMount } from 'solid-js'
import { describe, expect, it } from 'vitest'
import { animate } from 'motion'
import { wait } from './helpers'

describe('animate() with autoplay: false', () => {
  it('does not start WAAPI animation when autoplay is false', async () => {
    let ref!: HTMLDivElement
    const { unmount } = render(() => {
      onMount(() => {
        const animation = animate(ref, { opacity: 0.5 }, { duration: 10, autoplay: false })
        onCleanup(() => animation.stop())
      })
      return (
        <div
          id="box"
          ref={(el) => (ref = el)}
          style={{
            width: '100px',
            height: '100px',
            'background-color': '#fff',
            opacity: 1,
          }}
        />
      )
    })

    await wait(200)
    const el = document.getElementById('box') as HTMLElement
    expect(parseFloat(getComputedStyle(el).opacity)).toBe(1)
    unmount()
  })
})
