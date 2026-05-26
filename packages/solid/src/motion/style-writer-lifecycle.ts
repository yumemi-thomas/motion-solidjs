import type { MotionValue } from 'motion-dom'

import { createRegistryWriter, type RegistryWriter } from './registry-writer'
import type { ValueRegistry } from './value-registry'

export function createStyleWriterLifecycle(options: {
  getElement(): HTMLElement | SVGElement | null
  getRegistry(): ValueRegistry
  type: 'html' | 'svg'
}) {
  let writer: RegistryWriter | undefined
  const subscriptions: Array<() => void> = []

  const getWriter = (): RegistryWriter | undefined => {
    if (options.type === 'svg') return undefined
    if (!writer) {
      writer = createRegistryWriter(() => options.getElement(), options.getRegistry())
    }
    return writer
  }

  return {
    attach(mv: MotionValue): void {
      const w = getWriter()
      if (!w) return
      subscriptions.push(w.attach(mv))
    },
    dispose(): void {
      for (const unsubscribe of subscriptions) unsubscribe()
      subscriptions.length = 0
    },
  }
}
