import { hover } from 'motion-dom'
import type { EventInfo, MotionNodeOptions, VariantLabels } from 'motion-dom'

import { extractEventInfo } from '@/events'
import type { FeatureDefinition } from '@/features/definitions'
import { ElementGestureFeature, schedulePostRender } from '@/features/gestures/utils'
import type { MotionHandle } from '@/core/create-motion'
import type { VariantType } from '@/types'

type HoverEvent = (event: MouseEvent, info: EventInfo) => void

export interface HoverProps {
  whileHover?: VariantLabels | VariantType
  onHoverStart?: HoverEvent
  onHoverEnd?: HoverEvent
}

/** Mirrors framer's `featureProps.hover` isEnabled list. */
const hoverProps = ['whileHover', 'onHoverStart', 'onHoverEnd'] as const

function isHoverEnabled(options: MotionNodeOptions): boolean {
  return hoverProps.some((name) => Boolean(options[name]))
}

/**
 * Hover gesture: listeners register once on mount and read the handle's
 * current options in their callbacks (framer parity: a removed `whileHover`
 * leaves the gesture mounted but its dispatch becomes a no-op).
 */
class HoverGesture extends ElementGestureFeature {
  protected attach(state: MotionHandle, element: Element): VoidFunction {
    // motion-dom's setupGesture branches on `instanceof EventTarget` — that
    // check is false in happy-dom because happy-dom's Element doesn't extend
    // the global EventTarget. Passing an array takes the iterable branch
    // (`Array.from(...)`), which works in both happy-dom and real browsers.
    return hover([element], (_el, startEvent) => {
      state.setActive('whileHover', true)
      schedulePostRender(state.options.onHoverStart, startEvent, extractEventInfo(startEvent))
      return (endEvent) => {
        state.setActive('whileHover', false)
        schedulePostRender(state.options.onHoverEnd, endEvent, extractEventInfo(endEvent))
      }
    })
  }
}

export const hoverFeatureDefinition: FeatureDefinition = {
  isEnabled: isHoverEnabled,
  Feature: HoverGesture,
}
