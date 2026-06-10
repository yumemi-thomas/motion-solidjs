import { rootProjectionNode } from 'motion-dom'

/**
 * Returns a function that resets the projection tree — clearing measured
 * layout state on every projection node so the next layout animation
 * re-measures from scratch. Equivalent of motion/react's
 * `useResetProjection`; mainly useful after imperative DOM changes that
 * invalidate cached layout measurements.
 *
 * @example
 * ```tsx
 * const resetProjection = createResetProjection()
 *
 * return <button onClick={() => resetProjection()}>Reset layout state</button>
 * ```
 */
export function createResetProjection(): () => void {
  return () => {
    const root = rootProjectionNode.current
    if (!root) return
    root.resetTree()
  }
}
