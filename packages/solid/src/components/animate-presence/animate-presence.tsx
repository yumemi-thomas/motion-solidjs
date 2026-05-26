import { createComputed, createSignal, onCleanup, onMount, Show, type JSX } from 'solid-js'
import { resolveElements, resolveFirst } from '@solid-primitives/refs'
import { createListTransition, createSwitchTransition } from '@solid-primitives/transition-group'
import { frame } from 'motion-dom'
import type { PresenceContextProps } from 'motion-dom'
import { createMotionConfig } from '@/components/motion-config/context'
import { PresenceContext, provideAnimatePresence } from './presence'

export interface AnimatePresenceProps {
  mode?: 'wait' | 'popLayout' | 'sync'
  initial?: boolean
  as?: string
  custom?: unknown
  onExitComplete?: VoidFunction
  anchorX?: 'left' | 'right'
  /**
   * Root element to use when injecting styles, used when mode === `"popLayout"`.
   * This defaults to document.head but can be overridden e.g. for use in shadow DOM.
   */
  root?: HTMLElement | ShadowRoot
}

export interface SolidAnimatePresenceProps extends AnimatePresenceProps {
  children?: JSX.Element
}

let popId = 0

function createPopLayout(props: AnimatePresenceProps) {
  const styles = new WeakMap<Element, HTMLStyleElement>()
  const config = createMotionConfig()

  function addPopStyle(element: HTMLElement) {
    if (props.mode !== 'popLayout') return

    const parent = element.offsetParent
    const parentWidth = parent instanceof HTMLElement ? parent.offsetWidth || 0 : 0
    // Use getComputedStyle for sub-pixel widths; offsetWidth/Height round and
    // drift the popped clone off its pre-pop rect. Mirrors upstream PopChild.
    const computedStyle = getComputedStyle(element)
    const size = {
      height: parseFloat(computedStyle.height) || 0,
      width: parseFloat(computedStyle.width) || 0,
      top: element.offsetTop,
      left: element.offsetLeft,
      right: 0,
    }
    size.right = parentWidth - size.width - size.left
    // Emit both `left` and `right` (one measured, the other `auto`) so the
    // rule overrides any inline value. Otherwise the over-constraint resolves
    // by ignoring `right` and the popped clone drifts off-position.
    const x =
      props.anchorX === 'left'
        ? `left: ${size.left}px !important; right: auto`
        : `left: auto !important; right: ${size.right}px`

    const elementPopId = `pop-${popId++}`
    element.dataset.motionPopId = elementPopId
    const style = document.createElement('style')
    if (config().nonce) {
      style.nonce = config().nonce
    }
    styles.set(element, style)
    // Allow `root` to target a ShadowRoot — document.head styles don't pierce
    // shadow tree isolation, so the rule wouldn't reach a popped element there.
    const styleRoot = props.root ?? document.head
    styleRoot.appendChild(style)
    style.sheet?.insertRule(`
    [data-motion-pop-id="${elementPopId}"] {
      position: absolute !important;
      width: ${size.width}px !important;
      height: ${size.height}px !important;
      top: ${size.top}px !important;
      ${x} !important;
      }
      `)
  }

  function removePopStyle(element: HTMLElement) {
    const style = styles.get(element)
    if (!style) return
    styles.delete(element)
    const styleRoot = props.root ?? document.head
    frame.render(() => {
      if (styleRoot.contains(style)) {
        styleRoot.removeChild(style)
      }
    })
  }

  return {
    addPopStyle,
    removePopStyle,
  }
}

// Each Presence owns a local registry of runExit closures keyed by element.
// Motion children register on attach; transition-group's onExit walks this
// registry to find every exit closure inside the removed subtree.
function collectSubtreeExits(
  root: Element,
  runExits: Map<Element, () => Promise<void>>,
): Array<[Element, () => Promise<void>]> {
  const out: Array<[Element, () => Promise<void>]> = []
  for (const [el, fn] of runExits) {
    if (el === root || root.contains(el)) out.push([el, fn])
  }
  return out
}

function createPresenceContainer(props: AnimatePresenceProps) {
  const runExits = new Map<Element, () => Promise<void>>()
  const runEnters = new Map<Element, () => void>()
  const { addPopStyle, removePopStyle } = createPopLayout(props)
  const [mounted, setMounted] = createSignal(false)
  // Mirror onExitComplete into a plain variable so the async .then() below
  // can invoke the latest callback without a prop read in an async scope.
  let latestOnExitComplete: VoidFunction | undefined
  createComputed(() => {
    latestOnExitComplete = props.onExitComplete
  })

  // motion-dom's presence context shape — features (drag, layout, animate)
  // still consume this; we plumb our scope through.
  const motionDomPresenceContext: PresenceContextProps = {
    id: '0', // motion-dom needs a stable id; one per Presence is fine
    isPresent: true,
    register: () => () => {},
    get initial(): false | undefined {
      if (mounted()) return undefined
      return props.initial === false ? false : undefined
    },
    get custom() {
      return props.custom
    },
  }

  const ctx: PresenceContext = {
    get initial() {
      if (mounted()) return undefined
      return props.initial
    },
    get custom() {
      return props.custom
    },
    motionDomPresenceContext,
    register(el, runExit) {
      runExits.set(el, runExit)
      return () => runExits.delete(el)
    },
    registerEnter(el, runEnter) {
      runEnters.set(el, runEnter)
    },
    beforeUnmount(root) {
      const exiting = collectSubtreeExits(root, runExits)
      if (exiting.length === 0) {
        latestOnExitComplete?.()
        return Promise.resolve()
      }
      if (root instanceof HTMLElement) addPopStyle(root)
      return Promise.all(exiting.map((pair) => pair[1]())).then(() => {
        for (const [el] of exiting) runExits.delete(el)
        if (root instanceof HTMLElement) removePopStyle(root)
        latestOnExitComplete?.()
      })
    },
    beforeMount(root) {
      // Deferred to a microtask: createSwitchTransition fires onEnter inside
      // the surrounding batch (before signal updates commit), so the new
      // element's createMotionHandle/registerEnter hasn't run yet and the
      // registry is empty. The microtask lets Solid commit, the element
      // render, attach run, and registerEnter populate before we walk.
      // One-shot: each runEnter is deleted after firing.
      queueMicrotask(() => {
        for (const [el, fn] of runEnters) {
          if (el === root || root.contains(el)) {
            fn()
            runEnters.delete(el)
          }
        }
      })
    },
  }

  provideAnimatePresence(ctx)

  onMount(() => setMounted(true))

  onCleanup(() => {
    runExits.clear()
    runEnters.clear()
  })

  return ctx
}

function enterAdapter(ctx: PresenceContext) {
  return (el: Element, done: VoidFunction) => {
    if (!(el instanceof HTMLElement)) {
      done()
      return
    }
    ctx.beforeMount?.(el)
    done()
  }
}

function exitAdapter(ctx: PresenceContext) {
  return (el: Element, done: VoidFunction) => {
    if (!(el instanceof HTMLElement)) {
      done()
      return
    }
    const result = ctx.beforeUnmount?.(el)
    if (result instanceof Promise) {
      result.then(done)
    } else {
      done()
    }
  }
}

type TransitionBranchProps = {
  children?: JSX.Element
  enter: (el: Element, done: VoidFunction) => void
  exit: (el: Element, done: VoidFunction) => void
}

function SwitchTransitionBranch(props: TransitionBranchProps) {
  // resolveFirst gives a bare DOM element accessor; SSR-safe (null until refs fire).
  const first = resolveFirst(() => props.children)
  // Wrap in a fragment so the JSX type-checks; returning the accessor directly
  // works at runtime but fails JSX.Element type at the call site.
  const rendered = createSwitchTransition(first, {
    mode: 'out-in',
    appear: false,
    onEnter: (el, done) => props.enter(el, done),
    onExit: (el, done) => props.exit(el, done),
  })
  return <>{rendered()}</>
}

function ListTransitionBranch(props: TransitionBranchProps) {
  const elements = resolveElements(() => props.children)
  const list = () => {
    const els = elements()
    if (!els) return []
    return Array.isArray(els) ? els : [els]
  }
  const rendered = createListTransition(list, {
    appear: false,
    onChange: ({ added, removed, finishRemoved }) => {
      added.forEach((el) => props.enter(el, () => {}))
      if (removed.length === 0) return
      let outstanding = removed.length
      const done = () => {
        outstanding -= 1
        if (outstanding === 0) finishRemoved(removed)
      }
      removed.forEach((el) => props.exit(el, done))
    },
  })
  return <>{rendered()}</>
}

/**
 * Animates children when they are added to or removed from the tree.
 *
 * Wraps a `Show`/`For`/conditional rendering surface so descendant `motion`
 * elements can run their `exit` variant before unmount. Use `mode="wait"` for
 * single-child swaps (e.g. routes), the default `"sync"` for lists, and
 * `"popLayout"` to pop exiting children out of layout flow.
 *
 * @example
 * ```tsx
 * <AnimatePresence mode="wait">
 *   <Show when={visible()}>
 *     <motion.div
 *       initial={{ opacity: 0 }}
 *       animate={{ opacity: 1 }}
 *       exit={{ opacity: 0 }}
 *     />
 *   </Show>
 * </AnimatePresence>
 * ```
 */
export default function AnimatePresence(props: SolidAnimatePresenceProps) {
  const ctx = createPresenceContainer(props)
  const enter = enterAdapter(ctx)
  const exit = exitAdapter(ctx)

  return (
    <Show
      when={props.mode === 'wait'}
      fallback={
        <ListTransitionBranch enter={enter} exit={exit}>
          {props.children}
        </ListTransitionBranch>
      }
    >
      <SwitchTransitionBranch enter={enter} exit={exit}>
        {props.children}
      </SwitchTransitionBranch>
    </Show>
  )
}
