import { addDomEvent, addPointerEvent, extractEventInfo } from '@/events'
import {
  applyConstraints,
  calcOrigin,
  calcRelativeConstraints,
  calcViewportConstraints,
  defaultElastic,
  rebaseAxisConstraints,
  resolveDragElastic,
} from '@/features/gestures/drag/constraints'
import type { DragHandlers, DragProps, ResolvedConstraints } from '@/features/gestures/drag/types'
import type { PanInfo } from '@/features/gestures/pan'
import { PanSession } from '@/features/gestures/pan'
import { getContextWindow } from '@/utils'
import { isHTMLElement } from '@/utils/is'
import type {
  AnimationGeneratorType,
  LayoutUpdateData,
  Transition,
  VisualElement,
} from 'motion-dom'
import {
  addValueToWillChange,
  animateMotionValue,
  calcLength,
  convertBoundingBoxToBox,
  convertBoxToBoundingBox,
  createBox,
  eachAxis,
  frame,
  isElementTextInput,
  measurePageBox,
  mixNumber,
  percent,
  resize,
} from 'motion-dom'
import { invariant } from '@/utils/is'
import type { MotionHandle } from '@/motion/create-motion'
import type { MotionProps } from '@/components'
import type { Axis, BoundingBox, Point } from 'motion-utils'

const elementDragControls = new WeakMap<VisualElement, VisualElementDragControls>()

export interface DragControlOptions {
  snapToCursor?: boolean
  cursorProgress?: Point
}

type DragDirection = 'x' | 'y'
type DragControlProps = Omit<MotionHandle['options'], keyof DragHandlers> & DragHandlers

// ---------- Global drag gesture lock ----------
//
// Two module-level locks (horizontal + vertical) coordinate drag gestures
// across the entire page. Each drag acquires the locks it cares about on
// start; release happens in cancel(). The locks also feed motion-dom's
// hover gesture via `isDragActive` so a hover that started during a drag
// is suppressed (filter in `motion-dom/gestures/hover` falls back through
// here transitively — we don't import isDragActive but the same lock is
// shared via motion-dom).

export type Lock = (() => void) | false

/**
 * Resolve `dragConstraints` to its underlying value. In Solid, the React-ref
 * idiom (`dragConstraints={ref}`) is replaced by an accessor
 * (`dragConstraints={() => ref}`) so the Element value can be read reactively
 * after the constraint container mounts. Object-form constraints
 * (`{ left, right, ... }`) pass through unchanged.
 */
function resolveDragConstraintsValue(
  value: DragProps['dragConstraints'] | undefined,
): false | Partial<BoundingBox> | Element | null {
  // Accessor form — invoke once to read the current Element.
  if (typeof value === 'function') {
    const resolved = value()
    return resolved ?? false
  }
  return value ?? false
}

function createLock(name: string) {
  let lock: null | string = null
  return (): Lock => {
    const openLock = (): void => {
      lock = null
    }
    if (lock === null) {
      lock = name
      return openLock
    }
    return false
  }
}

const globalHorizontalLock = createLock('dragHorizontal')
const globalVerticalLock = createLock('dragVertical')

function getGlobalLock(drag: boolean | 'x' | 'y' | 'lockDirection'): Lock {
  let lock: Lock = false
  if (drag === 'y') {
    lock = globalVerticalLock()
  } else if (drag === 'x') {
    lock = globalHorizontalLock()
  } else {
    const openHorizontal = globalHorizontalLock()
    const openVertical = globalVerticalLock()
    if (openHorizontal && openVertical) {
      lock = () => {
        openHorizontal()
        openVertical()
      }
    } else {
      // Release the locks because we don't use them
      if (openHorizontal) openHorizontal()
      if (openVertical) openVertical()
    }
  }
  return lock
}

export class VisualElementDragControls {
  private state: MotionHandle

  private panSession?: PanSession

  // This is a reference to the global drag gesture lock, ensuring only one component
  // can "capture" the drag of one or both axes.
  // TODO: Look into moving this into pansession?
  private openGlobalLock: Lock | null = null

  isDragging = false
  private currentDirection: DragDirection | null = null

  private originPoint: Point = { x: 0, y: 0 }
  private latestDragBox: { left: number; top: number } | undefined
  private hasPointerMovedThisFrame = false
  private layoutCompensationFrame: number | undefined

  /**
   * The permitted boundaries of travel, in pixels.
   */
  private constraints: ResolvedConstraints | false = false

  private hasMutatedConstraints = false

  /**
   * The per-axis resolved elastic values.
   */
  private elastic = createBox()

  constructor(state: MotionHandle) {
    this.state = state
  }

  get visualElement() {
    return this.state.visualElement
  }

  start(originEvent: PointerEvent, { snapToCursor = false }: DragControlOptions = {}) {
    /**
     * Don't start dragging if this component is exiting
     */
    const onSessionStart = (event: PointerEvent) => {
      if (snapToCursor) {
        this.snapToCursor(extractEventInfo(event, 'page').point)
      }
      this.stopAnimation()
    }

    const onStart = (event: PointerEvent, info: PanInfo) => {
      // Attempt to grab the global drag gesture lock - maybe make this part of PanSession
      const { drag, dragPropagation, onDragStart } = this.getProps()

      if (drag && !dragPropagation) {
        if (this.openGlobalLock) this.openGlobalLock()

        this.openGlobalLock = getGlobalLock(drag)

        // If we don 't have the lock, don't start dragging
        if (!this.openGlobalLock) return
      }

      this.isDragging = true

      this.currentDirection = null

      this.resolveConstraints()

      if (this.visualElement.projection) {
        this.visualElement.projection.isAnimationBlocked = true
        this.visualElement.projection.target = undefined
      }

      /**
       * Record gesture origin
       */
      eachAxis((axis) => {
        let current = this.getAxisMotionValue(axis).get() || 0

        /**
         * If the MotionValue is a percentage value convert to px
         */
        if (percent.test(current)) {
          const { projection } = this.visualElement

          if (projection && projection.layout) {
            const measuredAxis = projection.layout.layoutBox[axis]

            if (measuredAxis) {
              const length = calcLength(measuredAxis)
              current = length * (parseFloat(current) / 100)
            }
          }
        }

        this.originPoint[axis] = current
      })

      // Fire onDragStart event
      if (onDragStart) {
        frame.postRender(() => onDragStart(event, info))
      }

      addValueToWillChange(this.visualElement, 'transform')

      this.state.setActive('whileDrag', true)
      this.startLayoutCompensation()
    }

    const onMove = (event: PointerEvent, info: PanInfo) => {
      // latestPointerEvent = event
      const { dragPropagation, dragDirectionLock, onDirectionLock, onDrag } = this.getProps()
      // If we didn't successfully receive the gesture lock, early return.
      if (!dragPropagation && !this.openGlobalLock) return

      const { offset } = info
      // Attempt to detect drag direction if directionLock is true
      if (dragDirectionLock && this.currentDirection === null) {
        this.currentDirection = getCurrentDirection(offset)

        // If we've successfully set a direction, notify listener
        if (this.currentDirection !== null) {
          onDirectionLock && onDirectionLock(this.currentDirection)
        }

        return
      }
      // Update each point with the latest position
      this.updateAxis('x', info.point, offset)
      this.updateAxis('y', info.point, offset)

      /**
       * Ideally we would leave the renderer to fire naturally at the end of
       * this frame but if the element is about to change layout as the result
       * of a re-render we want to ensure the browser can read the latest
       * bounding box to ensure the pointer and element don't fall out of sync.
       */
      this.visualElement.render()
      this.hasPointerMovedThisFrame = true
      this.latestDragBox = this.readDragBox()

      /**
       * This must fire after the render call as it might trigger a state
       * change which itself might trigger a layout update.
       */
      onDrag && onDrag(event, info)
    }

    const onSessionEnd = (event: PointerEvent, info: PanInfo) => this.stop(event, info)

    const resumeAnimation = () =>
      eachAxis(
        (axis) =>
          this.getAnimationState(axis) === 'paused' &&
          this.getAxisMotionValue(axis).animation?.play(),
      )

    const { dragSnapToOrigin } = this.getProps()
    const element = this.state.element
    if (!(element instanceof HTMLElement || element instanceof SVGElement)) return

    this.panSession = new PanSession(
      originEvent,
      {
        onSessionStart,
        onStart,
        onMove,
        onSessionEnd,
        resumeAnimation,
      },
      {
        transformPagePoint: this.visualElement.getTransformPagePoint(),
        dragSnapToOrigin,
        contextWindow: getContextWindow(this.visualElement),
        element,
      },
    )
  }

  private stop(event: PointerEvent, info: PanInfo) {
    const isDragging = this.isDragging
    this.cancel()
    if (!isDragging) return

    const { velocity } = info
    this.startAnimation(velocity)

    const { onDragEnd } = this.getProps()
    if (onDragEnd) {
      frame.postRender(() => onDragEnd(event, info))
    }
  }

  cancel() {
    this.isDragging = false
    this.stopLayoutCompensation()
    const { projection } = this.visualElement
    if (projection) {
      projection.isAnimationBlocked = false
    }
    this.panSession && this.panSession.end()
    this.panSession = undefined

    const { dragPropagation } = this.getProps()
    if (!dragPropagation && this.openGlobalLock) {
      this.openGlobalLock()
      this.openGlobalLock = null
    }

    this.state.setActive('whileDrag', false)
  }

  private startLayoutCompensation() {
    this.latestDragBox = this.readDragBox()
    this.layoutCompensationFrame = window.requestAnimationFrame(this.compensateLayoutShift)
  }

  private stopLayoutCompensation() {
    if (this.layoutCompensationFrame !== undefined) {
      window.cancelAnimationFrame(this.layoutCompensationFrame)
      this.layoutCompensationFrame = undefined
    }
    this.latestDragBox = undefined
    this.hasPointerMovedThisFrame = false
  }

  private compensateLayoutShift = () => {
    this.layoutCompensationFrame = undefined
    if (!this.isDragging || !this.state.element) return

    const latest = this.readDragBox()
    const previous = this.latestDragBox
    if (!latest) return

    if (!this.hasPointerMovedThisFrame && previous) {
      const delta = {
        x: latest.left - previous.left,
        y: latest.top - previous.top,
      }
      eachAxis((axis) => {
        const shift = delta[axis]
        if (!shift) return
        const motionValue = this.getAxisMotionValue(axis)
        if (!motionValue) return
        this.originPoint[axis] -= shift
        motionValue.set(motionValue.get() - shift)
      })

      if (delta.x || delta.y) {
        this.visualElement.render()
        this.latestDragBox = this.readDragBox()
      } else {
        this.latestDragBox = latest
      }
    } else {
      this.latestDragBox = latest
    }

    this.hasPointerMovedThisFrame = false
    this.layoutCompensationFrame = window.requestAnimationFrame(this.compensateLayoutShift)
  }

  private readDragBox() {
    if (!this.state.element) return undefined
    const box = this.state.element.getBoundingClientRect()
    return { left: box.left, top: box.top }
  }

  private updateAxis(axis: DragDirection, _point: Point, offset?: Point) {
    const { drag } = this.getProps()

    // If we're not dragging this axis, do an early return.
    if (!offset || !shouldDrag(axis, drag, this.currentDirection)) return

    const axisValue = this.getAxisMotionValue(axis)
    let next = this.originPoint[axis] + offset[axis]

    // Apply constraints
    if (this.constraints && this.constraints[axis]) {
      next = applyConstraints(next, this.constraints[axis], this.elastic[axis])
    }

    axisValue.set(next)
  }

  private resolveConstraints() {
    const { dragConstraints, dragElastic } = this.getProps()

    const layout =
      this.visualElement.projection && !this.visualElement.projection.layout
        ? this.visualElement.projection.measure(false)
        : this.visualElement.projection?.layout

    const prevConstraints = this.constraints

    if (dragConstraints && isHTMLElement(dragConstraints)) {
      if (!this.constraints) {
        this.constraints = this.resolveRefConstraints()
      }
    } else {
      if (dragConstraints && layout) {
        this.constraints = calcRelativeConstraints(
          layout.layoutBox,
          dragConstraints as Partial<BoundingBox>,
        )
      } else {
        this.constraints = false
      }
    }

    this.elastic = resolveDragElastic(dragElastic)

    /**
     * If we're outputting to external MotionValues, we want to rebase the measured constraints
     * from viewport-relative to component-relative. This only applies to relative (non-ref)
     * constraints, as ref-based constraints from calcViewportConstraints are already in the
     * correct coordinate space for the motion value transform offset.
     */
    if (
      prevConstraints !== this.constraints &&
      !isHTMLElement(dragConstraints) &&
      layout &&
      this.constraints &&
      !this.hasMutatedConstraints
    ) {
      eachAxis((axis) => {
        if (this.constraints !== false && this.getAxisMotionValue(axis)) {
          this.constraints[axis] = rebaseAxisConstraints(
            layout.layoutBox[axis],
            this.constraints[axis],
          )
        }
      })
    }
  }

  private resolveRefConstraints() {
    const { dragConstraints: constraints, onMeasureDragConstraints } = this.getProps()
    if (!constraints || !isHTMLElement(constraints)) return false

    const constraintsElement = constraints

    invariant(
      constraintsElement !== null,
      "If `dragConstraints` is set as a ref, that ref must be passed to another component's `ref` prop.",
    )

    const { projection } = this.visualElement

    // TODO
    if (!projection || !projection.layout) return false

    const constraintsBox = measurePageBox(
      constraintsElement,
      projection.root!,
      this.visualElement.getTransformPagePoint(),
    )

    let measuredConstraints = calcViewportConstraints(projection.layout.layoutBox, constraintsBox)

    /**
     * If there's an onMeasureDragConstraints listener we call it and
     * if different constraints are returned, set constraints to that
     */
    if (onMeasureDragConstraints) {
      const userConstraints = onMeasureDragConstraints(convertBoxToBoundingBox(measuredConstraints))

      this.hasMutatedConstraints = !!userConstraints

      if (userConstraints) {
        measuredConstraints = convertBoundingBoxToBox(userConstraints)
      }
    }

    return measuredConstraints
  }

  private startAnimation(velocity: Point) {
    const {
      drag,
      dragMomentum,
      dragElastic,
      dragTransition,
      dragSnapToOrigin,
      onDragTransitionEnd,
    } = this.getProps()

    const constraints: Partial<ResolvedConstraints> = this.constraints || {}

    const momentumAnimations = eachAxis((axis) => {
      if (!shouldDrag(axis, drag, this.currentDirection)) {
        return
      }

      let transition = (constraints && constraints[axis]) || {}

      if (dragSnapToOrigin) transition = { min: 0, max: 0 }

      /**
       * Overdamp the boundary spring if `dragElastic` is disabled. There's still a frame
       * of spring animations so we should look into adding a disable spring option to `inertia`.
       * We could do something here where we affect the `bounceStiffness` and `bounceDamping`
       * using the value of `dragElastic`.
       */
      const bounceStiffness = dragElastic ? 200 : 1000000
      const bounceDamping = dragElastic ? 40 : 10000000

      const inertia = {
        type: 'inertia' as const,
        velocity: dragMomentum ? velocity[axis] : 0,
        bounceStiffness,
        bounceDamping,
        timeConstant: 750,
        restDelta: 1,
        restSpeed: 10,
        ...dragTransition,
        ...transition,
      }

      // If we're not animating on an externally-provided `MotionValue` we can use the
      // component's animation controls which will handle interactions with whileHover (etc),
      // otherwise we just have to animate the `MotionValue` itself.
      return this.startAxisValueAnimation(axis, inertia)
    })

    // Run all animations and then resolve the new drag constraints.
    return Promise.all(momentumAnimations).then(onDragTransitionEnd)
  }

  private startAxisValueAnimation(axis: DragDirection, transition: Transition) {
    const axisValue = this.getAxisMotionValue(axis)

    addValueToWillChange(this.visualElement, axis)
    return axisValue.start(
      animateMotionValue(axis, axisValue, 0, transition, this.visualElement, false),
    )
  }

  private stopAnimation() {
    if (!this.visualElement.projection?.isPresent) return
    eachAxis((axis) => this.getAxisMotionValue(axis).stop())
  }

  private pauseAnimation() {
    eachAxis((axis) => this.getAxisMotionValue(axis).animation?.pause())
  }

  private getAnimationState(axis: DragDirection) {
    return this.getAxisMotionValue(axis).animation?.state
  }

  /**
   * Drag works differently depending on which props are provided.
   *
   * - If _dragX and _dragY are provided, we output the gesture delta directly to those motion values.
   * - Otherwise, we apply the delta to the x/y motion values.
   */
  private getAxisMotionValue(axis: DragDirection) {
    const dragKey = `_drag${axis.toUpperCase()}`
    const props = this.visualElement.getProps()
    const externalMotionValue = props[dragKey]

    return (
      externalMotionValue ||
      this.visualElement.getValue(axis, (props.initial ? props.initial[axis] : undefined) || 0)
    )
  }

  private snapToCursor(point: Point) {
    eachAxis((axis) => {
      const { drag } = this.getProps()

      // If we're not dragging this axis, do an early return.
      if (!shouldDrag(axis, drag, this.currentDirection)) return

      const { projection } = this.visualElement
      const axisValue = this.getAxisMotionValue(axis)

      if (projection && projection.layout) {
        const { min, max } = projection.layout.layoutBox[axis]

        axisValue.set(point[axis] - mixNumber(min, max, 0.5))
      }
    })
  }

  /**
   * When the viewport resizes we want to check if the measured constraints
   * have changed and, if so, reposition the element within those new constraints
   * relative to where it was before the resize.
   */
  scalePositionWithinConstraints() {
    if (!this.visualElement.current) return

    const { drag, dragConstraints } = this.getProps()
    const { projection } = this.visualElement
    if (!isHTMLElement(dragConstraints) || !projection || !this.constraints) return

    /**
     * Stop current animations as there can be visual glitching if we try to do
     * this mid-animation
     */
    this.stopAnimation()

    /**
     * Record the relative position of the dragged element relative to the
     * constraints box and save as a progress value.
     */
    const boxProgress = { x: 0, y: 0 }
    eachAxis((axis) => {
      const axisValue = this.getAxisMotionValue(axis)
      if (axisValue && this.constraints !== false) {
        const latest = axisValue.get()
        boxProgress[axis] = calcOrigin({ min: latest, max: latest }, this.constraints[axis] as Axis)
      }
    })

    /**
     * Update the layout of this element and resolve the latest drag constraints
     */
    const { transformTemplate } = this.visualElement.getProps()
    this.state.element.style.transform = transformTemplate ? transformTemplate({}, '') : 'none'
    projection.root && projection.root.updateScroll()
    projection.updateLayout()

    /**
     * Reset constraints so resolveConstraints() will recalculate them
     * with the freshly measured layout rather than returning the cached value.
     */
    this.constraints = false
    this.resolveConstraints()

    /**
     * For each axis, calculate the current progress of the layout axis
     * within the new constraints.
     */
    eachAxis((axis) => {
      if (!shouldDrag(axis, drag, null)) return

      /**
       * Calculate a new transform based on the previous box progress
       */
      const axisValue = this.getAxisMotionValue(axis)
      const { min, max } = this.constraints[axis]
      axisValue.set(mixNumber(min, max, boxProgress[axis]))
    })

    /**
     * Flush the updated transform to the DOM synchronously to prevent
     * a visual flash at the element's CSS layout position (0,0) when
     * the transform was stripped for measurement.
     */
    this.visualElement.render()
  }

  addListeners() {
    if (!this.state.element) return
    elementDragControls.set(this.visualElement, this)
    const element = this.state.element

    /**
     * Attach a pointerdown event listener on this DOM element to initiate drag tracking.
     */
    const stopPointerListener = addPointerEvent(element, 'pointerdown', (event) => {
      const { drag, dragListener = true } = this.getProps()
      const target = event.target instanceof Element ? event.target : null

      // Don't start drag if the pointerdown lands on a text-input descendant
      // (input, textarea, select, contenteditable) where the user is trying
      // to interact with the control. Buttons and links don't block because
      // they have no click-and-drag selection of their own.
      const isClickingTextInputChild =
        target !== element && target ? isElementTextInput(target) : false

      if (drag && dragListener && !isClickingTextInputChild) {
        this.start(event)
      }
    })

    /**
     * If using ref-based constraints, observe both the draggable element
     * and the constraint container for size changes via ResizeObserver.
     * Setup is deferred because the accessor-form constraint can resolve to
     * a null Element when addListeners first runs (Solid ref binding has
     * not yet completed, or the user passed `() => signal()` and the
     * signal hasn't settled). Once a valid constraint Element is observed
     * we wire ResizeObserver and re-measure on every resize.
     */
    let stopResizeObservers: VoidFunction | undefined

    /**
     * Track whether the dragged element has had its initial layout measured
     * with non-zero dimensions. In Solid, `addListeners` may run before the
     * JSX style binding has applied (ref binding and style application
     * happen in unspecified order during element creation), so the
     * synchronous `projection.updateLayout()` above can capture an empty
     * (0x0) bounding box. The deferred `frame.read(measureDragConstraints)`
     * then re-measures once styles have been applied.
     */
    const isLayoutEmpty = (): boolean => {
      const layoutBox = this.visualElement.projection?.layout?.layoutBox
      if (!layoutBox) return true
      return calcLength(layoutBox.x) === 0 && calcLength(layoutBox.y) === 0
    }

    let isUpdatingLayoutForConstraints = false

    const updateLayoutForConstraints = () => {
      const { projection } = this.visualElement
      if (!projection) return
      isUpdatingLayoutForConstraints = true
      projection.root && projection.root.updateScroll()
      projection.updateLayout()
      isUpdatingLayoutForConstraints = false
    }

    const measureDragConstraints = () => {
      const { dragConstraints } = this.getProps()
      if (isHTMLElement(dragConstraints)) {
        const { projection } = this.visualElement
        if (projection && isLayoutEmpty() && !isUpdatingLayoutForConstraints) {
          updateLayoutForConstraints()
        }
        this.constraints = this.resolveRefConstraints()

        if (!stopResizeObservers) {
          stopResizeObservers = startResizeObservers(element, dragConstraints, () =>
            this.scalePositionWithinConstraints(),
          )
        }
      }
    }

    const { projection } = this.visualElement
    if (!projection) return

    const stopMeasureLayoutListener = projection.addEventListener('measure', measureDragConstraints)

    if (!projection.layout) {
      updateLayoutForConstraints()
    }

    frame.read(measureDragConstraints)

    /**
     * Attach a window resize listener to scale the draggable target within its defined
     * constraints as the window resizes.
     */
    const stopResizeListener = addDomEvent(window, 'resize', () =>
      this.scalePositionWithinConstraints(),
    )

    /**
     * If the element's layout changes, calculate the delta and apply that to
     * the drag gesture's origin point.
     */
    const stopLayoutUpdateListener = projection.addEventListener('didUpdate', (({
      delta,
      hasLayoutChanged,
    }: LayoutUpdateData) => {
      if (this.isDragging && hasLayoutChanged) {
        eachAxis((axis) => {
          const motionValue = this.getAxisMotionValue(axis)
          if (!motionValue) return

          this.originPoint[axis] += delta[axis].translate
          motionValue.set(motionValue.get() + delta[axis].translate)
        })
        this.visualElement.render()
      }
    }) as any)

    return () => {
      stopResizeListener()
      stopPointerListener()
      stopMeasureLayoutListener()
      stopLayoutUpdateListener && stopLayoutUpdateListener()
      stopResizeObservers && stopResizeObservers()
    }
  }

  getProps(): DragControlProps {
    const props = this.state.options
    const {
      drag = false,
      dragDirectionLock = false,
      dragPropagation = false,
      dragConstraints,
      dragElastic = defaultElastic,
      dragMomentum = true,
    } = props
    return {
      ...props,
      drag,
      dragDirectionLock,
      dragPropagation,
      // Resolve accessor-form constraints here so all consumers
      // (`resolveConstraints`, `resolveRefConstraints`, `measureDragConstraints`,
      // `scalePositionWithinConstraints`) see the live Element value rather
      // than the accessor function captured at construction.
      dragConstraints: resolveDragConstraintsValue(dragConstraints),
      dragElastic,
      dragMomentum,
    }
  }
}

/**
 * Wrap a callback so its first invocation is skipped. `resize()` fires
 * once synchronously on subscribe with the initial size; we treat that
 * as the baseline and only react to subsequent size changes.
 */
function skipFirstCall(callback: VoidFunction): VoidFunction {
  let isFirst = true
  return () => {
    if (isFirst) {
      isFirst = false
      return
    }
    callback()
  }
}

/**
 * Observe both the draggable element and its constraint container for size
 * changes (CSS `resize: both`, programmatic style mutations, or layout
 * changes from descendant content). On any change, re-anchor the dragged
 * element within the freshly-measured constraints. Mirrors upstream
 * framer-motion (#2458 / #2903).
 */
function startResizeObservers(
  element: HTMLElement | SVGElement,
  constraintsElement: HTMLElement,
  onResize: VoidFunction,
): VoidFunction {
  const stopElement = resize(element as HTMLElement, skipFirstCall(onResize))
  const stopContainer = resize(constraintsElement, skipFirstCall(onResize))
  return () => {
    stopElement()
    stopContainer()
  }
}

function shouldDrag(
  direction: DragDirection,
  drag: boolean | DragDirection | undefined,
  currentDirection: null | DragDirection,
) {
  return (
    (drag === true || drag === direction) &&
    (currentDirection === null || currentDirection === direction)
  )
}

/**
 * Based on an x/y offset determine the current drag direction. If both axis' offsets are lower
 * than the provided threshold, return `null`.
 *
 * @param offset - The x/y offset from origin.
 * @param lockThreshold - (Optional) - the minimum absolute offset before we can determine a drag direction.
 */
function getCurrentDirection(offset: Point, lockThreshold = 10): DragDirection | null {
  let direction: DragDirection | null = null

  if (Math.abs(offset.y) > lockThreshold) {
    direction = 'y'
  } else if (Math.abs(offset.x) > lockThreshold) {
    direction = 'x'
  }

  return direction
}
