import type { BindingFactory, LazyFeatureEntry } from '@/features/dom-animation'

/**
 * Global registry of binding factories provided by LazyMotion. Populated by
 * `updateLazyFeatures` and read by MotionState during mount.
 *
 * It's a module-level array (rather than context) because MotionState
 * instances exist below the LazyMotion provider in the Solid tree and need a
 * single source of truth that doesn't require re-rendering motion components
 * when the bundle changes.
 */
export const lazyFeatures: BindingFactory[] = []

/**
 * Per-prop lazy-load registry. Entries declare `triggers` (option keys that,
 * when truthy on a motion handle's `options`, cause the feature to load)
 * plus a `load` function that dynamically imports the implementation. The
 * loader is invoked at most once across the entire process: the first
 * trigger fires `load()`, the resolved factory is appended to
 * `lazyFeatures` (so all motion handles bind it on next `updateFeatures`),
 * and the entry is removed from the lazy registry.
 *
 * Bundlers (rollup/rolldown/esbuild) emit each `import('./module')` call as
 * a separate chunk, so a consumer who never uses drag never downloads
 * drag's bytes.
 */
const lazyRegistry: LazyFeatureEntry[] = []
/**
 * Map of `LazyFeatureEntry.id` → in-flight (or resolved) `load()` Promise.
 * Used internally to cache each entry's `load()` across triggers.
 */
const pendingLoads = new Map<string, Promise<BindingFactory>>()

/**
 * Append always-loaded factories to the registry, deduping on identity.
 * Called from `createMotionComponentWithFeatures` (motion namespace
 * creation) and from the `LazyMotion` features-prop effect.
 */
export function updateLazyFeatures(features: BindingFactory[]) {
  for (const feature of features) {
    if (feature && !lazyFeatures.includes(feature)) {
      lazyFeatures.push(feature)
    }
  }
}

/**
 * Register lazy-feature entries from a `FeatureBundle.lazyFeatures` list.
 * Like `updateLazyFeatures`, but each entry stays unresolved until a
 * matching prop trigger fires it.
 */
export function updateLazyFeatureEntries(entries: ReadonlyArray<LazyFeatureEntry>) {
  for (const entry of entries) {
    if (!lazyRegistry.some((e) => e.id === entry.id)) {
      lazyRegistry.push(entry)
    }
  }
}

/**
 * Look up an entry by id. Returns `undefined` if not registered.
 */
function findEntry(id: string): LazyFeatureEntry | undefined {
  return lazyRegistry.find((e) => e.id === id)
}

/**
 * Cached load that walks `dependsOn` first. Returns the factories in bind
 * order (dependencies first, then the entry's own factory). Idempotent
 * across calls: re-invoking for the same id returns the same Promise.
 *
 * Each entry's `load()` is cached in `pendingLoads`. The composite walk
 * itself is also cached, keyed by entry id, so concurrent triggers (drag
 * and layout both depending on projection) share the same dependency
 * resolution work.
 */
/**
 * Cache of composite dependency-walks keyed by entry id. Each promise
 * resolves with the bind-ordered factories (deps first, then the entry).
 */
const orderedLoads = new Map<string, Promise<BindingFactory[]>>()

function loadOrdered(entry: LazyFeatureEntry): Promise<BindingFactory[]> {
  const cached = orderedLoads.get(entry.id)
  if (cached) return cached
  const result = (async () => {
    const ordered: BindingFactory[] = []
    if (entry.dependsOn) {
      for (const depId of entry.dependsOn) {
        const dep = findEntry(depId)
        if (!dep) continue
        const depFactories = await loadOrdered(dep)
        for (const f of depFactories) if (!ordered.includes(f)) ordered.push(f)
      }
    }
    let p = pendingLoads.get(entry.id)
    if (!p) {
      p = entry.load()
      pendingLoads.set(entry.id, p)
    }
    const factory = await p
    if (!ordered.includes(factory)) ordered.push(factory)
    return ordered
  })()
  orderedLoads.set(entry.id, result)
  return result
}

/**
 * Walk the lazy registry against an options object. For each entry whose
 * triggers match, fire `load()` (cached against duplicate calls) and call
 * `onResolved` with the resulting factory. Entries with `dependsOn` resolve
 * their dependencies first; `onResolved` is invoked in dependency order so
 * the consumer (motion handle's `bindFactory`) attaches dependencies before
 * the dependent feature reads from them.
 */
export function checkLazyTriggers(
  options: object,
  onResolved: (factory: BindingFactory) => void,
): void {
  for (const entry of lazyRegistry) {
    if (
      !entry.triggers.some((key) => {
        const value = Reflect.get(options, key)
        return value != null && value !== false
      })
    ) {
      continue
    }
    loadOrdered(entry).then((factories) => {
      for (const factory of factories) {
        if (!lazyFeatures.includes(factory)) lazyFeatures.push(factory)
        onResolved(factory)
      }
    })
  }
}
