import { cancelFrame, Feature, frame, frameData } from 'motion-dom'
import type { EventInfo } from 'motion-dom'
import { frame as motionFrame } from 'motion-dom'
import type { Point, TransformPoint } from 'motion-utils'
import { millisecondsToSeconds, noop, pipe, secondsToMilliseconds } from 'motion-utils'

import { addPointerEvent, extractEventInfo, isPrimaryPointer } from '@/events'
import { getMotionHandle } from '@/core/create-motion'
import { getContextWindow } from '@/utils'

// ---------- Public types ----------

/**
 * Passed to pan event handlers like `onPan`. Contains the current state of the
 * gesture: `point` (page-relative), `delta` (since last move), `offset` (since
 * gesture start) and `velocity` (px/sec).
 */
export interface PanInfo {
  point: Point
  delta: Point
  offset: Point
  velocity: Point
}

export interface PanProps {
  onPanSessionStart?: (event: PointerEvent, info: PanInfo) => void
  onPanStart?: (event: PointerEvent, info: PanInfo) => void
  onPan?: (event: PointerEvent, info: PanInfo) => void
  onPanEnd?: (event: PointerEvent, info: PanInfo) => void
}

// ---------- PanSession (low-level, used by drag) ----------

type PanHandler = (event: Event, info: PanInfo) => void

interface PanSessionHandlers {
  onSessionStart: PanHandler
  onStart: PanHandler
  onMove: PanHandler
  onEnd: PanHandler
  onSessionEnd: PanHandler
  resumeAnimation: () => void
}

interface PanSessionOptions {
  transformPagePoint?: TransformPoint
  contextWindow?: (Window & typeof globalThis) | null
  dragSnapToOrigin?: boolean | 'x' | 'y'
  element?: HTMLElement | SVGElement | null
}

interface TimestampedPoint extends Point {
  timestamp: number
}

const overflowStyles = /* #__PURE__ */ new Set(['auto', 'scroll'])

export class PanSession {
  private history: TimestampedPoint[]
  private startEvent: PointerEvent | null = null
  private lastMoveEvent: PointerEvent | null = null
  private lastMoveEventInfo: EventInfo | null = null
  // Raw (untransformed) event info, re-transformed each frame so
  // transformPagePoint sees the current parent matrix. Matches upstream
  // PanSession#lastRawMoveEventInfo (gestures/pan/PanSession.ts).
  private lastRawMoveEventInfo: EventInfo | null = null
  private transformPagePoint?: TransformPoint
  private handlers: Partial<PanSessionHandlers> = {}
  private removeListeners: Function
  private dragSnapToOrigin: boolean | 'x' | 'y'
  // Assigned in the constructor (`contextWindow || window`) before any use;
  // no module-eval `window` default so the class is SSR-safe by construction.
  private contextWindow: PanSessionOptions['contextWindow']

  // Element being dragged. When provided, scroll on its ancestors and window
  // is compensated so the gesture continues smoothly during scroll.
  element?: HTMLElement | null
  private scrollPositions = new Map<Element | Window, Point>()
  private removeScrollListeners?: () => void

  constructor(
    event: PointerEvent,
    handlers: Partial<PanSessionHandlers>,
    {
      transformPagePoint,
      contextWindow,
      dragSnapToOrigin = false,
      element,
    }: PanSessionOptions = {},
  ) {
    // Multi-touch: bail out so we don't start a gesture.
    if (!isPrimaryPointer(event)) return

    this.dragSnapToOrigin = dragSnapToOrigin
    this.handlers = handlers
    this.transformPagePoint = transformPagePoint
    this.contextWindow = contextWindow || window

    const info = extractEventInfo(event)
    const initialInfo = transformPoint(info, this.transformPagePoint)
    const { point } = initialInfo

    const { timestamp } = frameData

    this.history = [{ ...point, timestamp }]

    const { onSessionStart } = handlers
    onSessionStart && onSessionStart(event, getPanInfo(initialInfo, this.history))

    this.removeListeners = pipe(
      addPointerEvent(this.contextWindow, 'pointermove', this.handlePointerMove),
      addPointerEvent(this.contextWindow, 'pointerup', this.handlePointerUp),
      addPointerEvent(this.contextWindow, 'pointercancel', this.handlePointerUp),
    )

    if (element) {
      this.startScrollTracking(element)
    }
  }

  // Track scroll on scrollable ancestors and window so we can compensate
  // pointer coordinates during pan.
  private startScrollTracking(element: HTMLElement | SVGElement): void {
    let current = element.parentElement
    while (current) {
      const style = getComputedStyle(current)
      if (overflowStyles.has(style.overflowX) || overflowStyles.has(style.overflowY)) {
        this.scrollPositions.set(current, {
          x: current.scrollLeft,
          y: current.scrollTop,
        })
      }
      current = current.parentElement
    }

    this.scrollPositions.set(window, {
      x: window.scrollX,
      y: window.scrollY,
    })

    // Element scroll events bubble; capture catches them. Window scroll
    // doesn't bubble so it needs its own listener.
    window.addEventListener('scroll', this.onElementScroll, { capture: true, passive: true })
    window.addEventListener('scroll', this.onWindowScroll, { passive: true })

    this.removeScrollListeners = () => {
      window.removeEventListener('scroll', this.onElementScroll, { capture: true })
      window.removeEventListener('scroll', this.onWindowScroll)
    }
  }

  private onElementScroll = (event: Event): void => {
    if (event.target instanceof Element) {
      this.handleScroll(event.target)
    }
  }

  private onWindowScroll = (): void => {
    this.handleScroll(window)
  }

  // For element scroll: pageX/pageY don't change, so we adjust history origin.
  // For window scroll: pageX/pageY DO change, so we adjust lastMoveEventInfo.
  private handleScroll(target: Element | Window): void {
    const initial = this.scrollPositions.get(target)
    if (!initial) return

    const current =
      target instanceof Element
        ? { x: target.scrollLeft, y: target.scrollTop }
        : { x: target.scrollX, y: target.scrollY }

    const delta = { x: current.x - initial.x, y: current.y - initial.y }
    if (delta.x === 0 && delta.y === 0) return

    if (!(target instanceof Element)) {
      if (this.lastMoveEventInfo) {
        this.lastMoveEventInfo.point.x += delta.x
        this.lastMoveEventInfo.point.y += delta.y
      }
    } else if (this.history.length > 0) {
      this.history[0].x -= delta.x
      this.history[0].y -= delta.y
    }

    this.scrollPositions.set(target, current)
    frame.update(this.updatePoint, true)
  }

  private updatePoint = () => {
    if (!(this.lastMoveEvent && this.lastMoveEventInfo)) return

    // Re-transform the raw point each frame so animated parent transforms
    // (e.g. spring-rotated) are reflected in the gesture's coordinate
    // space. Mirrors upstream PanSession#updatePoint.
    if (this.lastRawMoveEventInfo) {
      this.lastMoveEventInfo = transformPoint(this.lastRawMoveEventInfo, this.transformPagePoint)
    }

    const info = getPanInfo(this.lastMoveEventInfo, this.history)
    const isPanStarted = this.startEvent !== null

    // Only start panning once offset clears the 3px threshold (distinguishes
    // pan from a click). Above 3px we'd also need to reset history to avoid
    // snapping the cursor visually.
    const isDistancePastThreshold = distance(info.offset, { x: 0, y: 0 }) >= 3

    if (!isPanStarted && !isDistancePastThreshold) return

    const { point } = info
    const { timestamp } = frameData
    this.history.push({ ...point, timestamp })

    const { onStart, onMove } = this.handlers

    if (!isPanStarted) {
      onStart && onStart(this.lastMoveEvent, info)
      this.startEvent = this.lastMoveEvent
    }
    onMove && onMove(this.lastMoveEvent, info)
  }

  private handlePointerMove = (event: PointerEvent, info: EventInfo) => {
    this.lastMoveEvent = event
    this.lastRawMoveEventInfo = info
    this.lastMoveEventInfo = transformPoint(info, this.transformPagePoint)
    // Throttle to once per frame.
    frame.update(this.updatePoint, true)
  }

  private handlePointerUp = (event: PointerEvent, info: EventInfo) => {
    this.end()

    const { onEnd, onSessionEnd, resumeAnimation } = this.handlers

    // Resume animation if dragSnapToOrigin OR no drag actually started
    // (user just clicked) — keeps constraint animations going after a click.
    if (this.dragSnapToOrigin || !this.startEvent) {
      resumeAnimation && resumeAnimation()
    }
    if (!(this.lastMoveEvent && this.lastMoveEventInfo)) return

    const panInfo = getPanInfo(
      event.type === 'pointercancel'
        ? this.lastMoveEventInfo
        : transformPoint(info, this.transformPagePoint),
      this.history,
    )

    if (this.startEvent && onEnd) {
      onEnd(event, panInfo)
    }

    onSessionEnd && onSessionEnd(event, panInfo)
  }

  updateHandlers(handlers: Partial<PanSessionHandlers>) {
    this.handlers = handlers
  }

  end() {
    this.removeListeners && this.removeListeners()
    this.removeScrollListeners?.()
    this.scrollPositions.clear()
    cancelFrame(this.updatePoint)
  }
}

function transformPoint(info: EventInfo, transformPagePoint?: (point: Point) => Point) {
  return transformPagePoint ? { point: transformPagePoint(info.point) } : info
}

function subtractPoint(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y }
}

function distance(a: Point, b: Point): number {
  const x = b.x - a.x
  const y = b.y - a.y
  return Math.sqrt(x ** 2 + y ** 2)
}

function getPanInfo({ point }: EventInfo, history: TimestampedPoint[]) {
  return {
    point,
    delta: subtractPoint(point, lastDevicePoint(history)),
    offset: subtractPoint(point, startDevicePoint(history)),
    velocity: getVelocity(history, 0.1),
  }
}

function startDevicePoint(history: TimestampedPoint[]): TimestampedPoint {
  return history[0]
}

function lastDevicePoint(history: TimestampedPoint[]): TimestampedPoint {
  return history[history.length - 1]
}

function getVelocity(history: TimestampedPoint[], timeDelta: number): Point {
  if (history.length < 2) {
    return { x: 0, y: 0 }
  }

  let i = history.length - 1
  let timestampedPoint: TimestampedPoint | null = null
  const lastPoint = lastDevicePoint(history)
  while (i >= 0) {
    timestampedPoint = history[i]
    if (lastPoint.timestamp - timestampedPoint.timestamp > secondsToMilliseconds(timeDelta)) {
      break
    }
    i--
  }

  if (!timestampedPoint) {
    return { x: 0, y: 0 }
  }

  const time = millisecondsToSeconds(lastPoint.timestamp - timestampedPoint.timestamp)
  if (time === 0) {
    return { x: 0, y: 0 }
  }

  const currentVelocity = {
    x: (lastPoint.x - timestampedPoint.x) / time,
    y: (lastPoint.y - timestampedPoint.y) / time,
  }

  if (currentVelocity.x === Infinity) {
    currentVelocity.x = 0
  }
  if (currentVelocity.y === Infinity) {
    currentVelocity.y = 0
  }

  return currentVelocity
}

// ---------- Pan gesture wiring for `onPan*` JSX props ----------

type PanEventHandler = (event: PointerEvent, info: PanInfo) => void

// All onPan* callbacks are deferred to postRender in source order. Without
// this, onPan ran synchronously while onPanStart was queued for postRender,
// so the first onPan would land before its own onPanStart.
function asyncHandler(handler?: PanEventHandler) {
  return (event: PointerEvent, info: PanInfo) => {
    if (handler) {
      motionFrame.postRender(() => handler(event, info))
    }
  }
}

/**
 * Wire pan handlers (onPanStart, onPan, onPanEnd, onPanSessionStart) to the
 * element. Attaches a pointerdown listener on mount (the session decides
 * whether to honor it based on current opts); unmount ends any in-flight
 * session.
 */
export class PanGesture extends Feature<Element> {
  private session?: PanSession
  private removePointerDownListener?: () => void

  mount(): void {
    const state = getMotionHandle(this.node)
    const element = state?.element
    if (!state || !element) return

    const createPanHandlers = () => ({
      onSessionStart: asyncHandler((_, info) => {
        const { onPanSessionStart } = state.options
        onPanSessionStart && onPanSessionStart(_, info)
      }),
      onStart: asyncHandler((_, info) => {
        const { onPanStart } = state.options
        onPanStart && onPanStart(_, info)
      }),
      onMove: asyncHandler((event, info) => {
        const { onPan } = state.options
        onPan && onPan(event, info)
      }),
      onEnd: (event: PointerEvent, info: PanInfo) => {
        const { onPanEnd } = state.options
        this.session = undefined
        if (onPanEnd) {
          motionFrame.postRender(() => onPanEnd(event, info))
        }
      },
    })

    const onPointerDown = (pointerDownEvent: PointerEvent) => {
      this.session = new PanSession(pointerDownEvent, createPanHandlers(), {
        transformPagePoint: this.node.getTransformPagePoint(),
        contextWindow: getContextWindow(this.node),
      })
    }

    this.removePointerDownListener = addPointerEvent(element, 'pointerdown', onPointerDown)
  }

  unmount(): void {
    this.removePointerDownListener?.()
    this.removePointerDownListener = undefined
    this.session?.end()
    this.session = undefined
  }
}

const panProps = ['onPan', 'onPanStart', 'onPanSessionStart', 'onPanEnd'] as const

export function isPanEnabled(options: import('motion-dom').MotionNodeOptions): boolean {
  return panProps.some((name) => Boolean(options[name]))
}
