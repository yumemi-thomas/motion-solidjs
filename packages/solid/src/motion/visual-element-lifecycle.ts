import { isForcedMotionValue, isMotionValue } from 'motion-dom'
import type { ResolvedValues, VisualElement, VisualElementOptions } from 'motion-dom'

import type { MotionStyleProps } from '@/types'
import { dashToCamel } from './render-style'
import { resolveMotionDomProps, type MotionDomOptions } from './motion-dom-props'

export type VisualElementRenderer = (
  tag: string,
  options: VisualElementOptions<unknown, unknown>,
) => VisualElement<Element>

export interface VisualElementLifecycleOptions {
  initialRenderer?: VisualElementRenderer
  getElement(): HTMLElement | SVGElement | null
  getLatestValues(): ResolvedValues
  getOptions(): MotionDomOptions
  getParent(): VisualElementLifecycleParent | undefined
  getTag(): string
  type: 'html' | 'svg'
}

interface VisualElementLifecycleParent {
  visualElement?: VisualElement<Element>
  ensureVisualElement(): VisualElement<Element> | undefined
}

function createRenderState() {
  return {
    transform: {},
    transformOrigin: {},
    style: {},
    vars: {},
    attrs: {},
  }
}

function syncForcedStyleValues(
  visualElement: VisualElement<Element> | undefined,
  type: 'html' | 'svg',
  nextOptions: MotionDomOptions,
) {
  if (!visualElement || type === 'svg') return
  const style: MotionStyleProps | undefined = nextOptions.style
  if (!style) return
  const motionProps = resolveMotionDomProps(nextOptions)
  for (const key in style) {
    const motionKey = dashToCamel(key)
    const value = style[key]
    if (!isMotionValue(value) && isForcedMotionValue(motionKey, motionProps)) {
      visualElement.setStaticValue(motionKey, value)
    }
  }
}

export function createVisualElementLifecycle(options: VisualElementLifecycleOptions) {
  let renderer = options.initialRenderer
  let visualElement: VisualElement<Element> | undefined

  const construct = () => {
    if (!renderer || visualElement) return
    const parent = options.getParent()
    parent?.ensureVisualElement()
    const currentOptions = options.getOptions()
    visualElement = renderer(options.getTag(), {
      presenceContext: currentOptions.presenceContext?.motionDomPresenceContext ?? null,
      parent: parent?.visualElement,
      props: resolveMotionDomProps(currentOptions),
      visualState: {
        renderState: createRenderState(),
        latestValues: { ...options.getLatestValues() },
      },
      reducedMotionConfig: currentOptions.motionConfig?.reducedMotion,
    })
    syncForcedStyleValues(visualElement, options.type, currentOptions)
    const element = options.getElement()
    if (element) visualElement.mount(element)
  }

  return {
    get() {
      return visualElement
    },
    init(nextRenderer: VisualElementRenderer) {
      if (visualElement) return
      renderer = nextRenderer
      construct()
    },
    ensure() {
      if (visualElement) return visualElement
      construct()
      return visualElement
    },
    syncForcedStyleValues(nextOptions: MotionDomOptions) {
      syncForcedStyleValues(visualElement, options.type, nextOptions)
    },
    update(nextOptions: MotionDomOptions) {
      visualElement?.update(
        resolveMotionDomProps(nextOptions),
        nextOptions.presenceContext?.motionDomPresenceContext ?? null,
      )
    },
    mount(element: HTMLElement | SVGElement) {
      visualElement?.mount(element)
    },
    render() {
      visualElement?.render()
    },
    setLatestValue(key: string, value: ResolvedValues[string]) {
      if (visualElement) visualElement.latestValues[key] = value
    },
    unmount() {
      visualElement?.unmount()
    },
  }
}
