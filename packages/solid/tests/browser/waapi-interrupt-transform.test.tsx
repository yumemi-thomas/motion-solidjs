import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, onCleanup, onMount } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { createAnimate } from '@/primitives/create-animate'
import { wait } from './helpers'

afterEach(() => cleanup())

describe('createAnimate WAAPI interruption', () => {
  it('should not jump to origin when interrupting transform animation', async () => {
    const [result, setResult] = createSignal('')
    let minLeft = Infinity
    let startLeft = 0
    let trackingStarted = false
    let tracking = true

    render(() => {
      const [scope, animate] = createAnimate<HTMLDivElement>()

      onMount(() => {
        const el = scope()!
        startLeft = el.getBoundingClientRect().left

        const track = () => {
          if (!tracking || !scope()) return
          if (trackingStarted) {
            const left = scope()!.getBoundingClientRect().left
            minLeft = Math.min(minLeft, left)
          }
          requestAnimationFrame(track)
        }
        requestAnimationFrame(track)

        animate(scope()!, { transform: 'translateX(200px)' }, { duration: 2, ease: 'linear' })

        const t0 = setTimeout(() => {
          trackingStarted = true
        }, 500)
        const t1 = setTimeout(() => {
          animate(scope()!, { transform: 'translateX(400px)' }, { duration: 2, ease: 'linear' })
        }, 800)
        const t2 = setTimeout(() => {
          tracking = false
          setResult(String(Math.round(minLeft - startLeft)))
        }, 2000)

        onCleanup(() => {
          tracking = false
          clearTimeout(t0)
          clearTimeout(t1)
          clearTimeout(t2)
        })
      })

      return (
        <>
          <div
            ref={scope.set}
            id="box"
            style={{ width: '100px', height: '100px', background: 'red' }}
          />
          <div id="result">{result()}</div>
        </>
      )
    })

    await wait(2500)
    const minOffset = parseInt(
      (document.getElementById('result') as HTMLElement).textContent || '0',
    )
    expect(minOffset).toBeGreaterThan(15)
  }, 5000)
})
