import { type MotionValue, isMotionValue } from 'motion-dom'

import { type MaybeAccessor, isAccessor } from '@/types'
import { bridgeAccessor } from '@/primitives/bridge-accessor'
import { createCombinedMotionValue } from '@/primitives/create-combined-motion-value'

/**
 * Combine multiple motion values into a single string-valued motion value
 * using template-literal syntax. Interpolated values may be `MotionValue`s,
 * plain numbers/strings, or Solid accessors (`() => value`) — accessors make
 * that segment of the template update reactively.
 *
 * ```tsx
 * const shadowX = createSpring(0)
 * const shadowY = createMotionValue(0)
 * const shadow = createMotionTemplate`drop-shadow(${shadowX}px ${shadowY}px 20px rgba(0,0,0,0.3))`
 *
 * return <motion.div style={{ filter: shadow }} />
 * ```
 *
 * @public
 */
export function createMotionTemplate(
  fragments: TemplateStringsArray,
  ...values: Array<MaybeAccessor<string | number> | MotionValue>
) {
  // Accessors become driver MotionValues so the combined value can subscribe.
  const resolved = values.map((value) => (isAccessor(value) ? bridgeAccessor(value) : value))

  /**
   * Build the string by interleaving the literal fragments with the current
   * value of each interpolated motion value.
   */
  const numFragments = fragments.length

  function buildValue() {
    let output = ''

    for (let i = 0; i < numFragments; i++) {
      output += fragments[i]
      const value = resolved[i]
      if (value !== undefined && value !== null) {
        output += isMotionValue(value) ? value.get() : value
      }
    }

    return output
  }
  const { value, subscribe } = createCombinedMotionValue(buildValue)

  subscribe(resolved.filter(isMotionValue))

  return value
}
