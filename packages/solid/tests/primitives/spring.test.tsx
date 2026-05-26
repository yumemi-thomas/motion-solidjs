import { createRoot } from 'solid-js'
import { motionValue } from 'motion-dom'
import { describe, expect, it } from 'vitest'
import { createSpring } from '@/primitives/values'

describe('createSpring', () => {
  it('creates a motion value seeded from a primitive', () => {
    createRoot((dispose) => {
      const value = createSpring(10)
      expect(value.get()).toBe(10)
      dispose()
    })
  })

  it('creates a motion value seeded from another motion value', () => {
    createRoot((dispose) => {
      const source = motionValue(20)
      const value = createSpring(source)
      expect(value.get()).toBe(20)
      dispose()
    })
  })
})
