import type { MotionNodeOptions, VariantLabels } from 'motion-dom'

import { addDomEvent } from '@/events'
import type { FeatureDefinition } from '@/features/definitions'
import { ElementGestureFeature } from '@/features/gestures/utils'
import type { MotionHandle } from '@/core/create-motion'
import type { VariantType } from '@/types'

export type FocusProps = {
  whileFocus?: VariantLabels | VariantType
  onFocus?: (e: FocusEvent) => void
  onBlur?: (e: FocusEvent) => void
}

/** Mirrors framer's `featureProps.focus` isEnabled list. */
const focusProps = ['whileFocus'] as const

function isFocusEnabled(options: MotionNodeOptions): boolean {
  return focusProps.some((name) => Boolean(options[name]))
}

/** Focus gesture: drives `whileFocus` from focus-visible focus/blur. */
class FocusGesture extends ElementGestureFeature {
  private isFocused = false

  protected attach(state: MotionHandle, element: Element): VoidFunction {
    // matches(':focus-visible') throws in browsers without focus-visible
    // support; treat that as "focused" so whileFocus still fires.
    const onFocus = () => {
      let isFocusVisible = false
      try {
        isFocusVisible = element.matches(':focus-visible')
      } catch {
        isFocusVisible = true
      }
      if (!isFocusVisible) return
      state.setActive('whileFocus', true)
      this.isFocused = true
    }

    const onBlur = () => {
      if (!this.isFocused) return
      state.setActive('whileFocus', false)
      this.isFocused = false
    }

    const removeFocus = addDomEvent(element, 'focus', onFocus)
    const removeBlur = addDomEvent(element, 'blur', onBlur)
    return () => {
      removeFocus()
      removeBlur()
    }
  }
}

export const focusFeatureDefinition: FeatureDefinition = {
  isEnabled: isFocusEnabled,
  Feature: FocusGesture,
}
