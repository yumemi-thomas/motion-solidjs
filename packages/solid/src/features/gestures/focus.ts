import { Feature } from 'motion-dom'
import type { MotionNodeOptions, VariantLabels } from 'motion-dom'

import { addDomEvent } from '@/events'
import { getMotionHandle } from '@/core/create-motion'
import type { VariantType } from '@/types'

export type FocusProps = {
  whileFocus?: VariantLabels | VariantType
  onFocus?: (e: FocusEvent) => void
  onBlur?: (e: FocusEvent) => void
}

/** Mirrors framer's `featureProps.focus` isEnabled list. */
const focusProps = ['whileFocus'] as const

export function isFocusEnabled(options: MotionNodeOptions): boolean {
  return focusProps.some((name) => Boolean(options[name]))
}

/** Focus gesture: drives `whileFocus` from focus-visible focus/blur. */
export class FocusGesture extends Feature<Element> {
  private isFocused = false
  private remove?: VoidFunction

  mount(): void {
    const state = getMotionHandle(this.node)
    const element = state?.element
    if (!state || !element) return

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
    this.remove = () => {
      removeFocus()
      removeBlur()
    }
  }

  unmount(): void {
    this.remove?.()
    this.remove = undefined
  }
}
