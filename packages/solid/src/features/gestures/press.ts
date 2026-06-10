import { Feature, frame, press } from 'motion-dom'
import type { EventInfo, MotionNodeOptions, VariantLabels } from 'motion-dom'

import { extractEventInfo } from '@/events'
import { getMotionHandle } from '@/core/create-motion'
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

export function isPressEnabled(options: MotionNodeOptions): boolean {
  return pressProps.some((name) => Boolean(options[name]))
}

/**
 * Press (tap) gesture: listeners register once on mount and read the
 * handle's current options in their callbacks (framer parity).
 */
export class PressGesture extends Feature<Element> {
  private remove?: VoidFunction

  mount(): void {
    const state = getMotionHandle(this.node)
    const element = state?.element
    if (!state || !element) return
    // Disabled form controls never fire press (matches motion/react's
    // PressGesture, which bails when the element is a disabled <button>).
    const isDisabled = () => element instanceof HTMLButtonElement && element.disabled
    this.remove = press(
      [element],
      (_el, startEvent) => {
        if (isDisabled()) return
        const props = state.options
        state.setActive('whileTap', true)
        if (props.onTapStart) {
          frame.postRender(() => props.onTapStart!(startEvent, extractEventInfo(startEvent)))
        }
        return (endEvent, { success }) => {
          if (isDisabled()) return
          state.setActive('whileTap', false)
          const callbackName = success ? 'onTap' : 'onTapCancel'
          const cb = state.options[callbackName]
          if (cb) frame.postRender(() => cb(endEvent, extractEventInfo(endEvent)))
        }
      },
      {
        useGlobalTarget: state.options.globalTapTarget,
        stopPropagation: state.options.propagate?.tap === false,
      },
    )
  }

  unmount(): void {
    this.remove?.()
    this.remove = undefined
  }
}
