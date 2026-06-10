import { inView } from 'motion'
import { frame, hover, press } from 'motion-dom'
import type { EventInfo, VariantLabels } from 'motion-dom'
import { createEffect } from 'solid-js'

import { addDomEvent, extractEventInfo } from '@/events'
import type { MotionHandle } from '@/motion/create-motion'
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

// ---------- Functional gesture bindings ----------
// Synchronous reads inside event handlers go through `state.options`
// (untracked) since those callbacks run outside any tracking scope.

function bindHover(state: MotionHandle, getOpts: () => MotionHandle['options']): () => void {
  let remove: VoidFunction | undefined

  const register = () => {
    remove?.()
    remove = undefined
    const element = state.element
    if (!element) return
    // motion-dom's setupGesture branches on `instanceof EventTarget` — that
    // check is false in happy-dom because happy-dom's Element doesn't extend
    // the global EventTarget. Passing an array takes the iterable branch
    // (`Array.from(...)`), which works in both happy-dom and real browsers.
    remove = hover([element], (_el, startEvent) => {
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

  createEffect(() => {
    const { whileHover, onHoverStart, onHoverEnd } = getOpts()
    if (whileHover || onHoverStart || onHoverEnd) {
      register()
    } else {
      remove?.()
      remove = undefined
    }
  })

  return () => {
    remove?.()
    remove = undefined
  }
}

function bindPress(state: MotionHandle, getOpts: () => MotionHandle['options']): () => void {
  let remove: VoidFunction | undefined

  const register = () => {
    remove?.()
    remove = undefined
    const element = state.element
    if (!element) return
    // Disabled form controls never fire press (matches motion/react's
    // PressGesture, which bails when the element is a disabled <button>).
    const isDisabled = () => element instanceof HTMLButtonElement && element.disabled
    remove = press(
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

  createEffect(() => {
    const { whileTap, onTap, onTapCancel, onTapStart } = getOpts()
    if (whileTap || onTap || onTapCancel || onTapStart) {
      register()
    } else {
      remove?.()
      remove = undefined
    }
  })

  return () => {
    remove?.()
    remove = undefined
  }
}

function bindFocus(state: MotionHandle, _getOpts: () => MotionHandle['options']): () => void {
  let isFocused = false
  let remove: VoidFunction | undefined

  // matches(':focus-visible') throws in browsers without focus-visible support;
  // treat that as "focused" so whileFocus still fires.
  const onFocus = () => {
    const element = state.element
    if (!element) return
    let isFocusVisible = false
    try {
      isFocusVisible = element.matches(':focus-visible')
    } catch {
      isFocusVisible = true
    }
    if (!isFocusVisible) return
    state.setActive('whileFocus', true)
    isFocused = true
  }

  const onBlur = () => {
    if (!isFocused) return
    state.setActive('whileFocus', false)
    isFocused = false
  }

  // Focus listeners attach unconditionally — the gesture state machine
  // gates whether `whileFocus` actually fires based on the current opts.
  // (Matches motion-react's behavior: focus handlers are always attached
  // so a future re-enable of `whileFocus` doesn't miss intervening focus.)
  if (state.element) {
    const removeFocus = addDomEvent(state.element, 'focus', onFocus)
    const removeBlur = addDomEvent(state.element, 'blur', onBlur)
    remove = () => {
      removeFocus()
      removeBlur()
    }
  }

  return () => {
    remove?.()
    remove = undefined
  }
}

const observerOptionNames: Array<keyof ViewportOptions> = ['amount', 'margin', 'root']

function bindInView(state: MotionHandle, getOpts: () => MotionHandle['options']): () => void {
  let remove: VoidFunction | undefined
  let prevViewport: MotionHandle['options']['viewport']

  const start = () => {
    const viewport = state.options.viewport
    prevViewport = viewport
    const element = state.element
    remove?.()
    remove = undefined
    if (!element) return

    const { once, ...viewOptions } = viewport || {}
    remove = inView(
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

  createEffect(() => {
    const opts = getOpts()
    const active = Boolean(opts.whileInView || opts.onViewportEnter || opts.onViewportLeave)
    const viewportChanged = observerOptionNames.some(
      (name) => opts.viewport?.[name] !== prevViewport?.[name],
    )
    if (active && (!remove || viewportChanged)) {
      start()
    } else if (!active) {
      remove?.()
      remove = undefined
    }
  })

  return () => {
    remove?.()
    remove = undefined
  }
}

// ---------- Aggregate primitive ----------

/**
 * Wire hover, press, focus and viewport (whileInView) gestures to a
 * MotionHandle. Each sub-binding owns its own Solid effect; the returned
 * cleanup tears them all down.
 */
export function createGestures(
  state: MotionHandle,
  getOpts: () => MotionHandle['options'],
): () => void {
  const cleanups = [
    bindHover(state, getOpts),
    bindPress(state, getOpts),
    bindFocus(state, getOpts),
    bindInView(state, getOpts),
  ]
  return () => cleanups.forEach((c) => c())
}
