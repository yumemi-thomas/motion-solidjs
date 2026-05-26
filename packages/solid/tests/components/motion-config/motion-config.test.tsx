import { render } from '@solidjs/testing-library'
import { motionValue } from 'motion-dom'
import { describe, expect, it } from 'vitest'
import { Motion } from '@/components/motion-max'
import { delay } from '#tests/utils'
import MotionConfig from '@/components/motion-config/motion-config'
import { createMotionConfig } from '@/components/motion-config/context'

describe('MotionConfig', () => {
  it('provides reducedMotion to descendants', () => {
    let reducedMotion: string | undefined

    function Consumer() {
      const config = createMotionConfig()
      reducedMotion = config().reducedMotion
      return null
    }

    render(() => (
      <MotionConfig reducedMotion="always">
        <Consumer />
      </MotionConfig>
    ))

    expect(reducedMotion).toBe('always')
  })

  it('inherits parent config and overrides provided keys', () => {
    let nonce: string | undefined
    let reducedMotion: string | undefined

    function Consumer() {
      const config = createMotionConfig()
      nonce = config().nonce
      reducedMotion = config().reducedMotion
      return null
    }

    render(() => (
      <MotionConfig nonce="outer" reducedMotion="always">
        <MotionConfig reducedMotion="never">
          <Consumer />
        </MotionConfig>
      </MotionConfig>
    ))

    expect(nonce).toBe('outer')
    expect(reducedMotion).toBe('never')
  })

  it('reducedMotion always applies the target value immediately', async () => {
    const scale = motionValue(1)

    render(() => (
      <MotionConfig reducedMotion="always">
        <Motion animate={{ scale: 0.5 }} style={{ scale }} />
      </MotionConfig>
    ))

    await delay(20)
    expect(scale.get()).toBe(0.5)
  })

  it('reducedMotion="always" snaps transforms but still animates opacity', async () => {
    // Mirrors upstream `MotionConfig/__tests__/index.test.tsx`:
    // motion-dom's `positionalKeys` (width/height/top/left/right/bottom +
    // transform props) snap to target with reduced motion; everything
    // else (opacity, color, etc.) keeps its declared transition. The
    // Solid port wires this in `animate-target.ts` by stamping
    // `type: false` only when the key is in `positionalKeys`.
    const x = motionValue(0)
    const opacity = motionValue(0)

    render(() => (
      <MotionConfig reducedMotion="always">
        <Motion
          animate={{ x: 100, opacity: 1 }}
          transition={{ duration: 2 }}
          style={{ x, opacity }}
        />
      </MotionConfig>
    ))

    // One frame is enough for the transform to snap; opacity should still
    // be mid-tween (i.e. not yet 1).
    await delay(20)
    expect(x.get()).toBe(100)
    expect(opacity.get()).not.toBe(1)
  })
})
