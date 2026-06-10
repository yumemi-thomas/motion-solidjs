import { addDomEvent, isPrimaryPointer } from 'motion-dom'
import type { EventInfo } from 'motion-dom'

export { addDomEvent, isPrimaryPointer } from 'motion-dom'
export type { EventInfo } from 'motion-dom'

export type EventListenerWithPointInfo = (e: PointerEvent, info: EventInfo) => void

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

function addPointerInfo(handler: EventListenerWithPointInfo): EventListener {
  return (event: PointerEvent) => isPrimaryPointer(event) && handler(event, extractEventInfo(event))
}

export function addPointerEvent(
  target: EventTarget,
  eventName: string,
  handler: EventListenerWithPointInfo,
  options?: AddEventListenerOptions,
) {
  return addDomEvent(target, eventName, addPointerInfo(handler), options)
}
