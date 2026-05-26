import { createHighlighter } from 'shiki'
import type { ComponentType } from 'react'

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
  default: ComponentType
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

const modules = import.meta.glob<ExampleModule>('./*.tsx', { eager: true })
const sources = import.meta.glob<string>('./*.tsx', {
  eager: true,
  query: '?raw',
  import: 'default',
})

export interface RegistryEntry extends ExampleMeta {
  Component: ComponentType
  source: string
  sourceHtml: string
}

// Pre-highlight every example source at module init so the example detail
// page can render the HTML directly without per-request highlighter cost.
// Top-level await is fine here — registry.ts runs once per server/client boot.
const highlighter = await createHighlighter({
  themes: ['github-light'],
  langs: ['tsx'],
})

function highlight(source: string) {
  return highlighter.codeToHtml(source, {
    lang: 'tsx',
    theme: 'github-light',
  })
}

export const registry: RegistryEntry[] = Object.entries(modules)
  .map(([path, mod]) => {
    if (!mod.meta) return null
    const source = sources[path] ?? ''
    return {
      ...mod.meta,
      Component: mod.default,
      source,
      sourceHtml: highlight(source),
    }
  })
  .filter((x): x is RegistryEntry => x !== null)
  // Deterministic sort by slug — localeCompare can differ between SSR (Node
  // locale) and client (browser locale), which would shift card order and
  // break hydration.
  .sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0))

export const registryBySlug = new Map(registry.map((e) => [e.slug, e]))
export const registryByCategory = (cat: Category) => registry.filter((e) => e.category === cat)
