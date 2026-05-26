import type { DragControls } from '@/primitives/create-drag-controls'
import { VisualElementDragControls } from '@/features/gestures/drag/visual-element-drag-controls'
import type { MotionHandle } from '@/motion/create-motion'
import { createEffect } from 'solid-js'

const noVoid: () => void = () => {}

/**
 * Wire drag behaviour to a {@link MotionHandle}.
 *
 * Subscribes to `dragControls` reactively — when the user swaps the
 * DragControls instance (signal/state-driven), the subscription re-points
 * automatically. Returns a cleanup that cancels any in-flight pan session
 * and tears down listeners.
 */
export function createDrag(
  state: MotionHandle,
  getOpts: () => MotionHandle['options'],
): () => void {
  // VisualElementDragControls reaches into `state.visualElement` for nearly
  // everything (projection, MVs, render). Ensure the VE here so bundles
  // without drag don't allocate a VE just for opt-out static-style cases.
  if (!state.ensureVisualElement()) return undefined
  const controls = new VisualElementDragControls(state)
  let currentDragControls: DragControls | undefined
  let removeGroupControls: () => void = noVoid
  const removeListeners: () => void =
    (controls.addListeners() as (() => void) | undefined) ?? noVoid

  const subscribeToDragControls = (dragControls: DragControls | undefined) => {
    if (currentDragControls === dragControls) return
    removeGroupControls()
    removeGroupControls = noVoid
    currentDragControls = dragControls
    if (dragControls) {
      removeGroupControls = dragControls.subscribe(controls)
    }
  }

  // The dragControls prop can swap at runtime; re-track it via getOpts so
  // calls on the new instance still trigger drag here.
  createEffect(() => {
    subscribeToDragControls(getOpts().dragControls)
  })

  return () => {
    // Cancel any in-flight pan session so its window listeners are detached
    // and the global drag lock is released. Without this, an element
    // unmounted mid-gesture (pointerdown received but pointerup never
    // reached — common in conditional UIs) leaks listeners and pins the
    // axis locks. cancel() is a no-op when no session is active.
    controls.cancel()
    removeGroupControls()
    removeListeners()
  }
}
