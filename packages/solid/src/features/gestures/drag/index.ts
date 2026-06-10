import { Feature } from 'motion-dom'
import type { MotionNodeOptions } from 'motion-dom'
import type { DragControls } from '@/primitives/create-drag-controls'
import { VisualElementDragControls } from '@/features/gestures/drag/visual-element-drag-controls'
import { getMotionHandle, type MotionHandle } from '@/core/create-motion'

const noVoid: () => void = () => {}

export function isDragEnabled(options: MotionNodeOptions): boolean {
  return Boolean(options.drag || options.dragControls)
}

/**
 * Wire drag behaviour to the element. `update()` re-points the DragControls
 * subscription when the user swaps the instance (signal/state-driven).
 * Unmount cancels any in-flight pan session and tears down listeners.
 */
export class DragGesture extends Feature<Element> {
  private controls?: VisualElementDragControls
  private currentDragControls?: DragControls
  private removeGroupControls: () => void = noVoid
  private removeListeners: () => void = noVoid

  private subscribeToDragControls(dragControls: DragControls | undefined): void {
    if (!this.controls || this.currentDragControls === dragControls) return
    this.removeGroupControls()
    this.removeGroupControls = noVoid
    this.currentDragControls = dragControls
    if (dragControls) {
      this.removeGroupControls = dragControls.subscribe(this.controls)
    }
  }

  mount(): void {
    const state = getMotionHandle(this.node)
    if (!state) return
    this.controls = new VisualElementDragControls(state)
    this.removeListeners = (this.controls.addListeners() as (() => void) | undefined) ?? noVoid
    this.subscribeToDragControls(state.options.dragControls)
  }

  update(): void {
    const state = getMotionHandle(this.node)
    if (!state) return
    this.subscribeToDragControls(state.options.dragControls)
  }

  unmount(): void {
    // Cancel any in-flight pan session so its window listeners are detached
    // and the global drag lock is released. Without this, an element
    // unmounted mid-gesture (pointerdown received but pointerup never
    // reached — common in conditional UIs) leaks listeners and pins the
    // axis locks. cancel() is a no-op when no session is active.
    this.controls?.cancel()
    this.removeGroupControls()
    this.removeGroupControls = noVoid
    this.removeListeners()
    this.removeListeners = noVoid
  }
}
