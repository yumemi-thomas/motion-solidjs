import { Link, createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import * as v from 'valibot'
import { categories, registry, type Category, type RegistryEntry } from '~/examples/registry'

const categoryIds = categories.map((c) => c.id) as [Category, ...Category[]]

const gallerySearchSchema = v.object({
  cat: v.fallback(v.optional(v.picklist(categoryIds)), undefined),
})

type GallerySearch = v.InferOutput<typeof gallerySearchSchema>

export const Route = createFileRoute('/')({
  component: Gallery,
  validateSearch: gallerySearchSchema,
})

function Gallery() {
  const search = Route.useSearch()
  const filter = search.cat ?? 'all'

  const visibleCategories = useMemo(() => {
    if (filter === 'all') return categories
    return categories.filter((c) => c.id === filter)
  }, [filter])

  const counts = useMemo(() => {
    const map = new Map<Category, number>()
    for (const cat of categories) map.set(cat.id, 0)
    for (const ex of registry) map.set(ex.category, (map.get(ex.category) ?? 0) + 1)
    return map
  }, [])

  return (
    <>
      <section className="relative mx-auto max-w-[1280px] overflow-hidden px-7 pt-24 pb-14">
        <div className="hero-glow pointer-events-none absolute inset-0 -z-10" />
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border-strong px-3 py-[5px] text-xs text-fg-muted">
          <span className="text-accent">●</span>
          <span>motion · react</span>
          <span className="font-mono text-fg-dim">{registry.length} examples</span>
        </span>
        <h1 className="max-w-[18ch] text-balance text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.02] font-bold tracking-[-0.03em]">
          Motion for React,
          <br />
          <em className="not-italic bg-gradient-to-r from-[#ff5d9e] via-[#ffd166] to-[#36e0c5] bg-clip-text text-transparent">
            by example.
          </em>
        </h1>
        <p className="mt-5 max-w-[56ch] text-lg leading-[1.55] text-fg-muted">
          A live gallery of every gesture, transition, layout trick, drag constraint, scroll effect
          and motion value pattern — running on motion, TanStack Start and React.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href="https://motion.dev/docs"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-fg px-[18px] py-2.5 text-sm font-medium text-bg transition hover:-translate-y-0.5"
          >
            Read the docs →
          </a>
          <a
            href="https://github.com/motiondivision/motion"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-[18px] py-2.5 text-sm font-medium text-fg transition hover:bg-card-hover"
          >
            View source
          </a>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1280px] flex-wrap gap-2 px-7 pb-6">
        <FilterChip label="All" count={registry.length} active={filter === 'all'} to={{}} />
        {categories.map((cat) => (
          <FilterChip
            key={cat.id}
            label={cat.label}
            count={counts.get(cat.id) ?? 0}
            active={filter === cat.id}
            to={{ cat: cat.id }}
          />
        ))}
      </div>

      <div className="mx-auto max-w-[1280px] px-7 pt-6 pb-24">
        {visibleCategories.map((cat, i) => {
          const items = registry.filter((e) => e.category === cat.id)
          if (!items.length) return null
          return (
            <section key={cat.id} className={i === 0 ? '' : 'mt-14'}>
              <header className="mb-5 flex items-baseline justify-between">
                <h2 className="text-2xl font-semibold tracking-[-0.02em]">{cat.label}</h2>
                <span className="text-sm text-fg-dim">{cat.blurb}</span>
              </header>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                {items.map((ex) => (
                  <ExampleCard key={ex.slug} ex={ex} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </>
  )
}

function FilterChip(props: { label: string; count: number; active: boolean; to: GallerySearch }) {
  return (
    <Link
      to="/"
      search={props.to}
      replace
      data-active={props.active}
      className="rounded-full border border-border bg-card px-3.5 py-1.5 text-[0.8125rem] text-fg-muted transition hover:border-border-strong hover:text-fg data-[active=true]:border-fg data-[active=true]:bg-fg data-[active=true]:text-bg"
    >
      {props.label}
      <span className="ml-1.5 font-mono tabular-nums opacity-50">{props.count}</span>
    </Link>
  )
}

function ExampleCard(props: { ex: RegistryEntry }) {
  const Component = props.ex.Component
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[18px] border border-border bg-card transition duration-300 ease-(--ease-spring) hover:-translate-y-[3px] hover:border-border-strong hover:bg-card-hover">
      {props.ex.tag ? (
        <span className="pointer-events-none absolute top-2.5 left-2.5 z-20 rounded-full border border-white/[0.08] bg-black/55 px-2 py-0.5 text-[0.6875rem] text-fg backdrop-blur">
          {props.ex.tag}
        </span>
      ) : null}
      <div className="stage-grad relative flex aspect-[16/10] items-center justify-center overflow-hidden">
        <Component />
      </div>
      <div className="relative flex flex-col gap-1 border-t border-border px-4 pt-3.5 pb-4">
        <Link
          to="/example/$slug"
          params={{ slug: props.ex.slug }}
          className="text-[0.9375rem] font-medium tracking-[-0.005em] after:absolute after:inset-0 after:content-['']"
          aria-label={`Open ${props.ex.title}`}
        >
          {props.ex.title}
        </Link>
        <div className="text-[0.8125rem] leading-[1.4] text-fg-dim">{props.ex.description}</div>
      </div>
    </article>
  )
}
