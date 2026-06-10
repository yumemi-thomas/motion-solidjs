// Indirection so the core motion handle can ask the projection root to start
// an update WITHOUT statically importing motion-dom's `rootProjectionNode`.
// That symbol lives in `HTMLProjectionNode`, which pulls the entire projection
// engine (and through it the animation engine) — ~90KB that bare `m` must
// never include. The projection feature (loaded only via `domMax`/LazyMotion)
// registers the real updater; until then this is a no-op, which is correct:
// with no projection feature loaded the root has never updated, so the
// original guard wouldn't have fired either.

type RootProjectionUpdater = () => void

let updater: RootProjectionUpdater | undefined

export function setRootProjectionUpdater(fn: RootProjectionUpdater): void {
  updater = fn
}

/**
 * Request a root projection update for a newly-mounted layout/drag node.
 * No-op until the projection feature registers an updater.
 */
export function requestRootProjectionUpdate(): void {
  updater?.()
}
