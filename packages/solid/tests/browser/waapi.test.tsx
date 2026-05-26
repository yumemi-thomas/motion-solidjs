import { render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { wait } from './helpers'

describe('waapi', () => {
  it('animations are correctly interrupted', async () => {
    const [state, setState] = createSignal(false)
    const { unmount } = render(() => (
      <section
        style={{
          position: 'relative',
          display: 'flex',
          'flex-direction': 'column',
          padding: '100px',
        }}
      >
        <motion.div
          id="box"
          transition={{ duration: 1 }}
          initial={{ transform: 'scale(1)', opacity: 1 }}
          animate={{
            transform: `scale(${state() ? 1 : 2})`,
            opacity: state() ? 1 : 0,
          }}
          onClick={() => setState(!state())}
          style={{
            width: '100px',
            height: '100px',
            position: 'relative',
            top: '100px',
            left: '100px',
            'background-color': 'red',
            opacity: 1,
          }}
        >
          Content
        </motion.div>
      </section>
    ))

    await wait(500)
    const box = document.getElementById('box') as HTMLElement
    expect(getComputedStyle(box).opacity).not.toBe('1')
    expect(box.getBoundingClientRect().width).not.toBe(100)
    box.click()
    await wait(100)
    const box2 = document.getElementById('box') as HTMLElement
    expect(getComputedStyle(box2).opacity).not.toBe('1')
    expect(Math.floor(box2.getBoundingClientRect().width)).not.toBe(100)
    unmount()
  })

  it("Default duration doesn't override duration: 0", async () => {
    const [state, setState] = createSignal(false)
    const { unmount } = render(() => (
      <section
        style={{
          position: 'relative',
          display: 'flex',
          'flex-direction': 'column',
          padding: '100px',
        }}
      >
        <motion.div
          id="box"
          transition={{ duration: 0 }}
          initial={{ transform: 'scale(1)', opacity: 1 }}
          animate={{
            transform: `scale(${state() ? 1 : 2})`,
            opacity: state() ? 1 : 0,
          }}
          onClick={() => setState(!state())}
          style={{
            width: '100px',
            height: '100px',
            position: 'relative',
            top: '100px',
            left: '100px',
            'background-color': 'red',
            opacity: 1,
          }}
        >
          Content
        </motion.div>
      </section>
    ))

    await wait(50)
    const box = document.getElementById('box') as HTMLElement
    expect(getComputedStyle(box).opacity).toBe('0')
    expect(box.getBoundingClientRect().width).toBe(200)

    box.click()
    await wait(200)
    const box2 = document.getElementById('box') as HTMLElement
    expect(getComputedStyle(box2).opacity).toBe('1')
    expect(Math.floor(box2.getBoundingClientRect().width)).toBe(100)
    unmount()
  })
})
