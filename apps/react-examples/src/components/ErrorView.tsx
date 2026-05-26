import { Link } from '@tanstack/react-router'

export function ErrorView(props: { error: unknown; reset?: () => void }) {
  const e = props.error as { message?: string; stack?: string; name?: string } | string | undefined
  const message = !e ? 'Unknown error' : typeof e === 'string' ? e : (e.message ?? 'Unknown error')
  const stack = typeof e === 'object' && e ? ((e as { stack?: string }).stack ?? '') : ''
  const name = typeof e === 'object' && e ? ((e as { name?: string }).name ?? 'Error') : 'Error'

  return (
    <div className="mx-auto max-w-[960px] px-7 py-12">
      <div className="overflow-hidden rounded-[28px] border border-border bg-card">
        <div className="flex items-center gap-3 border-b border-border bg-[#1a1015] px-5 py-3">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#ff4d8d]/15 text-[#ff7aa5]">
            !
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-[#ff7aa5]">{name}</div>
            <div className="text-xs text-fg-dim">
              A render or hydration error bubbled up to the root route.
            </div>
          </div>
          <Link
            to="/"
            className="rounded-full border border-border bg-card px-3 py-1 text-xs text-fg-muted hover:text-fg"
          >
            ← Gallery
          </Link>
          {props.reset ? (
            <button
              onClick={() => props.reset?.()}
              className="rounded-full bg-fg px-3 py-1 text-xs font-semibold text-bg"
            >
              Retry
            </button>
          ) : null}
        </div>

        <div className="px-5 py-4">
          <h2 className="text-lg font-semibold tracking-tight">{message}</h2>
        </div>

        <pre className="scrollbar-thin max-h-[60vh] overflow-auto border-t border-border bg-[#0b0b12] px-5 py-4 font-mono text-[0.78125rem] leading-[1.6] whitespace-pre text-[#d4d4f5]">
          {stack || '(no stack)'}
        </pre>
      </div>
    </div>
  )
}
