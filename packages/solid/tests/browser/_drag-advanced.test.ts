/**
 * Drag tests that need either layout projection, complex constraint refs,
 * or precise viewport-position assertions. Marked `it.todo` so they show
 * as unimplemented (not silently passing).
 */
import { describe } from 'vitest'

// drag-framer-page — ported in drag-framer-page.test.tsx (it.fails:
// `_dragX`/`_dragY` private API not whitelisted in
// src/primitives/create-motion-attrs.tsx)

// drag-input-propagation — ported in drag-input-propagation.test.tsx

// drag-layout-reorder-strict — ported in drag-layout-reorder-strict.test.tsx
// (one passing, one it.fails: layout projection)

// drag-momentum — ported in drag-momentum.test.tsx

// drag-nested — ported in drag-nested.test.tsx
// (basic + elastic constraint variants pass; deeper layout-projection
// variants intentionally omitted)

// drag-ref-constraints-absolute-scrolled — ported in
// drag-ref-constraints-absolute-scrolled.test.tsx
// (it.fails: ref-based constraints require layout projection)

// drag-ref-constraints-element-resize — ported in
// drag-ref-constraints-element-resize.test.tsx
// (it.fails: same — layout projection)

// drag-ref-constraints-resize-handle — ported in
// drag-ref-constraints-resize-handle.test.tsx
// (it.fails: same — layout projection)

// drag-rotated-parent — ported in drag-rotated-parent.test.tsx
// (it.fails: MotionConfig.transformPagePoint + correctParentTransform
// not wired)

// drag-scaled-parent — ported in drag-scaled-parent.test.tsx
// (it.fails: MotionConfig.transformPagePoint + correctParentTransform
// not wired)

// drag-scroll-while-drag — ported in drag-scroll-while-drag.test.tsx
// (all 6 sub-tests pass)

// drag-snap-animate-presence-exit — ported in
// drag-snap-animate-presence-exit.test.tsx (passes)

// drag-snap-layout-id-swap — ported in drag-snap-layout-id-swap.test.tsx
// (it.fails: layoutId reorder needs layout projection)

// drag-svg-viewbox — ported in drag-svg-viewbox.test.tsx
// (matched-viewBox passes; mismatched variants are it.fails because
// MotionConfig.transformPagePoint + transformViewBoxPoint helper not
// in Solid port)

// drag-tabs — ported in drag-tabs.test.tsx
// (it.fails: Reorder + LayoutGroup needs layout projection)

// drag-to-reorder — ported in drag-to-reorder.test.tsx
// (all 3 sub-tests pass)

describe.skip('drag-advanced (all ported)', () => {})
