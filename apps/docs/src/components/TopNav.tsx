import { Link, useRouterState } from '@tanstack/solid-router'
import { For, Show, createMemo, createSignal } from 'solid-js'
import { motion, AnimatePresence } from 'motion-solidjs'

const tabs = [
  { to: '/docs', label: 'Docs', match: '/docs' },
  { to: '/examples', label: 'Examples', match: '/examples' },
] as const

type TabDef = (typeof tabs)[number]

export function TopNav() {
  const state = useRouterState()
  const pathname = createMemo(() => state().location.pathname)
  const activeTab = createMemo<TabDef['to'] | undefined>(() => {
    const p = pathname()
    return tabs.find((t) => p === t.match || p.startsWith(t.match + '/'))?.to
  })

  const [mobileOpen, setMobileOpen] = createSignal(false)

  return (
    <nav class="sticky top-0 z-50 border-b border-border bg-bg/90 backdrop-blur-md">
      <div class="mx-auto flex h-16 max-w-[1400px] items-center gap-8 px-5 sm:px-7">
        <Link to="/" class="flex shrink-0 items-center gap-2.5">
          <Logo />
          <span class="font-bold tracking-[0.04em] text-fg">
            Motion<span class="text-fg-dim">·</span>Solid
          </span>
        </Link>

        <ul class="hidden flex-1 items-center justify-center gap-1 md:flex">
          <For each={tabs}>{(tab) => <NavTab tab={tab} active={activeTab() === tab.to} />}</For>
        </ul>

        <div class="hidden items-center gap-3 md:flex">
          <a
            class="text-fg-muted transition-colors hover:text-fg"
            href="https://github.com/yumemi-thomas/motion-solidjs"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.34c-2.22.48-2.69-1.07-2.69-1.07-.36-.93-.89-1.18-.89-1.18-.73-.5.06-.49.06-.49.81.06 1.24.83 1.24.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.51-1.07-1.77-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.13 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.03 2.2-.82 2.2-.82.44 1.11.16 1.93.08 2.13.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
        </div>

        <button
          type="button"
          class="md:hidden ml-auto inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-fg-muted"
          aria-label="Open navigation"
          aria-expanded={mobileOpen()}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <Show
              when={mobileOpen()}
              fallback={
                <>
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </>
              }
            >
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </Show>
          </svg>
        </button>
      </div>

      <AnimatePresence>
        <Show when={mobileOpen()}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            class="md:hidden border-t border-border bg-bg"
          >
            <div class="mx-auto flex max-w-[1400px] flex-col gap-1 px-5 py-3">
              <For each={tabs}>
                {(tab) => (
                  <Link
                    to={tab.to}
                    onClick={() => setMobileOpen(false)}
                    viewTransition
                    class="rounded-md px-3 py-2 text-sm font-medium text-fg-muted transition hover:bg-card hover:text-fg"
                  >
                    {tab.label}
                  </Link>
                )}
              </For>
              <a
                class="block rounded-md border-t border-border px-3 py-2 mt-2 pt-3 text-sm text-fg-muted hover:bg-card hover:text-fg"
                href="https://github.com/yumemi-thomas/motion-solidjs"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </div>
          </motion.div>
        </Show>
      </AnimatePresence>
    </nav>
  )
}

function Logo() {
  /* A blue-to-navy lozenge mark with a coral accent — Solid-family
     visual cue without literally copying their logo art. */
  return (
    <span class="relative inline-flex h-7 w-7 items-center justify-center" aria-hidden="true">
      <svg viewBox="0 0 32 32" class="h-full w-full" fill="none">
        <defs>
          <linearGradient
            id="ms-mark-a"
            x1="0"
            y1="0"
            x2="32"
            y2="32"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stop-color="#4a8cd1" />
            <stop offset="100%" stop-color="#1f3a66" />
          </linearGradient>
          <linearGradient
            id="ms-mark-b"
            x1="0"
            y1="0"
            x2="0"
            y2="32"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stop-color="#7ab4ec" />
            <stop offset="100%" stop-color="#2c5f9e" />
          </linearGradient>
        </defs>
        <path
          d="M6 11.5 C6 8 9 5.5 12.5 5.5 L22 5.5 C25.5 5.5 26.5 8 24 11 L13 23.5 C10.5 26 6 24.5 6 21 Z"
          fill="url(#ms-mark-a)"
        />
        <path
          d="M10 21 C10 24.5 13 27 16.5 27 L23 27 C26.5 27 27.5 24.5 25 22 L19 15.5 C17 13.5 14.5 14 13.5 15.5 Z"
          fill="url(#ms-mark-b)"
        />
        <circle cx="22.5" cy="9.5" r="1.6" fill="#e8804b" />
      </svg>
    </span>
  )
}

function NavTab(props: { tab: TabDef; active: boolean }) {
  return (
    <li class="relative">
      <Show when={props.active}>
        {/* `-z-10` keeps the underline behind the link text. */}
        <motion.span
          layoutId="nav-underline"
          class="absolute inset-x-3 -bottom-[18px] -z-10 h-[2px] bg-accent"
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        />
      </Show>
      <Link
        to={props.tab.to}
        viewTransition
        class="relative inline-flex items-center px-3 py-1.5 text-[0.875rem] font-medium transition-colors duration-150"
        classList={{
          'text-fg': props.active,
          'text-fg-muted hover:text-fg': !props.active,
        }}
      >
        {props.tab.label}
      </Link>
    </li>
  )
}
