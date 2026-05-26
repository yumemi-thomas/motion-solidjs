import { Link, createFileRoute } from '@tanstack/solid-router'
import { For, Show, Suspense, createMemo, createSignal, onCleanup, onMount } from 'solid-js'
import * as v from 'valibot'
import { categories, registry, type Category, type RegistryEntry } from '~/examples/registry'

const categoryIds = categories.map((c) => c.id) as [Category, ...Category[]]

const gallerySearchSchema = v.object({
  cat: v.fallback(v.optional(v.picklist(categoryIds)), undefined),
})

type GallerySearch = v.InferOutput<typeof gallerySearchSchema>

export const Route = createFileRoute('/examples/')({
  component: Gallery,
  validateSearch: gallerySearchSchema,
})

function Gallery() {
  const search = Route.useSearch()
  const filter = () => search().cat ?? 'all'

  const visibleCategories = createMemo(() => {
    const f = filter()
    if (f === 'all') return categories
    return categories.filter((c) => c.id === f)
  })

  const counts = createMemo(() => {
    const map = new Map<Category, number>()
    for (const cat of categories) map.set(cat.id, 0)
    for (const ex of registry) map.set(ex.category, (map.get(ex.category) ?? 0) + 1)
    return map
  })

  return (
    <>
      <section class="relative mx-auto max-w-[1280px] overflow-hidden px-5 pt-16 pb-10 sm:px-7 sm:pt-24">
        <div class="hero-glow pointer-events-none absolute inset-0 -z-10" />
        <div class="mb-5 flex items-center gap-2 font-mono text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-fg-dim">
          <span class="inline-block h-[6px] w-[6px] rounded-full bg-accent" />
          motion-solidjs
          <span class="text-border-strong">·</span>
          <span class="text-accent-3">{registry.length} examples</span>
        </div>
        <h1 class="max-w-[20ch] text-balance text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.04] font-black tracking-[-0.025em] text-fg">
          Motion for SolidJS, <em class="not-italic text-accent-2">by example.</em>
        </h1>
        <p class="mt-5 max-w-[58ch] text-[1.0625rem] leading-[1.65] text-fg-muted">
          A live gallery of every gesture, transition, layout trick, drag constraint, scroll effect
          and motion value pattern — running on motion-solidjs, TanStack Start and SolidJS.
        </p>
        <div class="mt-7 flex flex-wrap gap-3">
          <Link
            to="/docs"
            viewTransition
            class="inline-flex items-center gap-2 rounded-md bg-fg px-4 py-2.5 text-[0.875rem] font-semibold text-bg transition hover:bg-accent"
          >
            Read the docs →
          </Link>
          <a
            href="https://github.com/yumemi-thomas/motion-solidjs"
            target="_blank"
            rel="noreferrer"
            class="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-[0.875rem] font-semibold text-fg transition hover:border-border-strong hover:bg-card-hover"
          >
            View source
          </a>
        </div>
      </section>

      <div class="mx-auto max-w-[1280px] px-5 sm:px-7">
        <div class="border-t border-border" />
      </div>

      <div class="mx-auto flex max-w-[1280px] flex-wrap gap-2 px-5 pt-6 pb-2 sm:px-7">
        <FilterChip label="All" count={registry.length} active={filter() === 'all'} to={{}} />
        <For each={categories}>
          {(cat) => (
            <FilterChip
              label={cat.label}
              count={counts().get(cat.id) ?? 0}
              active={filter() === cat.id}
              to={{ cat: cat.id }}
            />
          )}
        </For>
      </div>

      <div class="mx-auto max-w-[1280px] px-5 pt-6 pb-24 sm:px-7">
        <For each={visibleCategories()}>
          {(cat, i) => {
            const items = registry.filter((e) => e.category === cat.id)
            return (
              <Show when={items.length}>
                <section class={i() === 0 ? '' : 'mt-14'}>
                  <header class="mb-4 flex items-baseline justify-between border-b border-border pb-2">
                    <h2 class="text-[1.25rem] font-bold tracking-[-0.012em] text-fg">
                      {cat.label}
                    </h2>
                    <span class="text-[0.8125rem] text-fg-muted">{cat.blurb}</span>
                  </header>
                  <div class="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
                    <For each={items}>{(ex) => <ExampleCard ex={ex} />}</For>
                  </div>
                </section>
              </Show>
            )
          }}
        </For>
      </div>
    </>
  )
}

function FilterChip(props: { label: string; count: number; active: boolean; to: GallerySearch }) {
  return (
    <Link
      to="/examples"
      search={props.to}
      replace
      data-active={props.active}
      class="rounded-md border border-border bg-card px-3 py-1.5 text-[0.8125rem] text-fg-muted transition hover:border-border-strong hover:text-fg data-[active=true]:border-fg data-[active=true]:bg-fg data-[active=true]:text-bg"
    >
      {props.label}
      <span class="ml-1.5 font-mono tabular-nums opacity-60">{props.count}</span>
    </Link>
  )
}

function ExampleCard(props: { ex: RegistryEntry }) {
  return (
    <article class="group relative flex flex-col overflow-hidden rounded-md border border-border bg-card transition duration-200 hover:border-accent-2 hover:shadow-soft">
      <Show when={props.ex.tag}>
        <span class="pointer-events-none absolute top-2.5 left-2.5 z-20 rounded border border-white/[0.08] bg-black/55 px-2 py-0.5 font-mono text-[0.6875rem] text-[#f3f0e6] backdrop-blur">
          {props.ex.tag}
        </span>
      </Show>
      <div class="stage-grad relative flex aspect-[16/10] items-center justify-center overflow-hidden">
        <LazyExamplePreview ex={props.ex} />
      </div>
      <div class="relative flex flex-col gap-1 border-t border-border px-3.5 pt-3 pb-3.5">
        <Link
          to="/examples/$slug"
          params={{ slug: props.ex.slug }}
          viewTransition
          class="text-[0.9375rem] font-bold text-fg after:absolute after:inset-0 after:content-['']"
          aria-label={`Open ${props.ex.title}`}
        >
          {props.ex.title}
        </Link>
        <div class="text-[0.8125rem] leading-[1.4] text-fg-muted">{props.ex.description}</div>
      </div>
    </article>
  )
}

function LazyExamplePreview(props: { ex: RegistryEntry }) {
  const [visible, setVisible] = createSignal(false)
  let host: HTMLDivElement | undefined
  let observer: IntersectionObserver | undefined

  onMount(() => {
    if (!host || !('IntersectionObserver' in window)) {
      setVisible(true)
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer?.disconnect()
        observer = undefined
        setVisible(true)
      },
      { rootMargin: '360px' },
    )
    observer.observe(host)
  })

  onCleanup(() => {
    observer?.disconnect()
  })

  return (
    <div ref={(el) => (host = el)} class="flex h-full w-full items-center justify-center">
      <Show
        when={visible()}
        fallback={
          <div
            class="h-12 w-12 rounded-md border border-border bg-card/60 shadow-soft"
            aria-hidden="true"
          />
        }
      >
        <Suspense
          fallback={
            <div
              class="h-12 w-12 rounded-md border border-border bg-card/60 shadow-soft"
              aria-hidden="true"
            />
          }
        >
          <props.ex.Component />
        </Suspense>
      </Show>
    </div>
  )
}
