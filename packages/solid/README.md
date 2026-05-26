# motion-solidjs

Motion-compatible animation primitives for SolidJS.

This package keeps Motion-compatible components while exposing Solid-native `create*` primitive names and a simpler primitive-centered architecture.

## Install

```bash
pnpm add motion-solidjs
```

## Motion-Compatible Usage

```tsx
import { motion } from 'motion-solidjs'

export function Example() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    />
  )
}
```

## Solid-Native Primitives

```tsx
import { createMotionValue, createSpring, createTransform } from 'motion-solidjs'

const x = createMotionValue(0)
const opacity = createTransform(x, [0, 100], [0, 1])
const springX = createSpring(x)
```

The primitive API intentionally uses `create*` names only.
React-style `use*` aliases for these primitives are not exported.

## Primitive Motion

```tsx
import { useMotion } from 'motion-solidjs'

export function Panel(props: { open: boolean }) {
  const m = useMotion(() => ({
    initial: { opacity: 0 },
    animate: { opacity: props.open ? 1 : 0 },
    transition: { duration: 0.2 },
  }))

  return (
    <m.Provider>
      <div {...m({ class: 'panel' })} />
    </m.Provider>
  )
}
```

`useMotion` is the canonical hook entry point — it returns a getter that
merges user props with motion's, plus a `Provider` for variant context
propagation. For the tree-shakeable mini bundle, wrap your subtree in
`<LazyMotion>` and use the `<m.X>` components.

## Versioned subpath

The package exposes the Solid 1.x build under an explicit subpath:

```ts
import { motion } from 'motion-solidjs' // Solid 1.x (default)
import { motion } from 'motion-solidjs/v1' // Solid 1.x (explicit)
```

## Compatibility

| Motion React API  | Package API         | Status                   |
| ----------------- | ------------------- | ------------------------ |
| `motion.div`      | `motion.div`        | Supported                |
| `motion.create`   | `motion.create`     | Supported                |
| `AnimatePresence` | `AnimatePresence`   | Supported                |
| `LayoutGroup`     | `LayoutGroup`       | Supported                |
| `Reorder`         | `Reorder`           | Supported                |
| `useMotion`       | `useMotion`         | Supported                |
| `useMotionValue`  | `createMotionValue` | Supported via create API |
| `useTransform`    | `createTransform`   | Supported via create API |
| `useSpring`       | `createSpring`      | Supported via create API |
| `useScroll`       | `createScroll`      | Supported via create API |
| `whileHover`      | `whileHover`        | Supported                |
| `whileTap`        | `whileTap`          | Supported                |
| `whileFocus`      | `whileFocus`        | Supported                |
| `whileInView`     | `whileInView`       | Supported                |
| `layout`          | `layout`            | Supported / experimental |
| `layoutId`        | `layoutId`          | Supported / experimental |
| `LazyMotion`      | `LazyMotion`        | Supported / experimental |

## SSR Notes

The package preserves the existing SSR and hydration behavior from the motion package. Motion components avoid eager child getter evaluation during setup, and first-paint styles are emitted through the same state engine used by `motion.X` components.
