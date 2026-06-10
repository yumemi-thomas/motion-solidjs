import { frame } from 'motion-dom'

import type { MotionHandle } from './create-motion'

type MotionElement = HTMLElement | SVGElement

export interface PresenceRegistrationLifecycle {
  attach(element: MotionElement): void
  isAttached(): boolean
  getElement(): MotionElement | null
  replayInitialAnimation(): void
  setPresenceContainer(element: HTMLElement | null): void
}

export interface PresenceRegistration {
  isRegistered(): boolean
  register(element: MotionElement): void
  unregister(): void
}

function waitForProjectionExit(handle: MotionHandle): Promise<void> {
  const projection = handle.visualElement?.projection
  if (!projection) {
    return new Promise((resolve) => frame.postRender(() => resolve()))
  }

  return new Promise((resolve) => {
    let settled = false
    let removeListener: (() => void) | undefined
    const settle = () => {
      if (settled) return
      settled = true
      removeListener?.()
      resolve()
    }

    removeListener = projection.addEventListener?.('animationComplete', settle)
    const prevOnExitComplete = projection.options?.onExitComplete
    if (projection.options) {
      projection.options.onExitComplete = () => {
        prevOnExitComplete?.()
        settle()
      }
    }

    frame.postRender(() => {
      frame.postRender(() => {
        if (!projection.currentAnimation) settle()
      })
    })
  })
}

export function createPresenceRegistration(
  handle: MotionHandle,
  lifecycle: PresenceRegistrationLifecycle,
): PresenceRegistration {
  let unregisterFromPresence: (() => void) | undefined

  const runExit = async (element: MotionElement) => {
    if (!lifecycle.isAttached()) lifecycle.attach(element)
    lifecycle.setPresenceContainer(element instanceof HTMLElement ? element : null)
    handle.getSnapshot(handle.options, false)

    const exitPromise = handle.setActive('exit', true)
    if (!handle.options.layoutId) {
      await exitPromise
      return
    }

    await Promise.all([exitPromise, waitForProjectionExit(handle)])
  }

  const runEnter = () => {
    handle.setActive('exit', false)
    handle.getSnapshot(handle.options, true)
    queueMicrotask(() => {
      if (lifecycle.getElement()) lifecycle.replayInitialAnimation()
    })
  }

  return {
    isRegistered() {
      return Boolean(unregisterFromPresence)
    },
    register(element) {
      const presence = handle.options.presenceContext
      if (!presence?.register) return
      unregisterFromPresence = presence.register(element, () => runExit(element))

      presence.registerEnter?.(element, runEnter)
    },
    unregister() {
      unregisterFromPresence?.()
      unregisterFromPresence = undefined
    },
  }
}
