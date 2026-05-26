# motion-solidjs

Motion-compatible animation primitives for SolidJS.

This repository is the monorepo for [`motion-solidjs`](./packages/solid) — a port of [Motion](https://motion.dev) that keeps Motion's component API (`motion.div`, `AnimatePresence`, `LayoutGroup`, `Reorder`, …) while exposing Solid-native `create*` primitives (`createMotionValue`, `createTransform`, `createSpring`, `createScroll`).

See the [package README](./packages/solid/README.md) for the full API and compatibility matrix.

## Quick start

```bash
pnpm add motion-solidjs
```

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

## Repository layout

| Path                                                | Description                                                |
| --------------------------------------------------- | ---------------------------------------------------------- |
| [`packages/solid`](./packages/solid)                | The `motion-solidjs` library (published to npm).           |
| [`apps/docs`](./apps/docs)                          | Documentation site (SolidJS + TanStack Start).             |
| [`apps/react-examples`](./apps/react-examples)      | Reference Motion-for-React examples used to validate parity. |

## Development

Requires Node `>=24.11.1` and `pnpm@11.3.0`.

```bash
pnpm install
pnpm build         # build all workspaces
pnpm test          # run vitest across workspaces
pnpm test:client   # jsdom-style client tests
pnpm test:browser  # real-browser tests via @vitest/browser + Playwright
pnpm test:ssr      # SSR/hydration tests
pnpm check         # type-check
pnpm lint
pnpm fmt
```

The toolchain is [Vite+](https://vite.dev) (`vp`); package-level scripts live in each workspace's `package.json`.

## License

MIT — see [`packages/solid/LICENSE`](./packages/solid/LICENSE).
