import { Link, createFileRoute, notFound } from '@tanstack/solid-router'
import { createMemo } from 'solid-js'
import { MDXProvider } from 'solid-jsx'
import { docs, docsBySlug } from '~/docs/registry'
import { mdxComponents } from '~/docs/mdx-components'
import { groupLabels } from '~/docs/types'

export const Route = createFileRoute('/docs/$slug')({
  component: DocPage,
  beforeLoad: ({ params }) => {
    if (!docsBySlug.has(params.slug)) throw notFound()
  },
})

function DocPage() {
  const { slug } = Route.useParams()()
  const entry = docsBySlug.get(slug)!
  const idx = docs.findIndex((d) => d.slug === slug)
  const prev = createMemo(() => (idx > 0 ? docs[idx - 1] : undefined))
  const next = createMemo(() => (idx < docs.length - 1 ? docs[idx + 1] : undefined))

  return (
    <article class="mx-auto max-w-[820px] px-4 py-10 sm:px-8 sm:py-14">
      <div class="mb-3 flex flex-wrap items-center gap-1.5 text-[0.75rem] text-fg-dim">
        <Link to="/docs" viewTransition class="hover:text-fg">
          Docs
        </Link>
        <span>/</span>
        <span>{groupLabels[entry.group]}</span>
        <span>/</span>
        <span class="text-fg font-mono">{entry.title}</span>
      </div>

      <div class="docs-prose">
        <MDXProvider components={mdxComponents}>
          <entry.Component />
        </MDXProvider>
      </div>

      <nav class="mt-16 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between">
        {prev() ? (
          <Link
            to="/docs/$slug"
            params={{ slug: prev()!.slug }}
            viewTransition
            class="group flex flex-col rounded-xl border border-border bg-card px-4 py-3 transition hover:border-border-strong hover:bg-card-hover"
          >
            <span class="text-[0.6875rem] uppercase tracking-[0.12em] text-fg-dim">← Previous</span>
            <span class="font-mono text-sm text-fg">{prev()!.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next() ? (
          <Link
            to="/docs/$slug"
            params={{ slug: next()!.slug }}
            viewTransition
            class="group flex flex-col rounded-xl border border-border bg-card px-4 py-3 text-right transition hover:border-border-strong hover:bg-card-hover"
          >
            <span class="text-[0.6875rem] uppercase tracking-[0.12em] text-fg-dim">Next →</span>
            <span class="font-mono text-sm text-fg">{next()!.title}</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  )
}
