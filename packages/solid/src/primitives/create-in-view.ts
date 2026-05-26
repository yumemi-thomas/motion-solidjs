import { createEffect, createSignal, onCleanup } from 'solid-js'
import type { Accessor } from 'solid-js'
import type { ViewportOptions } from '@/features/gestures/gestures'
import { inView } from 'motion'
import {
  type MaybeAccessor,
  type MaybeElementAccessor,
  resolveAccessor,
  resolveElement,
} from '@/types'

export interface CreateInViewOptions extends Omit<ViewportOptions, 'root'> {
  root?: MaybeAccessor<Element | Document>
  /**
   * Seed value returned before IntersectionObserver fires for the first
   * time. Mirrors upstream `useInView`'s `initial` option — useful when
   * you want a "visible by default until proven otherwise" mount-time
   * behavior.
   * @default false
   */
  initial?: boolean
}

/**
 * Reactive boolean tracking whether the referenced element is in view via
 * IntersectionObserver. Re-evaluates when `domRef` or `options` change.
 *
 * @example
 * ```tsx
 * let ref: HTMLDivElement | undefined
 * const isInView = createInView(() => ref, { once: true, amount: 0.5 })
 *
 * return (
 *   <motion.div
 *     ref={ref}
 *     animate={{ opacity: isInView() ? 1 : 0 }}
 *   />
 * )
 * ```
 */
export function createInView(
  domRef: MaybeElementAccessor,
  options?: MaybeAccessor<CreateInViewOptions>,
): Accessor<boolean> {
  // Seed from `initial` (resolved once at construction — there's no
  // re-seeding mid-life). Defaults to false to match prior behaviour.
  const initialOptions = resolveAccessor(options) ?? {}
  const [isInView, setIsInView] = createSignal(initialOptions.initial ?? false)

  createEffect(() => {
    const realOptions: CreateInViewOptions = resolveAccessor(options) ?? {}
    const { once } = realOptions
    const el = resolveElement(domRef)
    if (!el || (once && isInView())) {
      return
    }
    const onEnter = () => {
      setIsInView(true)
      return once
        ? undefined
        : () => {
            setIsInView(false)
          }
    }
    const cleanup = inView(el, onEnter, {
      ...realOptions,
      root: realOptions.root ? resolveAccessor(realOptions.root) : undefined,
    })
    onCleanup(cleanup)
  })

  return isInView
}
