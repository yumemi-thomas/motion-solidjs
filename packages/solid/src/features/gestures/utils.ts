import { Feature, frame } from 'motion-dom'
import { getMotionHandle, type MotionHandle } from '@/core/create-motion'

/**
 * Defer a gesture callback to motion's postRender phase, if defined. Every
 * user-facing gesture callback goes through here so they all land in the
 * same phase, in dispatch order — a synchronous onPan must not overtake an
 * onPanStart that was queued for postRender.
 */
export function schedulePostRender<Args extends unknown[]>(
  handler: ((...args: Args) => void) | undefined,
  ...args: Args
): void {
  if (handler) frame.postRender(() => handler(...args))
}

/**
 * Base for gesture features that bind listeners to the handle's element on
 * mount and detach them on unmount. `attach` is skipped entirely when the
 * handle or element is missing, and returns the cleanup for whatever it
 * wired up.
 */
export abstract class ElementGestureFeature extends Feature<Element> {
  private detach?: VoidFunction

  protected abstract attach(state: MotionHandle, element: Element): VoidFunction | undefined

  mount(): void {
    const state = getMotionHandle(this.node)
    const element = state?.element
    if (!state || !element) return
    this.detach = this.attach(state, element)
  }

  unmount(): void {
    this.detach?.()
    this.detach = undefined
  }
}
