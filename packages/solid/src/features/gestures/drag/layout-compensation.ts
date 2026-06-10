import { eachAxis } from 'motion-dom'

export interface DragLayoutCompensatorDelegate {
  getElement(): HTMLElement | SVGElement | null
  isDragging(): boolean
  /**
   * Subtract a layout-induced shift from the axis: rebase the drag origin and
   * the external/projection motion value so the element stays under the
   * pointer. Skipped silently when the axis has no motion value.
   */
  applyAxisShift(axis: 'x' | 'y', shift: number): void
  render(): void
}

type DragBox = { left: number; top: number }

/**
 * While a drag is active, watch the element's viewport box once per frame
 * and subtract any movement that did NOT come from the pointer — surrounding
 * content reflowing (e.g. Reorder items swapping) shifts the element's
 * layout position, and drag offsets are relative to the origin measured at
 * drag start, so the element would otherwise jump away from the pointer.
 *
 * Runs on raw `window.requestAnimationFrame`, outside motion-dom's
 * frameloop: `frame.read` would pin its ordering against pointer-move
 * processing (`frame.update`) in a timing-sensitive area.
 */
export class DragLayoutCompensator {
  private latestBox: DragBox | undefined
  private pointerMovedThisFrame = false
  private frameId: number | undefined

  constructor(private readonly delegate: DragLayoutCompensatorDelegate) {}

  start() {
    this.latestBox = this.readBox()
    this.frameId = window.requestAnimationFrame(this.tick)
  }

  stop() {
    if (this.frameId !== undefined) {
      window.cancelAnimationFrame(this.frameId)
      this.frameId = undefined
    }
    this.latestBox = undefined
    this.pointerMovedThisFrame = false
  }

  /** The pointer drove this frame's movement — don't compensate it. */
  notePointerMove() {
    this.pointerMovedThisFrame = true
    this.latestBox = this.readBox()
  }

  private tick = () => {
    this.frameId = undefined
    if (!this.delegate.isDragging() || !this.delegate.getElement()) return

    const latest = this.readBox()
    const previous = this.latestBox
    if (!latest) return

    if (!this.pointerMovedThisFrame && previous) {
      const delta = {
        x: latest.left - previous.left,
        y: latest.top - previous.top,
      }
      eachAxis((axis) => {
        const shift = delta[axis]
        if (!shift) return
        this.delegate.applyAxisShift(axis, shift)
      })

      if (delta.x || delta.y) {
        this.delegate.render()
        this.latestBox = this.readBox()
      } else {
        this.latestBox = latest
      }
    } else {
      this.latestBox = latest
    }

    this.pointerMovedThisFrame = false
    this.frameId = window.requestAnimationFrame(this.tick)
  }

  private readBox(): DragBox | undefined {
    const element = this.delegate.getElement()
    if (!element) return undefined
    const box = element.getBoundingClientRect()
    return { left: box.left, top: box.top }
  }
}
