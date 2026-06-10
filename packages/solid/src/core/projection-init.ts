import type { MotionHandle } from './create-motion'

/**
 * Slot for the projection initializer carried by feature bundles that
 * include layout/drag (domMax). Mirrors upstream, where the bundle's
 * `ProjectionNode` makes use-visual-element create a projection node for
 * every motion component — projection is per-VisualElement infrastructure,
 * not a prop-gated feature, because ancestors' transforms participate in
 * descendants' layout measurements.
 *
 * A module-level slot (same pattern as `root-projection-update`) keeps the
 * projection engine out of the core import graph: bare `m` and animation-only
 * bundles never reference it.
 */
let initProjection: ((handle: MotionHandle) => void) | undefined

export function setProjectionInit(fn: (handle: MotionHandle) => void): void {
  initProjection ??= fn
}

/** Create/refresh the handle's projection node. No-op until domMax installs. */
export function initHandleProjection(handle: MotionHandle): void {
  initProjection?.(handle)
}
