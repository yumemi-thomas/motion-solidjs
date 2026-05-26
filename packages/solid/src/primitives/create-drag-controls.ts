import type {
  DragControlOptions,
  VisualElementDragControls,
} from '@/features/gestures/drag/visual-element-drag-controls'

/**
 * Can manually trigger a drag gesture on one or more `drag`-enabled `motion` components.
 *
 * ```jsx
 * const dragControls = createDragControls()
 *
 * function startDrag(event) {
 *   dragControls.start(event, { snapToCursor: true })
 * }
 *
 * return (
 *   <>
 *     <div onPointerDown={startDrag} />
 *     <motion.div drag="x" dragControls={dragControls} />
 *   </>
 * )
 * ```
 *
 * @public
 */
export class DragControls {
  private componentControls = new Set<VisualElementDragControls>()

  /**
   * Subscribe a component's internal `VisualElementDragControls` to the user-facing API.
   *
   * @internal
   */
  subscribe(controls: VisualElementDragControls): () => void {
    this.componentControls.add(controls)

    return () => this.componentControls.delete(controls)
  }

  /**
   * Start a drag gesture on every `motion` component that has this set of drag controls
   * passed into it via the `dragControls` prop.
   *
   * ```jsx
   * dragControls.start(e, {
   *   snapToCursor: true
   * })
   * ```
   *
   * @param event - PointerEvent
   * @param options - Options
   *
   * @public
   */
  start(event: PointerEvent, options?: DragControlOptions) {
    this.componentControls.forEach((controls) => {
      controls.start(event, options)
    })
  }
}

export const createDragControls = () => new DragControls()
