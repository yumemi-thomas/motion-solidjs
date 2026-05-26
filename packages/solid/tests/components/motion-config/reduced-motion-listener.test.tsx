import { render } from '@solidjs/testing-library'
import { hasReducedMotionListener } from 'motion-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import MotionConfig from '@/components/motion-config/motion-config'
import { motion } from '@/components'

// Port of motion-upstream/packages/framer-motion/src/utils/reduced-motion/__tests__/index.test.tsx
//
// Asserts that motion-dom's global listener-init only runs when a motion
// component is rendered under `MotionConfig reducedMotion="user"` — the
// only config value that actually needs the live OS-level preference. For
// `"never"` / `"always"` the visual element has a static answer and the
// listener should stay un-init'd. This used to fail in the Solid port
// because `createReducedMotion` ran its own matchMedia listener without
// touching motion-dom's `hasReducedMotionListener` flag.

beforeEach(() => {
  // Reset the listener state before each test. Mirrors upstream.
  hasReducedMotionListener.current = false
})

describe('reduced-motion listener initialization', () => {
  it('does not initialize the listener when reducedMotion is "never"', () => {
    render(() => (
      <MotionConfig reducedMotion="never">
        <motion.div animate={{ opacity: 1 }} />
      </MotionConfig>
    ))
    expect(hasReducedMotionListener.current).toBe(false)
  })

  it('does not initialize the listener when reducedMotion is "always"', () => {
    render(() => (
      <MotionConfig reducedMotion="always">
        <motion.div animate={{ opacity: 1 }} />
      </MotionConfig>
    ))
    expect(hasReducedMotionListener.current).toBe(false)
  })

  it('initializes the listener when reducedMotion is "user"', () => {
    render(() => (
      <MotionConfig reducedMotion="user">
        <motion.div animate={{ opacity: 1 }} />
      </MotionConfig>
    ))
    expect(hasReducedMotionListener.current).toBe(true)
  })

  it('does not initialize the listener with the default config (defaults to "never")', () => {
    render(() => <motion.div animate={{ opacity: 1 }} />)
    expect(hasReducedMotionListener.current).toBe(false)
  })

  it('initializes the listener only once across multiple children with "user" config', () => {
    render(() => (
      <MotionConfig reducedMotion="user">
        <motion.div animate={{ opacity: 1 }} />
        <motion.div animate={{ x: 100 }} />
        <motion.div animate={{ scale: 1.5 }} />
      </MotionConfig>
    ))
    // motion-dom's `initPrefersReducedMotion` is idempotent — the flag is
    // either true or false, not a count. So the assertion is just "true".
    expect(hasReducedMotionListener.current).toBe(true)
  })

  it('"never" and "always" siblings do not trigger the listener', () => {
    render(() => (
      <>
        <MotionConfig reducedMotion="never">
          <motion.div data-testid="never" animate={{ opacity: 1 }} />
        </MotionConfig>
        <MotionConfig reducedMotion="always">
          <motion.div data-testid="always" animate={{ opacity: 1 }} />
        </MotionConfig>
      </>
    ))
    expect(hasReducedMotionListener.current).toBe(false)
  })

  it('a later "user" config triggers the listener after a "never" mount did not', () => {
    // First render: "never" — listener should stay un-init'd.
    const first = render(() => (
      <MotionConfig reducedMotion="never">
        <motion.div animate={{ opacity: 1 }} />
      </MotionConfig>
    ))
    expect(hasReducedMotionListener.current).toBe(false)
    first.unmount()

    // Second render: "user" — listener should init.
    hasReducedMotionListener.current = false
    render(() => (
      <MotionConfig reducedMotion="user">
        <motion.div animate={{ opacity: 1 }} />
      </MotionConfig>
    ))
    expect(hasReducedMotionListener.current).toBe(true)
  })
})
