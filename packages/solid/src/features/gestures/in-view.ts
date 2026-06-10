import { inView } from 'motion'
import { Feature, frame } from 'motion-dom'
import type { MotionNodeOptions, VariantLabels } from 'motion-dom'

import { getMotionHandle, type MotionHandle } from '@/core/create-motion'
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

export function isInViewEnabled(options: MotionNodeOptions): boolean {
  return inViewProps.some((name) => Boolean(options[name]))
}

/**
 * Viewport feature: drives `whileInView` from an IntersectionObserver and
 * restarts observation when observer-affecting viewport options change.
 */
const observerOptionNames: Array<keyof ViewportOptions> = ['amount', 'margin', 'root']

export class InViewFeature extends Feature<Element> {
  private remove?: VoidFunction
  private prevViewport: MotionHandle['options']['viewport']

  private start(): void {
    const state = getMotionHandle(this.node)
    const element = state?.element
    if (!state || !element) return
    const viewport = state.options.viewport
    this.prevViewport = viewport
    this.remove?.()
    this.remove = undefined

    const { once, ...viewOptions } = viewport || {}
    this.remove = inView(
      element,
      (_, entry) => {
        const props = state.options
        state.setActive('whileInView', true)
        if (props.onViewportEnter) {
          frame.postRender(() => props.onViewportEnter!(entry))
        }
        if (!once) {
          return () => {
            state.setActive('whileInView', false)
            const cb = state.options.onViewportLeave
            if (cb) frame.postRender(() => cb(entry))
          }
        }
      },
      viewOptions,
    )
  }

  mount(): void {
    this.start()
  }

  update(): void {
    const state = getMotionHandle(this.node)
    if (!state) return
    const viewportChanged = observerOptionNames.some(
      (name) => state.options.viewport?.[name] !== this.prevViewport?.[name],
    )
    if (viewportChanged) this.start()
  }

  unmount(): void {
    this.remove?.()
    this.remove = undefined
  }
}
