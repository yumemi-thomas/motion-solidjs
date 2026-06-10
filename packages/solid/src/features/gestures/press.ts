import { press } from 'motion-dom'
import type { EventInfo, MotionNodeOptions, VariantLabels } from 'motion-dom'

import { extractEventInfo } from '@/events'
import type { FeatureDefinition } from '@/features/definitions'
import { ElementGestureFeature, schedulePostRender } from '@/features/gestures/utils'
import type { MotionHandle } from '@/core/create-motion'
import type { VariantType } from '@/types'

type TapEvent = (event: PointerEvent, info: EventInfo) => void

export interface PressProps {
  /** If `true`, the tap gesture attaches its start listener to window. */
  globalTapTarget?: boolean
  /**
   * Controls whether gestures bubble to ancestor motion components. Setting
   * `{ tap: false }` stops this element's press from triggering ancestor tap
   * gestures (maps to motion-dom's `stopPropagation` press option).
   */
  propagate?: { tap?: boolean }
  whileTap?: VariantLabels | VariantType
  onTapStart?: TapEvent
  onTap?: TapEvent
  onTapCancel?: TapEvent
}

/** Mirrors framer's `featureProps.tap` isEnabled list. */
const pressProps = ['whileTap', 'onTap', 'onTapStart', 'onTapCancel'] as const

function isPressEnabled(options: MotionNodeOptions): boolean {
  return pressProps.some((name) => Boolean(options[name]))
}

/**
 * Press (tap) gesture: listeners register once on mount and read the
 * handle's current options in their callbacks (framer parity).
 */
class PressGesture extends ElementGestureFeature {
  protected attach(state: MotionHandle, element: Element): VoidFunction {
    // Disabled form controls never fire press (matches motion/react's
    // PressGesture, which bails when the element is a disabled <button>).
    const isDisabled = () => element instanceof HTMLButtonElement && element.disabled
    return press(
      [element],
      (_el, startEvent) => {
        if (isDisabled()) return
        state.setActive('whileTap', true)
        schedulePostRender(state.options.onTapStart, startEvent, extractEventInfo(startEvent))
        return (endEvent, { success }) => {
          if (isDisabled()) return
          state.setActive('whileTap', false)
          const cb = state.options[success ? 'onTap' : 'onTapCancel']
          schedulePostRender(cb, endEvent, extractEventInfo(endEvent))
        }
      },
      {
        useGlobalTarget: state.options.globalTapTarget,
        stopPropagation: state.options.propagate?.tap === false,
      },
    )
  }
}

export const pressFeatureDefinition: FeatureDefinition = {
  isEnabled: isPressEnabled,
  Feature: PressGesture,
}
