import { render } from '@solidjs/testing-library'
import { onCleanup, onMount } from 'solid-js'
import { describe, expect, it } from 'vitest'
import { createAnimate } from '@/primitives/create-animate'
import { wait } from './helpers'

describe('animation.cancel()', () => {
  it("doesn't throw error on unmount", async () => {
    function App() {
      const [scope, animate] = createAnimate<HTMLDivElement>()

      onMount(() => {
        const controls = animate(scope(), { opacity: 0 }, { duration: 2 })
        onCleanup(() => {
          try {
            controls.cancel()
          } catch (e) {
            const el = scope()
            if (el) el.innerHTML = 'error'
            console.error(e)
          }
        })
      })

      return (
        <div
          ref={scope.set}
          class="box"
          style={{ width: '2rem', height: '2rem', background: 'red' }}
        />
      )
    }

    const { unmount } = render(() => <App />)
    await wait(100)
    const box = document.querySelector('.box') as HTMLElement
    expect(box.textContent).not.toContain('error')
    unmount()
  })
})
