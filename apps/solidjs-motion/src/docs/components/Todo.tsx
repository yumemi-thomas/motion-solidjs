import type { JSX } from 'solid-js'

/**
 * Visible in-app banner for reference pages that document a motion-solidjs API
 * which solidjs-motion doesn't provide (or exposes differently). Rendered from
 * `.mdx` via the MDX components provider so the gap is obvious to the reader,
 * not buried in a code comment.
 */
export function Todo(props: { children: JSX.Element }) {
  return (
    <aside class="my-5 rounded-lg border border-accent-4/40 bg-accent-4/10 px-4 py-3">
      <strong class="text-[0.8125rem] font-bold uppercase tracking-[0.1em] text-accent-4">
        TODO · solidjs-motion
      </strong>
      <div class="mt-1 text-[0.9375rem] leading-relaxed text-fg-muted">{props.children}</div>
    </aside>
  )
}
