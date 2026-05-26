import { render } from '@solidjs/testing-library'
import { onCleanup, onMount } from 'solid-js'
import { describe, expect, it } from 'vitest'
import { animate, pipe } from 'motion'
import { wait } from './helpers'

function testAnimation(selector: string, values: object) {
  const element = document.querySelector(selector)
  if (!element) return () => {}

  const animation = animate(element, values, { duration: 1, ease: 'linear' })
  animation.time = 0.5
  animation.pause()

  return () => animation.cancel()
}

describe('animate() x read transform value', () => {
  it('correctly reads and animates transform values', async () => {
    const box = {
      width: '100px',
      height: '100px',
      background: 'red',
    }
    const { unmount } = render(() => {
      onMount(() => {
        const cleanup = pipe(
          testAnimation('.translate', { x: 200, y: 200 }),
          testAnimation('.rotate', { rotate: 100 }),
          testAnimation('.scale', { scale: 4 }),
        ) as () => void
        onCleanup(cleanup)
      })
      return (
        <div>
          <div style={{ ...box, transform: 'translate(100px, 100px)' }} class="translate" />
          <div style={{ ...box, transform: 'rotate(90deg)' }} class="rotate" />
          <div style={{ ...box, transform: 'scale(2)' }} class="scale" />
        </div>
      )
    })

    await wait(500)
    expect((document.querySelector('.translate') as HTMLElement).style.transform).toContain(
      'translateX(150px)',
    )
    expect((document.querySelector('.rotate') as HTMLElement).style.transform).toContain(
      'rotate(95deg)',
    )
    expect((document.querySelector('.scale') as HTMLElement).style.transform).toContain('scale(3)')
    unmount()
  })
})
