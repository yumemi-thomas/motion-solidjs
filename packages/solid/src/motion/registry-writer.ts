import type { HTMLRenderState, MotionValue, ResolvedValues, VisualElement } from 'motion-dom'
import { buildHTMLStyles, frame, time } from 'motion-dom'
import type { ValueRegistry } from './value-registry'

// Registry-driven writer — replaces motion-dom's `VisualElement.render()` for
// the common HTML animate path. Subscribing to each MV's `change` event lets
// `<motion.div animate={{x:100}}>` skip VE allocation entirely. Output parity
// is preserved by delegating composition to `buildHTMLStyles`. SVG and other
// VE-needing features (drag, layout, projection) still flow through
// motion-dom's render via `handle.ensureVisualElement()`.

function createHTMLRenderState(): HTMLRenderState {
  return {
    transform: {},
    transformOrigin: {},
    style: {},
    vars: {},
  }
}

export type RegistryWriter = {
  /**
   * Snapshot the registry and write to `el.style`. Idempotent — calling
   * twice in a row with no MV changes produces the same DOM state.
   *
   * No-ops when there's no element or the registry is empty.
   */
  write(): void
  /**
   * Subscribe the writer to `mv`'s change events so any future `mv.set`
   * triggers a re-paint. Returns the unsubscribe function (caller scopes
   * it to a Solid owner via `onCleanup`).
   */
  attach(mv: MotionValue): () => void
}

export function createRegistryWriter(
  getElement: () => HTMLElement | SVGElement | null,
  registry: ValueRegistry,
  getVisualElement?: () => VisualElement<Element> | undefined,
): RegistryWriter {
  const write = (): void => {
    const el = getElement()
    if (!el || registry.size === 0) return
    // The VE is the source of truth once it exists: variant-label animations
    // run through motion-dom's animateVisualElement, which drives the VE's
    // values directly (sometimes a *different* MV instance than the registry's
    // stale entry). Prefer the VE's current value per key so this writer paints
    // the animated value instead of overwriting motion-dom's render with a
    // stale registry value.
    const veValues = getVisualElement?.()?.latestValues
    const snapshot: ResolvedValues = {}
    for (const [key, mv] of registry.entries()) {
      const veVal = veValues?.[key]
      snapshot[key] = veVal !== undefined ? veVal : mv.get()
    }
    const renderState = createHTMLRenderState()
    buildHTMLStyles(renderState, snapshot)
    // Per-key write (rather than replacing `el.style` wholesale) so static
    // style values rendered by Solid aren't clobbered by the writer's
    // smaller snapshot.
    for (const k in renderState.style) {
      const v = renderState.style[k]
      if (v === undefined) continue
      Reflect.set(el.style, k, typeof v === 'number' ? String(v) : v)
    }
    for (const k in renderState.vars) {
      const v = renderState.vars[k]
      if (v === undefined) continue
      el.style.setProperty(k, typeof v === 'number' ? String(v) : v)
    }
  }

  // Batch paints to motion-dom's render step (matches upstream
  // `VisualElement.scheduleRender`). The keyframe resolver silently jumps a
  // value to its final keyframe to measure, then jumps it back — both writes
  // must collapse into one end-of-frame paint so motion-dom's explicit
  // `element.render()` between them is what observably hits the DOM.
  // Without batching, our change-subscribed write would synchronously paint
  // the reverted value before measureViewportBox runs, breaking #2949-style
  // unit conversion (height: 0 → auto, x: 100%, etc).
  let scheduledAt = 0.0
  const scheduleWrite = (): void => {
    const now = time.now()
    if (scheduledAt < now) {
      scheduledAt = now
      frame.render(write, false, true)
    }
  }

  // Idempotent attach — `mv.on('change', ...)` accepts repeat subscriptions
  // but each one fires on every change, multiplying composition cost.
  const attached = new WeakSet<MotionValue>()
  const noop = (): void => {}
  const attach = (mv: MotionValue): (() => void) => {
    if (attached.has(mv)) return noop
    attached.add(mv)
    return mv.on('change', scheduleWrite)
  }

  return { write, attach }
}
