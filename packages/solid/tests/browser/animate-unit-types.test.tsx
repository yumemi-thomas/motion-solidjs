import { render } from '@solidjs/testing-library'
import { createSignal, Show } from 'solid-js'
import { describe, expect, it } from 'vitest'
import { AnimatePresence, motion } from '@/components'
import { wait } from './helpers'

describe('Unit conversion', () => {
  it('animates height: auto correctly', async () => {
    let ref!: HTMLDivElement
    const output: Array<string | number> = []
    const [open, setOpen] = createSignal(true)

    const { unmount } = render(() => (
      <div style={{ height: '100px', width: '100px', display: 'flex' }}>
        <AnimatePresence>
          <Show when={open()}>
            <motion.div
              id="test"
              ref={(el) => (ref = el)}
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              style={{ width: '100px', background: 'red' }}
              transition={{ duration: 0.1 }}
              onUpdate={({ height }) => {
                output.push(height)
              }}
              onAnimationComplete={() => {
                if (output.length === 1) ref.innerHTML = 'Error'
                requestAnimationFrame(() => {
                  if (ref?.style.height !== 'auto') ref.innerHTML = 'Error'
                })
              }}
              onClick={() => setOpen(false)}
            />
          </Show>
        </AnimatePresence>
      </div>
    ))

    await wait(200)
    expect((document.getElementById('test') as HTMLElement).innerText).not.toBe('Error')
    unmount()
  })

  it('animates translation from px to percent', async () => {
    let ref!: HTMLDivElement
    const output: Array<string | number> = []
    const [open, setOpen] = createSignal(true)

    const { unmount } = render(() => (
      <div style={{ height: '100px', width: '200px', display: 'flex' }}>
        <AnimatePresence>
          <Show when={open()}>
            <motion.div
              id="test"
              ref={(el) => (ref = el)}
              animate={{ x: '100%', y: '100%', rotate: '-30deg' }}
              style={{ width: '200px', background: 'red' }}
              onClick={() => setOpen(false)}
              transition={{ duration: 2 }}
              onUpdate={({ x }) => {
                output.push(x)
              }}
              onAnimationComplete={() => {
                if (output[0] === '100%') ref.innerHTML = 'Error'
              }}
            />
          </Show>
        </AnimatePresence>
      </div>
    ))

    await wait(200)
    expect((document.getElementById('test') as HTMLElement).innerText).not.toBe('Error')
    unmount()
  })
})
