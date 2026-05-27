import type { Component } from 'solid-js'

export type DocGroup = 'components' | 'primitives' | 'functions' | 'guides'

export interface DocMeta {
  slug: string
  title: string
  group: DocGroup
  description: string
  example?: string
  order?: number
}

export interface DocModule {
  default: Component<Record<string, unknown>>
  meta: DocMeta
}

export interface DocEntry extends DocMeta {
  Component: Component<Record<string, unknown>>
}

export const groupLabels: Record<DocGroup, string> = {
  components: 'Components',
  primitives: 'Primitives',
  functions: 'Functions',
  guides: 'Guides',
}

export const groupOrder: DocGroup[] = ['guides', 'components', 'primitives', 'functions']
