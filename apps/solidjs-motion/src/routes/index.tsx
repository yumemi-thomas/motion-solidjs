import { Link, createFileRoute } from '@tanstack/solid-router'
import { For, Suspense, type JSX } from 'solid-js'
import { motion } from 'solidjs-motion'
import { docs, docsByGroup } from '~/docs/registry'
import { groupLabels } from '~/docs/types'
import { registry } from '~/examples/registry'

export const Route = createFileRoute('/')({
  component: Landing,
})

const featured = [
  { slug: 'hover', title: 'Hover gesture' },
  { slug: 'shared-layout-tabs', title: 'Shared layout tabs' },
  { slug: 'drag-reorder', title: 'Drag reorder' },
  { slug: 'scroll-progress', title: 'Scroll progress' },
] as const

const cardIcons: Record<string, () => JSX.Element> = {
  components: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  primitives: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      aria-hidden="true"
    >
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="M3 12h3" />
      <path d="M18 12h3" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  ),
  functions: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      aria-hidden="true"
    >
      <path d="M4 5h6l2 4 -2 4 -2 4 -4 0" />
      <path d="M14 5h6" />
      <path d="M14 19h6" />
    </svg>
  ),
  guides: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      aria-hidden="true"
    >
      <path d="M4 4h12a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z" />
      <path d="M4 17a3 3 0 0 1 3-3h12" />
    </svg>
  ),
}

function Landing() {
  return (
    <>
      <section class="relative mx-auto max-w-[860px] overflow-hidden px-5 pt-16 pb-10 sm:px-7 sm:pt-24 text-center">
        <div class="hero-glow pointer-events-none absolute inset-0 -z-10" />
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          class="text-[clamp(2.25rem,5vw,3.25rem)] font-black tracking-[-0.02em] text-fg leading-[1.08]"
        >
          Motion <span class="text-accent">for SolidJS</span>,
          <br />
          documented.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          class="mx-auto mt-5 max-w-[58ch] text-[1.0625rem] leading-[1.6] text-fg-muted"
        >
          A complete reference for every solidjs-motion component, primitive and function — each
          with a live example you can copy.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          class="mt-7 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to="/docs"
            viewTransition
            class="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-[0.875rem] font-semibold text-white transition hover:bg-accent-deep"
          >
            Read the docs <span aria-hidden="true">→</span>
          </Link>
          <Link
            to="/examples"
            viewTransition
            class="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-[0.875rem] font-semibold text-fg transition hover:border-border-strong hover:bg-card-hover"
          >
            Browse {registry.length} examples
          </Link>
        </motion.div>
        <div class="mt-6 font-mono text-[0.75rem] uppercase tracking-[0.18em] text-fg-dim">
          solidjs-motion · {docs.length} APIs · {registry.length} examples
        </div>
      </section>

      <section class="mx-auto max-w-[1100px] px-5 pt-10 pb-16 sm:px-7">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <For each={['guides', 'components', 'primitives', 'functions'] as const}>
            {(group) => {
              const items = docsByGroup.get(group) ?? []
              const first = items[0]
              const Icon = cardIcons[group]
              return (
                <Link
                  to={first ? '/docs/$slug' : '/docs'}
                  params={first ? { slug: first.slug } : undefined}
                  viewTransition
                  class="group relative flex flex-col gap-3 rounded-lg border border-border bg-card p-5 transition hover:border-accent hover:bg-card-hover"
                >
                  <span class="inline-flex h-9 w-9 items-center justify-center rounded-md bg-accent/10 text-accent">
                    {Icon ? <Icon /> : null}
                  </span>
                  <div>
                    <div class="flex items-baseline gap-2">
                      <span class="text-[1rem] font-bold text-accent group-hover:underline">
                        {groupLabels[group]}
                      </span>
                      <span class="font-mono text-[0.6875rem] text-fg-dim">{items.length}</span>
                    </div>
                    <p class="mt-1 text-[0.8125rem] leading-[1.45] text-fg-muted">
                      {summaries[group]}
                    </p>
                  </div>
                </Link>
              )
            }}
          </For>
        </div>
      </section>

      <section class="mx-auto max-w-[1100px] px-5 pt-2 pb-24 sm:px-7">
        <div class="mb-5 flex items-baseline justify-between border-b border-border pb-2">
          <h2 class="text-[1.125rem] font-bold tracking-[-0.01em] text-fg">Featured examples</h2>
          <Link to="/examples" viewTransition class="text-sm text-accent hover:underline">
            View all →
          </Link>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <For each={featured}>
            {(f) => {
              const ex = registry.find((e) => e.slug === f.slug)
              if (!ex) return null
              return (
                <Link
                  to="/examples/$slug"
                  params={{ slug: ex.slug }}
                  viewTransition
                  class="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition hover:border-accent hover:shadow-soft"
                >
                  <div class="stage-grad flex aspect-[16/10] items-center justify-center">
                    <Suspense
                      fallback={
                        <div
                          class="h-12 w-12 rounded-md border border-border bg-card/60 shadow-soft"
                          aria-hidden="true"
                        />
                      }
                    >
                      <ex.Component />
                    </Suspense>
                  </div>
                  <div class="flex flex-col gap-1 border-t border-border px-3.5 py-3">
                    <span class="text-[0.9375rem] font-bold text-fg">{ex.title}</span>
                    <span class="text-[0.8125rem] leading-[1.4] text-fg-muted">
                      {ex.description}
                    </span>
                  </div>
                </Link>
              )
            }}
          </For>
        </div>
      </section>
    </>
  )
}

const summaries: Record<string, string> = {
  guides: 'Install, variants, layout, drag, gestures, SSR.',
  components: 'motion.*, Presence, LayoutGroup, Reorder…',
  primitives: 'useMotion, createMotion, createSpring, createScroll…',
  functions: 'animate, delay, stagger, transform, wrap…',
}
