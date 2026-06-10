import { cleanup, render } from '@solidjs/testing-library'
import { isWillChangeMotionValue } from 'motion-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { createWillChange } from '@/primitives/create-will-change'

afterEach(() => cleanup())

describe('createWillChange', () => {
  it('starts as "auto"', () => {
    let willChange: ReturnType<typeof createWillChange> | undefined

    render(() => {
      willChange = createWillChange()
      return null
    })

    expect(willChange!.get()).toBe('auto')
  })

  it('is recognised by motion-dom as a WillChangeMotionValue', () => {
    const willChange = createWillChange()
    expect(isWillChangeMotionValue(willChange)).toBe(true)
  })

  it('upgrades to "transform" when a transform value is added', () => {
    const willChange = createWillChange()
    willChange.add('x')
    expect(willChange.get()).toBe('transform')
  })

  it('ignores values that are neither transforms nor accelerated', () => {
    const willChange = createWillChange()
    willChange.add('background-color')
    expect(willChange.get()).toBe('auto')
  })
})
