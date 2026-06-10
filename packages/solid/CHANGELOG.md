# Changelog

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
