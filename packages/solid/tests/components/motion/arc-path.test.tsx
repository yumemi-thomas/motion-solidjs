import { cleanup, render } from '@solidjs/testing-library'
import { arc, motionValue } from 'motion-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { Motion } from '@/components/motion-max'
import { delay } from '#tests/utils'

afterEach(() => cleanup())

// Port of motion-upstream PR #3699: `transition.path = arc()` routes
// keyframe x/y through a bezier curve instead of a straight-line tween.
// Solid wiring lives in `src/primitives/animate-target.ts` (the no-VE
// `animateTarget` path) — it claims `target.x`/`target.y`, drives a
// dedicated `pathRotation` MV when the arc has `rotate`, then deletes
// the keys so the per-key loop skips them.
//
// Animation timing here relies on happy-dom's RAF + motion-dom's frame
// loop — same setup as `tests/primitives/follow-value.test.tsx`.

describe('transition.path = arc()', () => {
  it('exposes the MotionPath shape', () => {
    const path = arc()
    expect(typeof path.interpolateProjection).toBe('function')
    expect(typeof path.animateVisualElement).toBe('function')
  })

  it('accepts options without throwing', () => {
    expect(() => arc({})).not.toThrow()
    expect(() => arc({ strength: 1, peak: 0.5, direction: 'cw', rotate: true })).not.toThrow()
    expect(() => arc({ direction: 'ccw' })).not.toThrow()
  })

  it('deviates y from the straight-line baseline mid-flight (horizontal travel)', async () => {
    // Horizontal chord (0,0) → (200,0). A straight-line tween keeps y at 0
    // throughout. `arc()` bulges perpendicular to the chord, so mid-flight
    // y must be non-zero. Use a linear tween so we can sample at a known
    // point along the curve.
    const x = motionValue(0)
    const y = motionValue(0)

    render(() => (
      <Motion
        animate={{ x: 200 }}
        style={{ x, y }}
        transition={{ path: arc({ strength: 1 }), type: 'tween', ease: 'linear', duration: 0.4 }}
      />
    ))

    // ~25% into a 400ms linear tween. y should have deflected; for a
    // straight-line path it would still be exactly 0.
    await delay(100)
    expect(Math.abs(y.get())).toBeGreaterThan(10)
    // x should still be between the endpoints (not yet at 200).
    expect(x.get()).toBeGreaterThan(0)
    expect(x.get()).toBeLessThan(200)
  })

  it('lands at the configured target after the animation completes', async () => {
    const x = motionValue(0)
    const y = motionValue(0)

    render(() => (
      <Motion
        animate={{ x: 200 }}
        style={{ x, y }}
        transition={{ path: arc({ strength: 1 }), type: 'tween', ease: 'linear', duration: 0.2 }}
      />
    ))

    await delay(400)
    // Past end + buffer — both values should settle on their final positions.
    // The arc clears its pathRotation contribution on completion and
    // explicitly sets x/y to the configured (xTo, yTo).
    expect(x.get()).toBe(200)
    expect(y.get()).toBe(0)
  })

  it('does nothing when neither x nor y is in the target', async () => {
    // arc()'s animateVisualElement returns early without `x` or `y` in
    // the target. Other keys (opacity here) animate normally.
    const opacity = motionValue(0)

    render(() => (
      <Motion
        animate={{ opacity: 1 }}
        style={{ opacity }}
        transition={{ path: arc(), type: 'tween', ease: 'linear', duration: 0.2 }}
      />
    ))

    await delay(300)
    expect(opacity.get()).toBe(1)
  })
})
