import type { Point } from 'motion-utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** @public */
export interface EventInfo {
  point: Point
}

export type EventListenerWithPointInfo = (e: PointerEvent, info: EventInfo) => void

// ---------------------------------------------------------------------------
// Primary-pointer gate
// ---------------------------------------------------------------------------

export function isPrimaryPointer(event: PointerEvent) {
  if (event.pointerType === 'mouse') {
    return typeof event.button !== 'number' || event.button <= 0
  } else {
    /**
     * isPrimary is true for all mice buttons, whereas every touch point
     * is regarded as its own input. So subsequent concurrent touch points
     * will be false.
     *
     * Specifically match against false here as incomplete versions of
     * PointerEvents in very old browser might have it set as undefined.
     */
    return event.isPrimary !== false
  }
}

// ---------------------------------------------------------------------------
// Pointer event info extraction
// ---------------------------------------------------------------------------

export function extractEventInfo(
  event: PointerEvent,
  pointType: 'page' | 'client' = 'page',
): EventInfo {
  return {
    point: {
      x: event[`${pointType}X`],
      y: event[`${pointType}Y`],
    },
  }
}

export function addPointerInfo(handler: EventListenerWithPointInfo): EventListener {
  return (event: PointerEvent) => isPrimaryPointer(event) && handler(event, extractEventInfo(event))
}

// ---------------------------------------------------------------------------
// Listener registration
// ---------------------------------------------------------------------------

export function addDomEvent(
  target: EventTarget,
  eventName: string,
  handler: EventListener,
  options: AddEventListenerOptions = { passive: true },
) {
  target.addEventListener(eventName, handler, options)
  return () => target.removeEventListener(eventName, handler)
}

export function addPointerEvent(
  target: EventTarget,
  eventName: string,
  handler: EventListenerWithPointInfo,
  options?: AddEventListenerOptions,
) {
  return addDomEvent(target, eventName, addPointerInfo(handler), options)
}
