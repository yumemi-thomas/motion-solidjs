// Port of motion-upstream's Reorder/utils/auto-scroll.ts. Mirrors upstream
// constants, WeakMap-keyed edge/limit tracking, and page→viewport coord
// adjustment so behaviour stays in lockstep.

const threshold = 50
const maxSpeed = 25

const overflowStyles = new Set(['auto', 'scroll'])

/**
 * Tracks the initial scroll limit per scrollable element. We snapshot the
 * limit when an edge becomes active and refuse to scroll past it; this
 * prevents the drag from triggering virtualised content to grow the
 * scrollable area indefinitely (Bug 1 fix in upstream).
 */
const initialScrollLimits = new WeakMap<HTMLElement, number>()

/**
 * Tracks which edge is currently driving the auto-scroll for a given
 * scrollable element. `"start"` is top (or left for the x axis), `"end"`
 * is bottom (or right).
 */
type ActiveEdge = 'start' | 'end' | null
const activeScrollEdge = new WeakMap<HTMLElement, ActiveEdge>()

/**
 * The Reorder.Group element that initiated the current drag. Stored so
 * `resetAutoScrollState` can find the scrollable ancestor on drag end
 * without re-deriving it from a stale element reference.
 */
let currentGroupElement: Element | null = null

/**
 * Clears all auto-scroll bookkeeping for the most recently dragged group.
 * Called from Reorder.Item's onDragEnd. Mirrors upstream's `resetAutoScrollState`.
 */
export function resetAutoScrollState(): void {
  if (currentGroupElement) {
    const scrollableAncestor = findScrollableAncestor(currentGroupElement, 'y')
    if (scrollableAncestor) {
      activeScrollEdge.delete(scrollableAncestor)
      initialScrollLimits.delete(scrollableAncestor)
    }
    const scrollableAncestorX = findScrollableAncestor(currentGroupElement, 'x')
    if (scrollableAncestorX && scrollableAncestorX !== scrollableAncestor) {
      activeScrollEdge.delete(scrollableAncestorX)
      initialScrollLimits.delete(scrollableAncestorX)
    }
    currentGroupElement = null
  }
}

function isScrollableElement(element: Element, axis: 'x' | 'y'): boolean {
  const style = getComputedStyle(element)
  const overflow = axis === 'x' ? style.overflowX : style.overflowY

  const isDocumentScroll = element === document.body || element === document.documentElement

  return overflowStyles.has(overflow) || isDocumentScroll
}

function findScrollableAncestor(element: Element | null, axis: 'x' | 'y'): HTMLElement | null {
  let current = element?.parentElement
  while (current) {
    if (isScrollableElement(current, axis)) {
      return current
    }
    current = current.parentElement
  }
  return null
}

function getScrollAmount(
  pointerPosition: number,
  scrollElement: HTMLElement,
  axis: 'x' | 'y',
): { amount: number; edge: ActiveEdge } {
  const rect = scrollElement.getBoundingClientRect()

  const start = axis === 'x' ? Math.max(0, rect.left) : Math.max(0, rect.top)
  const end =
    axis === 'x'
      ? Math.min(window.innerWidth, rect.right)
      : Math.min(window.innerHeight, rect.bottom)

  const distanceFromStart = pointerPosition - start
  const distanceFromEnd = end - pointerPosition

  if (distanceFromStart < threshold) {
    const intensity = 1 - distanceFromStart / threshold
    return { amount: -maxSpeed * intensity * intensity, edge: 'start' }
  } else if (distanceFromEnd < threshold) {
    const intensity = 1 - distanceFromEnd / threshold
    return { amount: maxSpeed * intensity * intensity, edge: 'end' }
  }

  return { amount: 0, edge: null }
}

/**
 * Called on every drag move from Reorder.Item. If the pointer is in the
 * threshold zone of the scrollable ancestor's leading or trailing edge,
 * and the drag velocity points toward that edge, scrolls the ancestor by
 * `maxSpeed * intensity^2` pixels. Velocity-gated entry prevents
 * stationary drags inside the threshold zone from auto-scrolling.
 */
export function autoScrollIfNeeded(
  groupElement: Element | null,
  pointerPosition: number,
  axis: 'x' | 'y',
  velocity: number,
): void {
  if (!groupElement) return

  currentGroupElement = groupElement

  const scrollableAncestor = findScrollableAncestor(groupElement, axis)
  if (!scrollableAncestor) return

  // Gesture system reports page coordinates, but getBoundingClientRect is
  // viewport-relative — subtract page scroll to align them.
  const viewportPointerPosition = pointerPosition - (axis === 'x' ? window.scrollX : window.scrollY)

  const { amount: scrollAmount, edge } = getScrollAmount(
    viewportPointerPosition,
    scrollableAncestor,
    axis,
  )

  if (edge === null) {
    activeScrollEdge.delete(scrollableAncestor)
    initialScrollLimits.delete(scrollableAncestor)
    return
  }

  const currentActiveEdge = activeScrollEdge.get(scrollableAncestor)

  const isDocumentScroll =
    scrollableAncestor === document.body || scrollableAncestor === document.documentElement

  if (currentActiveEdge !== edge) {
    // Velocity-gated entry: stationary drags inside the threshold zone
    // must not start auto-scrolling.
    const shouldStart = (edge === 'start' && velocity < 0) || (edge === 'end' && velocity > 0)
    if (!shouldStart) return

    activeScrollEdge.set(scrollableAncestor, edge)

    const maxScroll =
      axis === 'x'
        ? scrollableAncestor.scrollWidth -
          (isDocumentScroll ? window.innerWidth : scrollableAncestor.clientWidth)
        : scrollableAncestor.scrollHeight -
          (isDocumentScroll ? window.innerHeight : scrollableAncestor.clientHeight)

    initialScrollLimits.set(scrollableAncestor, maxScroll)
  }

  // Cap at initial limit so virtualised content can't grow the scroll area
  // indefinitely under the pointer (upstream Bug 1).
  if (scrollAmount > 0) {
    const initialLimit = initialScrollLimits.get(scrollableAncestor)!
    const currentScroll =
      axis === 'x'
        ? isDocumentScroll
          ? window.scrollX
          : scrollableAncestor.scrollLeft
        : isDocumentScroll
          ? window.scrollY
          : scrollableAncestor.scrollTop
    if (currentScroll >= initialLimit) return
  }

  if (axis === 'x') {
    if (isDocumentScroll) {
      window.scrollBy({ left: scrollAmount })
    } else {
      scrollableAncestor.scrollLeft += scrollAmount
    }
  } else {
    if (isDocumentScroll) {
      window.scrollBy({ top: scrollAmount })
    } else {
      scrollableAncestor.scrollTop += scrollAmount
    }
  }
}
