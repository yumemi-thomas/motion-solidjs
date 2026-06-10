import { inView } from 'motion'
import { Feature, frame, hover, press } from 'motion-dom'
import type { EventInfo, MotionNodeOptions, VariantLabels } from 'motion-dom'

import { addDomEvent, extractEventInfo } from '@/events'
import { getMotionHandle, type MotionHandle } from '@/motion/create-motion'
import type { VariantType } from '@/types'

// ---------- Public prop types ----------

type HoverEvent = (event: MouseEvent, info: EventInfo) => void

export interface HoverProps {
  whileHover?: VariantLabels | VariantType
  onHoverStart?: HoverEvent
  onHoverEnd?: HoverEvent
}

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

export type FocusProps = {
  whileFocus?: VariantLabels | VariantType
  onFocus?: (e: FocusEvent) => void
  onBlur?: (e: FocusEvent) => void
}

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

// ---------- isEnabled lists (mirror framer's featureProps) ----------

const hoverProps = ['whileHover', 'onHoverStart', 'onHoverEnd'] as const
const pressProps = ['whileTap', 'onTap', 'onTapStart', 'onTapCancel'] as const
const focusProps = ['whileFocus'] as const
const inViewProps = ['whileInView', 'onViewportEnter', 'onViewportLeave'] as const

export function isHoverEnabled(options: MotionNodeOptions): boolean {
  return hoverProps.some((name) => Boolean(options[name]))
}

export function isPressEnabled(options: MotionNodeOptions): boolean {
  return pressProps.some((name) => Boolean(options[name]))
}

export function isFocusEnabled(options: MotionNodeOptions): boolean {
  return focusProps.some((name) => Boolean(options[name]))
}

export function isInViewEnabled(options: MotionNodeOptions): boolean {
  return inViewProps.some((name) => Boolean(options[name]))
}

// ---------- Feature classes ----------
// Listeners register once on mount and read the handle's current options in
// their callbacks (framer parity: a removed `while*` prop leaves the gesture
// mounted but its dispatch becomes a no-op).

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
