import { Feature, frame, hover } from 'motion-dom'
import type { EventInfo, MotionNodeOptions, VariantLabels } from 'motion-dom'

import { extractEventInfo } from '@/events'
import { getMotionHandle } from '@/core/create-motion'
import type { VariantType } from '@/types'

type HoverEvent = (event: MouseEvent, info: EventInfo) => void

export interface HoverProps {
  whileHover?: VariantLabels | VariantType
  onHoverStart?: HoverEvent
  onHoverEnd?: HoverEvent
}

/** Mirrors framer's `featureProps.hover` isEnabled list. */
const hoverProps = ['whileHover', 'onHoverStart', 'onHoverEnd'] as const

export function isHoverEnabled(options: MotionNodeOptions): boolean {
  return hoverProps.some((name) => Boolean(options[name]))
}

/**
 * Hover gesture: listeners register once on mount and read the handle's
 * current options in their callbacks (framer parity: a removed `whileHover`
 * leaves the gesture mounted but its dispatch becomes a no-op).
 */
export class HoverGesture extends Feature<Element> {
  private remove?: VoidFunction

  mount(): void {
    const state = getMotionHandle(this.node)
    const element = state?.element
    if (!state || !element) return
    // motion-dom's setupGesture branches on `instanceof EventTarget` — that
    // check is false in happy-dom because happy-dom's Element doesn't extend
    // the global EventTarget. Passing an array takes the iterable branch
    // (`Array.from(...)`), which works in both happy-dom and real browsers.
    this.remove = hover([element], (_el, startEvent) => {
      const props = state.options
      state.setActive('whileHover', true)
      if (props.onHoverStart) {
        frame.postRender(() => props.onHoverStart!(startEvent, extractEventInfo(startEvent)))
      }
      return (endEvent) => {
        state.setActive('whileHover', false)
        const cb = state.options.onHoverEnd
        if (cb) frame.postRender(() => cb(endEvent, extractEventInfo(endEvent)))
      }
    })
  }

  unmount(): void {
    this.remove?.()
    this.remove = undefined
  }
}
