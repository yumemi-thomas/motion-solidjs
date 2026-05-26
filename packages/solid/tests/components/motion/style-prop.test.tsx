import { cleanup, render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import type { MotionStyleProps } from '@/types'

afterEach(() => {
  cleanup()
})

describe('style prop', () => {
  it('updates transforms when passed a new value', async () => {
    const [x, setX] = createSignal(0)
    const style = (): MotionStyleProps => ({ x: x() })
    const wrapper = render(() => <motion.div style={style()} />)
    const element = wrapper.container.firstElementChild as HTMLElement

    expect(element.style.transform || 'none').toBe('none')

    setX(1)
    await Promise.resolve()

    expect(element.style.transform).toBe('translateX(1px)')

    setX(0)
    await Promise.resolve()

    expect(element.style.transform || 'none').toBe('none')
  })

  it('does not update transforms that are handled by animation props', async () => {
    const [x, setX] = createSignal(0)
    const style = (): MotionStyleProps => ({ x: x() })
    const wrapper = render(() => (
      <motion.div initial={{ x: 1 }} animate={{ x: 200 }} style={style()} />
    ))
    const element = wrapper.container.firstElementChild as HTMLElement

    expect(element.style.transform).toBe('translateX(1px)')

    setX(2)
    await Promise.resolve()

    expect(element.style.transform).not.toBe('translateX(2px)')
  })
})
