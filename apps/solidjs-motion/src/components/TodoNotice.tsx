import type { JSX } from 'solid-js'

/**
 * Visible in-app marker for behaviour these docs demonstrate that
 * solidjs-motion can't (yet) replicate 1:1. Renders an amber banner so the
 * limitation is obvious on the example page itself, not only in the source.
 */
export function TodoNotice(props: { children: JSX.Element }) {
  return (
    <p
      role="note"
      class="max-w-[22rem] rounded-md border border-accent-4/40 bg-accent-4/10 px-3 py-1.5 text-center text-[11px] leading-snug font-medium text-accent-4"
    >
      <span class="font-bold tracking-wide">TODO</span> · {props.children}
    </p>
  )
}
