# Changelog

## 0.5.0

### Fixed

- **Style-prop updates no longer go stale after repeated changes.** Solid's `mergeProps`
  wraps the component spread in a memo that observes the same prop signals as the
  internal option-update pipeline, and sibling observers re-run in unstable order
  (Solid swap-removes observers on unsubscribe). Whenever the spread memo ran first it
  painted attrs built from stale values — in practice, the 2nd or 3rd consecutive
  `style` change on an element could render the previous state. The update pipeline is
  now a memo the attrs build reads, making the ordering topological and removing the
  race entirely. Pinned by regression tests that exercise four consecutive changes.

### Changed

- `createTime()` now pauses when the surrounding `MotionConfig` has `isStatic`,
  matching `useTime` in motion/react.
- Variant ownership is resolved identically by the initial-paint path and the
  style-ownership filter (one shared resolver). Three divergences fixed: values inside
  `transitionEnd` now count as animation-owned when filtering `style`; a CSS
  `transition` style prop is no longer treated as animation-owned just because the
  variant carries a transition config; and the filter resolves function variants with
  the presence-aware `custom` (`custom` prop, falling back to `AnimatePresence`'s).
- Internal code health: `values.ts` split into one-primitive-per-file modules, shared
  gesture feature base class, per-feature definition entries composing the bundles,
  the Solid-specific drag layout-shift compensator extracted from the upstream port,
  and upstream-source drift-check headers on the ported drag/pan/constraints files.
  No public API changes. Bundle sizes are unchanged (bare `m` 16.3 kB, `m` +
  `domAnimation` 37.1 kB, `motion.div` page 51.7 kB min+gzip).
- The connection gate (deferring initial animations for elements mounted
  off-document) is now covered by real-browser regression tests pinning both its
  hold-until-connected and bounded-flush behaviors.

## 0.4.0

### Added

- `createMotionValueSignal(mv)` — mirror a `MotionValue` into a Solid signal for use in
  tracked scopes (`createMemo`, JSX, effects), with owner-scoped cleanup. This is the
  deliberate bridge from motion's frameloop into Solid's reactive graph.
- `MotionCreateOptions` is now exported.

### Changed

- **Gestures stay mounted when their prop is removed** (motion/react parity). Previously
  removing e.g. `whileHover` detached the hover listeners; now the gesture stays mounted
  and its dispatch becomes a no-op through the animation state's removed-value handling.
- Internals now delegate to motion-dom throughout: the animation state machine
  (`createAnimationState`), value tracking and style rendering (`VisualElement`), the
  feature lifecycle (`Feature` + `setFeatureDefinitions`), style precedence
  (`copyRawValuesOnly` spread-ordering semantics), and the drag lock (`setDragLock`).
  No public API changes; ~2,800 lines of forked code removed.
- Bundle sizes (minified + gzip): `motion.div` page 53.7 → 51.8 kB, `m` + LazyMotion
  (`domAnimation`) 39.1 → 37.1 kB, bare `m` 16.8 → 16.3 kB.

### Fixed

- Forced static styles (e.g. `opacity`/transforms under `layout`) now seed the initial
  paint correctly and keep rendering after updates.
- A static `style` value for a key owned by `initial`/`animate` no longer overrides the
  animation origin in edge cases around the first paint (style precedence now matches
  motion/react's spread ordering exactly).
