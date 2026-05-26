// oxlint-disable solid/no-innerhtml
import { Link } from '@tanstack/solid-router'
import { Show, Suspense, createResource, createSignal, onCleanup } from 'solid-js'
import { registryBySlug } from '~/examples/registry'

export function Example(props: { slug: string; showSource?: boolean }) {
  const entry = registryBySlug.get(props.slug)
  if (!entry) {
    return (
      <div class="rounded-2xl border border-border bg-card p-4 text-sm text-fg-muted">
        Missing example: <code class="font-mono text-accent">{props.slug}</code>
      </div>
    )
  }

  const [source] = createResource(() => entry.loadSource())
  const [sourceHtml] = createResource(() => entry.loadSourceHtml())

  return (
    <figure class="not-prose my-6 flex flex-col gap-3">
      <section class="stage-grad relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-[20px] border border-border p-8">
        <Show when={entry.tag}>
          <span class="absolute top-3 left-3 rounded-full border border-white/[0.08] bg-black/55 px-2 py-0.5 text-[0.6875rem] text-fg backdrop-blur">
            {entry.tag}
          </span>
        </Show>
        <Suspense
          fallback={
            <div
              class="h-12 w-12 rounded-md border border-border bg-card/60 shadow-soft"
              aria-hidden="true"
            />
          }
        >
          <entry.Component />
        </Suspense>
      </section>
      <Show when={props.showSource !== false}>
        <section class="flex flex-col overflow-hidden rounded-[20px] border border-border bg-card">
          <div class="flex items-center gap-2.5 border-b border-border px-4 py-2.5 font-mono text-xs text-fg-dim">
            <span class="flex gap-1.5">
              <span class="h-2 w-2 rounded-full bg-[#ff5f56]" />
              <span class="h-2 w-2 rounded-full bg-[#ffbd2e]" />
              <span class="h-2 w-2 rounded-full bg-[#27c93f]" />
            </span>
            <span class="ml-1.5">{entry.slug}.tsx</span>
            <span class="flex-1" />
            <CopyButton text={source() ?? ''} disabled={!source()} />
            <Link
              to="/examples/$slug"
              params={{ slug: entry.slug }}
              viewTransition
              class="rounded-md border border-border px-2 py-1 text-[0.6875rem] text-fg-muted transition hover:border-border-strong hover:text-fg"
            >
              Open ↗
            </Link>
          </div>
          <Show
            when={sourceHtml()}
            fallback={<div class="px-4 py-6 font-mono text-xs text-fg-dim">Loading source...</div>}
          >
            {(html) => <div class="shiki-host scrollbar-thin max-h-[420px]" innerHTML={html()} />}
          </Show>
        </section>
      </Show>
    </figure>
  )
}

function CopyButton(props: { text: string; disabled?: boolean }) {
  const [copied, setCopied] = createSignal(false)
  let resetTimer: ReturnType<typeof setTimeout> | undefined

  const handleCopy = async () => {
    if (props.disabled) return
    try {
      await navigator.clipboard.writeText(props.text)
    } catch {
      return
    }
    setCopied(true)
    if (resetTimer) clearTimeout(resetTimer)
    resetTimer = setTimeout(() => setCopied(false), 1600)
  }

  onCleanup(() => {
    if (resetTimer) clearTimeout(resetTimer)
  })

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={props.disabled}
      aria-label="Copy source"
      class="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 font-mono text-[0.6875rem] text-fg-muted transition hover:border-border-strong hover:text-fg disabled:cursor-not-allowed disabled:opacity-50"
    >
      {copied() ? 'Copied' : 'Copy'}
    </button>
  )
}
