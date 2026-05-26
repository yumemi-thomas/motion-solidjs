import { lazy, type Component } from 'solid-js'

export type Category =
  | 'gestures'
  | 'animations'
  | 'variants'
  | 'animate-presence'
  | 'layout'
  | 'drag'
  | 'scroll'
  | 'motion-values'
  | 'svg'
  | 'showcase'

export interface ExampleMeta {
  slug: string
  title: string
  category: Category
  description: string
  tag?: string
}

export interface ExampleModule {
  default: Component
  meta: ExampleMeta
}

export const categories: { id: Category; label: string; blurb: string }[] = [
  {
    id: 'gestures',
    label: 'Gestures',
    blurb: 'hover, tap, focus and pan interactions',
  },
  {
    id: 'animations',
    label: 'Animations',
    blurb: 'transitions, keyframes, springs',
  },
  {
    id: 'variants',
    label: 'Variants',
    blurb: 'orchestration and staggering',
  },
  {
    id: 'animate-presence',
    label: 'AnimatePresence',
    blurb: 'mount and unmount animations',
  },
  {
    id: 'layout',
    label: 'Layout',
    blurb: 'layout and shared layout animations',
  },
  {
    id: 'drag',
    label: 'Drag',
    blurb: 'draggable elements, constraints, reorder',
  },
  {
    id: 'scroll',
    label: 'Scroll',
    blurb: 'scroll-linked animations and viewport',
  },
  {
    id: 'motion-values',
    label: 'Motion Values',
    blurb: 'hooks for fine-grained reactivity',
  },
  { id: 'svg', label: 'SVG', blurb: 'paths, morphing and SVG transforms' },
  {
    id: 'showcase',
    label: 'Showcase',
    blurb: 'polished UI components built with motion',
  },
]

const metadata = import.meta.glob<ExampleMeta>('./*.tsx', { eager: true, import: 'meta' })
const modules = import.meta.glob<ExampleModule>('./*.tsx')
const sources = import.meta.glob<string>('./*.tsx', {
  query: '?raw',
  import: 'default',
})

export interface RegistryEntry extends ExampleMeta {
  Component: Component
  loadSource: () => Promise<string>
  loadSourceHtml: () => Promise<string>
}

function cached<T>(loader: () => Promise<T>) {
  let promise: Promise<T> | undefined
  return () => {
    promise ??= loader()
    return promise
  }
}

export const registry: RegistryEntry[] = Object.entries(metadata)
  .map(([path, meta]) => {
    const loadModule = modules[path]
    const loadSource = sources[path]
    if (!meta || !loadModule || !loadSource) return null

    const source = cached(loadSource)
    const sourceHtml = cached(async () => {
      const { highlight } = await import('~/docs/highlighter')
      return highlight(await source(), 'tsx')
    })

    const entry: RegistryEntry = {
      ...meta,
      Component: lazy(loadModule) as Component,
      loadSource: source,
      loadSourceHtml: sourceHtml,
    }
    return entry
  })
  .filter((x): x is RegistryEntry => x !== null)
  // Deterministic sort by slug — localeCompare can differ between SSR (Node
  // locale) and client (browser locale), which would shift card order and
  // break hydration.
  .sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0))

export const registryBySlug = new Map(registry.map((e) => [e.slug, e]))
export const registryByCategory = (cat: Category) => registry.filter((e) => e.category === cat)
