import type { JSX } from 'solid-js'
import { createLayoutGroupProvider, type LayoutGroupProps } from '@/primitives/create-layout-group'

export interface SolidLayoutGroupProps extends LayoutGroupProps {
  children?:
    | JSX.Element
    | ((props: { forceRender: VoidFunction; renderKey: number }) => JSX.Element)
}

/**
 * Groups layout-animated motion components so they coordinate measurements
 * and share an inherited layout id namespace. Pass a render-function child
 * to access `forceRender` / `renderKey` for manual remeasurement.
 *
 * @example
 * ```tsx
 * <LayoutGroup id="cards">
 *   <For each={cards()}>{(card) => <Motion layout>{card.title}</Motion>}</For>
 * </LayoutGroup>
 * ```
 */
export default function LayoutGroup(props: SolidLayoutGroupProps) {
  const { forceRender, key } = createLayoutGroupProvider({
    inherit: true,
    ...props,
  })

  return (
    <>
      {typeof props.children === 'function'
        ? props.children({ forceRender, renderKey: key?.() ?? 0 })
        : props.children}
    </>
  )
}
