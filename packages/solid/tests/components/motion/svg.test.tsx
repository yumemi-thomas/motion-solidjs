import { cleanup, render } from '@solidjs/testing-library'
import { motionValue } from 'motion-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { Motion } from '@/components'
import { delay } from '#tests/utils'

afterEach(() => {
  cleanup()
})

describe('svg', () => {
  it('should render MotionValue style as SVG attributes', async () => {
    const opacity = motionValue(0)
    const stroke = motionValue('red')
    const wrapper = render(() => (
      <Motion
        as="path"
        style={{
          opacity,
          stroke,
        }}
        data-testid="path"
      />
    ))

    const path = wrapper.getByTestId('path')
    expect(path.style.opacity).toBeFalsy()
    expect(path.style.stroke).toBeFalsy()
    expect(path.getAttribute('stroke')).toBe('red')
    expect(path.getAttribute('opacity')).toBe('0')

    opacity.set(1)
    stroke.set('blue')
    await delay(100)

    expect(path.style.opacity).toBeFalsy()
    expect(path.style.stroke).toBeFalsy()
    expect(path.getAttribute('stroke')).toBe('blue')
    expect(path.getAttribute('opacity')).toBe('1')
  })

  it('should update stroke-width through attributes instead of style', async () => {
    const strokeWidth = motionValue(2)
    const wrapper = render(() => (
      <Motion
        as="path"
        style={{
          strokeWidth,
        }}
        data-testid="path"
      />
    ))

    const path = wrapper.getByTestId('path')
    expect(path.style.strokeWidth).toBeFalsy()
    expect(path.getAttribute('stroke-width')).toBe('2')

    strokeWidth.set(4)
    await delay(100)

    expect(path.style.strokeWidth).toBeFalsy()
    expect(path.getAttribute('stroke-width')).toBe('4')
  })
})
