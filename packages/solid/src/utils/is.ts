import type { AsTag } from '@/types'

export const isSSR = typeof window === 'undefined'

// Deliberately looser than motion-dom's isHTMLElement (`'offsetHeight' in el
// && !('ownerSVGElement' in el)`): this discriminates "DOM node" from "plain
// config object" at boundaries like dragConstraints, where an SVG element
// ref must also pass — and motion-dom's check fails under jsdom (see the
// note in create-motion-attrs.tsx). Don't "fix" it to match motion-dom.
export function isHTMLElement(value: any): value is HTMLElement {
  return typeof value === 'object' && value !== null && 'nodeType' in value
}

export function invariant(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

export function warning(condition: boolean, message: string): void {
  if (!condition && typeof console !== 'undefined') {
    console.warn(message)
  }
}

const svgElementSet: ReadonlySet<string> = new Set([
  'animate',
  'circle',
  'defs',
  'desc',
  'ellipse',
  'g',
  'image',
  'line',
  'filter',
  'marker',
  'mask',
  'metadata',
  'path',
  'pattern',
  'polygon',
  'polyline',
  'rect',
  'stop',
  'svg',
  'switch',
  'symbol',
  'text',
  'tspan',
  'use',
  'view',
  'clipPath',
  'feBlend',
  'feColorMatrix',
  'feComponentTransfer',
  'feComposite',
  'feConvolveMatrix',
  'feDiffuseLighting',
  'feDisplacementMap',
  'feDistantLight',
  'feDropShadow',
  'feFlood',
  'feFuncA',
  'feFuncB',
  'feFuncG',
  'feFuncR',
  'feGaussianBlur',
  'feImage',
  'feMerge',
  'feMergeNode',
  'feMorphology',
  'feOffset',
  'fePointLight',
  'feSpecularLighting',
  'feSpotLight',
  'feTile',
  'feTurbulence',
  'foreignObject',
  'linearGradient',
  'radialGradient',
  'textPath',
])

export function isSVGElement(as: AsTag): boolean {
  return typeof as === 'string' && svgElementSet.has(as)
}
