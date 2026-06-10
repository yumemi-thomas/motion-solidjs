import { MotionValue, acceleratedValues, transformProps } from 'motion-dom'
import type { WillChange } from 'motion-dom'

/**
 * Port of framer-motion's `WillChangeMotionValue` (framer-motion exports the
 * class but motion-dom does not, so it is mirrored here on motion-dom's
 * primitives — see packages/framer-motion/src/value/use-will-change/
 * WillChangeMotionValue.ts upstream). motion-dom's `addValueToWillChange`
 * detects it via `isWillChangeMotionValue` (duck-typed on `add`) and calls
 * `add` whenever a value starts animating.
 */
class WillChangeMotionValue extends MotionValue<string> implements WillChange {
  private isEnabled = false

  add(name: string) {
    if (transformProps.has(name) || acceleratedValues.has(name)) {
      this.isEnabled = true
      this.update()
    }
  }

  private update() {
    this.set(this.isEnabled ? 'transform' : 'auto')
  }
}

/**
 * Returns a `will-change` MotionValue that starts as `"auto"` and upgrades
 * itself to `"transform"` once a transform or accelerated value animates on
 * the element it's attached to. Equivalent of motion/react's `useWillChange`.
 *
 * @example
 * ```tsx
 * const willChange = createWillChange()
 *
 * return <motion.div animate={{ x: 100 }} style={{ 'will-change': willChange }} />
 * ```
 */
export function createWillChange(): WillChange {
  return new WillChangeMotionValue('auto')
}
