import { frame } from 'motion-dom'

// Mirrors motion/react's gestures/drag/__tests__/utils.tsx so the ported tests
// stay close to upstream and easy to diff against. Differences from upstream:
//
//  - upstream uses `MotionConfig.transformPagePoint` (a feature we don't
//    expose) to inject fake page coordinates; we encode coordinates directly
//    on the dispatched PointerEvent.
//  - upstream uses jest's `pointerDown/Move/Up`; we dispatch real
//    PointerEvents through happy-dom.
//  - upstream wraps mutations in `React.act`; Solid is fine-grained reactive
//    so the equivalent is just awaiting our frame postRender.

export type Point = { x: number; y: number }

function makePointerEvent(
  type: string,
  x: number,
  y: number,
  pointerType: 'mouse' | 'touch' | 'pen' = 'mouse',
): PointerEvent {
  const event = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    isPrimary: true,
    pointerId: 1,
    pointerType,
    clientX: x,
    clientY: y,
  })
  // happy-dom's PointerEvent constructor doesn't propagate clientX/clientY to
  // pageX/pageY, and PanSession.extractEventInfo reads from `page*`.
  Object.defineProperty(event, 'pageX', { configurable: true, value: x })
  Object.defineProperty(event, 'pageY', { configurable: true, value: y })
  // jsdom's PointerEvent constructor drops the pointer-specific init fields, so
  // motion-dom's isPrimaryPointer (reads pointerType/isPrimary/button) rejects
  // the event and gestures never activate. Re-assert them (no-op under happy-dom,
  // which already preserves them).
  Object.defineProperty(event, 'pointerType', { configurable: true, value: pointerType })
  Object.defineProperty(event, 'isPrimary', { configurable: true, value: true })
  Object.defineProperty(event, 'pointerId', { configurable: true, value: 1 })
  if (typeof event.button !== 'number') {
    Object.defineProperty(event, 'button', { configurable: true, value: 0 })
  }
  return event
}

export type DispatchablePointerType =
  | 'pointerdown'
  | 'pointermove'
  | 'pointerup'
  | 'pointercancel'
  | 'pointerenter'
  | 'pointerleave'

export function dispatchPointer(
  target: EventTarget,
  type: DispatchablePointerType,
  x = 0,
  y = 0,
  opts: { pointerType?: 'mouse' | 'touch' | 'pen' } = {},
): PointerEvent {
  const event = makePointerEvent(type, x, y, opts.pointerType ?? 'mouse')
  target.dispatchEvent(event)
  return event
}

export function pointerDown(target: EventTarget, x = 0, y = 0) {
  return dispatchPointer(target, 'pointerdown', x, y)
}

export function pointerMove(target: EventTarget, x = 0, y = 0) {
  return dispatchPointer(target, 'pointermove', x, y)
}

export function pointerUp(target: EventTarget, x = 0, y = 0) {
  return dispatchPointer(target, 'pointerup', x, y)
}

export function pointerEnter(
  target: EventTarget,
  opts: { pointerType?: 'mouse' | 'touch' | 'pen' } = {},
) {
  return dispatchPointer(target, 'pointerenter', 0, 0, opts)
}

export function pointerLeave(
  target: EventTarget,
  opts: { pointerType?: 'mouse' | 'touch' | 'pen' } = {},
) {
  return dispatchPointer(target, 'pointerleave', 0, 0, opts)
}

export function nextFrame() {
  return new Promise<void>((resolve) => {
    frame.postRender(() => resolve())
  })
}

export const dragFrame = {
  postRender: () => nextFrame(),
}

export function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export type Deferred<T> = {
  promise: Promise<T>
  resolve: unknown extends T ? () => void : (value: T) => void
}

export function deferred<T = void>(): Deferred<T> {
  const def = {} as Deferred<T>
  def.promise = new Promise((resolve) => {
    def.resolve = resolve as Deferred<T>['resolve']
  })
  return def
}

export type DragController = {
  to(x: number, y: number): Promise<DragController>
  end(): void
}

/**
 * Simulate a drag gesture. Mirrors motion/react's `drag()` helper.
 *
 * - `triggerElement` is where pointerdown fires (defaults to `element`).
 *   Useful for tests where the gesture is initiated from a child of, or
 *   sibling to, the actually-draggable element (drag handles, dragControls).
 * - `pointermove` is dispatched on `window` so any window-scoped PanSession
 *   listener picks it up.
 * - `pointerup` is dispatched on `window` to mirror the move path.
 */
export function drag(element: Element, triggerElement?: Element): DragController {
  // Track the latest move coordinate so `pointer.end()` can dispatch pointerup
  // at the same page coordinates. Upstream's MockDrag handles this via
  // MotionConfig.transformPagePoint returning `pos`; we have to do it on the
  // event itself. Tests like `dragEnd returns transformed pointer` assert
  // that the PanInfo from onDragEnd matches the last point from onDrag.
  let lastX = 0
  let lastY = 0
  pointerDown(triggerElement ?? element, 0, 0)
  const controls: DragController = {
    async to(x: number, y: number) {
      lastX = x
      lastY = y
      pointerMove(window, x, y)
      await nextFrame()
      return controls
    },
    end() {
      pointerUp(window, lastX, lastY)
    },
  }
  return controls
}

/**
 * Cypress-style drag: x/y are element-relative, *re-read at every event*.
 * Mirrors `cy.trigger("pointerdown"|"pointermove", x, y, { force: true })`
 * — at dispatch time, cypress reads the element's current bbox and sets
 * clientX/clientY = bbox.left + x, bbox.top + y. Because the element
 * moves during the gesture, each move's bbox is the *latest* one (post
 * previous-move's drag delta). Subtle but important for parity: if the
 * helper snapped the bbox once at pointerdown, every drag-by-N test
 * would land N − threshold off where N is the threshold-crossing move's
 * delta.
 */
export function cyDrag(element: Element, startX: number, startY: number): DragController {
  const initial = element.getBoundingClientRect()
  let lastX = initial.left + startX
  let lastY = initial.top + startY
  pointerDown(element, lastX, lastY)
  const controls: DragController = {
    async to(x: number, y: number) {
      const bbox = element.getBoundingClientRect()
      lastX = bbox.left + x
      lastY = bbox.top + y
      // Cypress's `.trigger('pointermove', ...)` dispatches the event on
      // the element (the subject of the chain), not on window. Motion-dom's
      // window-scoped pointermove listener catches it via bubbling.
      pointerMove(element, lastX, lastY)
      await nextFrame()
      return controls
    },
    end() {
      pointerUp(element, lastX, lastY)
    },
  }
  return controls
}
