import { rootProjectionNode } from 'motion-dom'

/**
 * Returns a `startTransition` function. Layout/visual changes performed
 * inside its callback skip layout animation — they snap to the new
 * position/size, and any in-flight layout transition is marked complete.
 *
 * @example
 * ```tsx
 * const startTransition = createInstantLayoutTransition()
 *
 * return (
 *   <button onClick={() => startTransition(() => setColumns(3))}>
 *     Reflow instantly
 *   </button>
 * )
 * ```
 */
export function createInstantLayoutTransition(): (cb?: () => void) => void {
  return startTransition
}

function startTransition(callback?: () => void) {
  if (!rootProjectionNode.current) return
  rootProjectionNode.current.isUpdating = false
  rootProjectionNode.current.blockUpdate()
  callback && callback()
}
