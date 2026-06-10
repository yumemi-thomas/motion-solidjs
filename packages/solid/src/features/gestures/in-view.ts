import { inView } from 'motion'
import type { MotionNodeOptions, VariantLabels } from 'motion-dom'

import { getMotionHandle, type MotionHandle } from '@/core/create-motion'
import type { FeatureDefinition } from '@/features/definitions'
import { ElementGestureFeature, schedulePostRender } from '@/features/gestures/utils'
import type { VariantType } from '@/types'

type MarginValue = `${number}${'px' | '%'}`
type MarginType =
  | MarginValue
  | `${MarginValue} ${MarginValue}`
  | `${MarginValue} ${MarginValue} ${MarginValue}`
  | `${MarginValue} ${MarginValue} ${MarginValue} ${MarginValue}`

export interface ViewportOptions {
  root?: Element | Document
  once?: boolean
  margin?: MarginType
  amount?: 'some' | 'all' | number
}

type ViewportEventHandler = (entry: IntersectionObserverEntry | null) => void

export interface InViewProps {
  viewport?: ViewportOptions
  whileInView?: VariantLabels | VariantType
  onViewportEnter?: ViewportEventHandler
  onViewportLeave?: ViewportEventHandler
}

/** Mirrors framer's `featureProps.inView` isEnabled list. */
const inViewProps = ['whileInView', 'onViewportEnter', 'onViewportLeave'] as const

function isInViewEnabled(options: MotionNodeOptions): boolean {
  return inViewProps.some((name) => Boolean(options[name]))
}

/**
 * Viewport feature: drives `whileInView` from an IntersectionObserver and
 * restarts observation when observer-affecting viewport options change.
 */
const observerOptionNames: Array<keyof ViewportOptions> = ['amount', 'margin', 'root']

class InViewFeature extends ElementGestureFeature {
  private prevViewport: MotionHandle['options']['viewport']

  protected attach(state: MotionHandle, element: Element): VoidFunction {
    const viewport = state.options.viewport
    this.prevViewport = viewport

    const { once, ...viewOptions } = viewport || {}
    return inView(
      element,
      (_, entry) => {
        state.setActive('whileInView', true)
        schedulePostRender(state.options.onViewportEnter, entry)
        if (!once) {
          return () => {
            state.setActive('whileInView', false)
            schedulePostRender(state.options.onViewportLeave, entry)
          }
        }
      },
      viewOptions,
    )
  }

  update(): void {
    const state = getMotionHandle(this.node)
    if (!state) return
    const viewportChanged = observerOptionNames.some(
      (name) => state.options.viewport?.[name] !== this.prevViewport?.[name],
    )
    if (viewportChanged) {
      this.unmount()
      this.mount()
    }
  }
}

export const inViewFeatureDefinition: FeatureDefinition = {
  isEnabled: isInViewEnabled,
  Feature: InViewFeature,
}
