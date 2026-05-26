// Behavioral safety net for plan-2's dispatch swap. Plan-2 calls out nine
// behaviors that the new animate-target path must preserve. Five are already
// covered by existing tests (animate-prop / hover / motion-config). The
// uncovered ones — protected-keys gating across the priority chain — live
// here so the swap fails loudly if it regresses them.
import { cleanup, render } from '@solidjs/testing-library'
import { motionValue } from 'motion-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { delay } from '#tests/utils'
import { nextFrame, pointerEnter, pointerLeave } from '#tests/features/gestures/drag-test-utils'

afterEach(() => cleanup())

const instantTransition = { type: false } as const

describe('dispatch behavior — plan-2 safety net', () => {
  describe('protected-keys (higher-priority state blocks lower)', () => {
    it('whileHover.scale shadows animate.scale while hovered', async () => {
      const scale = motionValue(1)

      const wrapper = render(() => (
        <motion.div
          data-testid="m"
          animate={{ scale: 0.5 }}
          whileHover={{ scale: 2 }}
          transition={instantTransition}
          style={{ scale }}
        />
      ))

      await nextFrame()
      await nextFrame()
      expect(scale.get()).toBe(0.5)

      pointerEnter(wrapper.getByTestId('m'))
      await delay(15)
      expect(scale.get()).toBe(2)

      pointerLeave(wrapper.getByTestId('m'))
      await delay(15)
      // Removed-key fallback restores animate.scale.
      expect(scale.get()).toBe(0.5)
    })

    it('keys outside the high-priority target still fall to lower priority', async () => {
      const opacity = motionValue(1)
      const scale = motionValue(1)

      const wrapper = render(() => (
        <motion.div
          data-testid="m"
          animate={{ scale: 0.5, opacity: 0.3 }}
          whileHover={{ scale: 2 }}
          transition={instantTransition}
          style={{ scale, opacity }}
        />
      ))

      await nextFrame()
      await nextFrame()

      pointerEnter(wrapper.getByTestId('m'))
      await delay(15)
      // hover claims scale, but opacity from animate must still apply.
      expect(scale.get()).toBe(2)
      expect(opacity.get()).toBe(0.3)
    })

    it('inherited variant cascade respects the same priority order', async () => {
      const scale = motionValue(1)

      const wrapper = render(() => (
        <motion.div data-testid="parent" whileHover="big" transition={instantTransition}>
          <motion.div
            data-testid="child"
            variants={{ big: { scale: 3 } }}
            animate={{ scale: 1.5 }}
            transition={instantTransition}
            style={{ scale }}
          />
        </motion.div>
      ))

      await nextFrame()
      await nextFrame()
      expect(scale.get()).toBe(1.5)

      pointerEnter(wrapper.getByTestId('parent'))
      await delay(15)
      // Parent's hover label propagates and the child's `big` variant
      // wins over its own animate.
      expect(scale.get()).toBe(3)

      pointerLeave(wrapper.getByTestId('parent'))
      await delay(15)
      expect(scale.get()).toBe(1.5)
    })
  })
})
