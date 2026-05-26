import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { categories, registry, registryBySlug } from '~/examples/registry'

export const Route = createFileRoute('/example/$slug')({
  component: ExamplePage,
  beforeLoad: ({ params }) => {
    if (!registryBySlug.has(params.slug)) throw notFound()
  },
})

function ExamplePage() {
  const { slug } = Route.useParams()
  const entry = registryBySlug.get(slug)!
  const Component = entry.Component
  const cat = categories.find((c) => c.id === entry.category)
  const idx = registry.findIndex((e) => e.slug === slug)
  const prev = idx > 0 ? registry[idx - 1] : registry[registry.length - 1]
  const next = idx < registry.length - 1 ? registry[idx + 1] : registry[0]

  return (
    <div className="mx-auto max-w-[1280px] px-7 pt-8 pb-24">
      <div className="mb-5 flex gap-1.5 text-[0.8125rem] text-fg-dim">
        <Link to="/" className="hover:text-fg">
          Gallery
        </Link>
        <span>/</span>
        <span className="capitalize">{cat?.label}</span>
        <span>/</span>
        <span className="text-fg">{entry.title}</span>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tracking-[-0.025em]">
            {entry.title}
          </h1>
          <p className="mt-2 max-w-[60ch] leading-[1.5] text-fg-muted">{entry.description}</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/example/$slug"
            params={{ slug: prev.slug }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-fg-muted transition hover:border-border-strong hover:text-fg"
          >
            ← Previous
          </Link>
          <Link
            to="/example/$slug"
            params={{ slug: next.slug }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-fg-muted transition hover:border-border-strong hover:text-fg"
          >
            Next →
          </Link>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-6">
        <section className="stage-grad relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-[28px] border border-border p-10">
          {entry.tag ? (
            <span className="absolute top-3 left-3 rounded-full border border-white/[0.08] bg-black/55 px-2 py-0.5 text-[0.6875rem] text-fg backdrop-blur">
              {entry.tag}
            </span>
          ) : null}
          <Component />
        </section>

        <section className="flex flex-col overflow-hidden rounded-[28px] border border-border bg-card">
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3 font-mono text-xs text-fg-dim">
            <span className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
            </span>
            <span className="ml-2">{entry.slug}.tsx</span>
            <span className="flex-1" />
            <CopyButton text={entry.source} />
          </div>
          <div
            className="shiki-host scrollbar-thin"
            dangerouslySetInnerHTML={{ __html: entry.sourceHtml }}
          />
        </section>
      </div>
    </div>
  )
}

function CopyButton(props: { text: string }) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(props.text)
    } catch {
      return
    }
    setCopied(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopied(false), 1600)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy source"
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 font-mono text-[0.6875rem] text-fg-muted transition hover:border-border-strong hover:text-fg"
    >
      {copied ? (
        <>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Copied</span>
        </>
      ) : (
        <>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span>Copy</span>
        </>
      )}
    </button>
  )
}
