import { render } from '@solidjs/testing-library'
import { createSignal, onMount } from 'solid-js'
import { describe, expect, it } from 'vitest'
import { animate } from 'motion'
import { wait } from './helpers'

describe('animate() filter blur (#3102)', () => {
  it('animates filter blur values correctly including re-animation', async () => {
    let ref!: HTMLDivElement
    const [done, setDone] = createSignal(false)
    const [reanimated, setReanimated] = createSignal(false)

    const { unmount } = render(() => {
      onMount(() => {
        const anim = animate(ref, { filter: ['blur(10px)', 'blur(0px)'] }, { duration: 0.3 })
        anim.then(() => {
          setDone(true)
          const anim2 = animate(ref, { filter: ['blur(10px)', 'blur(0px)'] }, { duration: 0.3 })
          anim2.then(() => setReanimated(true))
        })
      })
      return (
        <div>
          <div
            id="box"
            ref={(el) => (ref = el)}
            style={{ width: '100px', height: '100px', background: 'red' }}
          />
          <p id="done">{String(done())}</p>
          <p id="reanimated">{String(reanimated())}</p>
        </div>
      )
    })

    await wait(1000)
    expect(document.getElementById('done')!.textContent).toBe('true')
    expect(document.getElementById('reanimated')!.textContent).toBe('true')
    const filter = getComputedStyle(document.getElementById('box') as HTMLElement).filter
    expect(filter === 'none' || filter === 'blur(0px)').toBe(true)
    unmount()
  })
})
