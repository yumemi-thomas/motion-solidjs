import { render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, it } from 'vitest'
import { motion } from '@/components'
import type { ViewportOptions } from '@/features/gestures/in-view'
import { wait } from './helpers'

// Subset matching what these tests exercise. `margin` follows
// `ViewportOptions['margin']` (a template-literal `MarginType`), not plain
// `string`, so the prop assignment narrows cleanly.
type ViewportOpts = Pick<ViewportOptions, 'amount' | 'once' | 'margin'>

function mount(opts: ViewportOpts = {}) {
  const [inViewport, setInViewport] = createSignal(false)
  return render(() => (
    <div style={{ 'padding-top': '700px' }}>
      <motion.div
        id="box"
        initial={false}
        transition={{ duration: 0.01 }}
        animate={{ background: 'rgba(255,0,0,1)' }}
        whileInView={{ background: 'rgba(0,255,0,1)' }}
        viewport={opts}
        style={{ width: '100px', height: '100px' }}
        onViewportEnter={() => setInViewport(true)}
        onViewportLeave={() => setInViewport(false)}
      >
        {inViewport() ? 'In' : 'Out'}
      </motion.div>
    </div>
  ))
}

describe('whileInView', () => {
  it('animates when an element enters the viewport', async () => {
    const { unmount } = mount()
    await wait(50)
    const initial = document.getElementById('box') as HTMLElement
    expect(initial.style.backgroundColor).toBe('rgb(255, 0, 0)')
    expect(initial.innerHTML).toBe('Out')

    window.scrollTo(0, 50)
    await wait(50)
    const after = document.getElementById('box') as HTMLElement
    expect(after.style.backgroundColor).toBe('rgb(0, 255, 0)')
    expect(after.innerHTML).toBe('In')
    window.scrollTo(0, 0)
    unmount()
  })

  it('animates when an element leaves the viewport', async () => {
    const { unmount } = mount()
    await wait(50)
    window.scrollTo(0, 0)
    await wait(50)
    const box = document.getElementById('box') as HTMLElement
    expect(box.style.backgroundColor).toBe('rgb(255, 0, 0)')
    expect(box.innerHTML).toBe('Out')
    unmount()
  })

  it("animates only when element fully enters with amount='all'", async () => {
    const { unmount } = mount({ amount: 'all' })
    await wait(50)
    let box = document.getElementById('box') as HTMLElement
    expect(box.style.backgroundColor).toBe('rgb(255, 0, 0)')

    window.scrollTo(0, 50)
    await wait(50)
    box = document.getElementById('box') as HTMLElement
    expect(box.style.backgroundColor).toBe('rgb(255, 0, 0)')

    window.scrollTo(0, 150)
    await wait(50)
    box = document.getElementById('box') as HTMLElement
    expect(box.style.backgroundColor).toBe('rgb(0, 255, 0)')
    window.scrollTo(0, 0)
    unmount()
  })

  it('animates once and does not revert when leaving (once=true)', async () => {
    const { unmount } = mount({ once: true })
    await wait(50)
    expect((document.getElementById('box') as HTMLElement).style.backgroundColor).toBe(
      'rgb(255, 0, 0)',
    )

    window.scrollTo(0, 50)
    await wait(50)
    expect((document.getElementById('box') as HTMLElement).style.backgroundColor).toBe(
      'rgb(0, 255, 0)',
    )

    window.scrollTo(0, 0)
    await wait(50)
    expect((document.getElementById('box') as HTMLElement).style.backgroundColor).toBe(
      'rgb(0, 255, 0)',
    )
    unmount()
  })
})
