/// <reference types="vite/client" />
import { HeadContent, Scripts, createRootRoute } from '@tanstack/solid-router'
import { HydrationScript } from 'solid-js/web'
import type { JSX } from 'solid-js'
import appCss from '~/styles/app.css?url'
import { ErrorView } from '~/components/ErrorView'
import { NotFoundView } from '~/components/NotFoundView'
import { TopNav } from '~/components/TopNav'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charset: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      { title: 'Motion Solid — Docs' },
      {
        name: 'description',
        content:
          'Motion for SolidJS. Components, primitives and functions for animation, gestures, layout, drag, scroll and SVG — with live examples.',
      },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Geist:wght@300..700&family=Geist+Mono:wght@400;500;700&display=swap',
      },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: ErrorView,
  notFoundComponent: NotFoundView,
})

function RootDocument(props: { children: JSX.Element }) {
  return (
    <html lang="en">
      <head>
        <HydrationScript />
        <HeadContent />
      </head>
      <body>
        <div class="flex min-h-screen flex-col">
          <TopNav />
          <main class="flex-1">{props.children}</main>
          <footer class="border-t border-border px-4 py-8 text-center text-sm text-fg-muted sm:px-7">
            <div class="mx-auto max-w-[1320px] flex flex-col items-center gap-1.5 sm:flex-row sm:justify-between">
              <span>
                Built with{' '}
                <a
                  href="https://github.com/motiondivision/motion"
                  target="_blank"
                  rel="noreferrer"
                  class="text-accent-2 underline decoration-border decoration-1 underline-offset-2 hover:decoration-accent-2"
                >
                  motion
                </a>{' '}
                ·{' '}
                <a
                  href="https://tanstack.com/start"
                  target="_blank"
                  rel="noreferrer"
                  class="text-accent-2 underline decoration-border decoration-1 underline-offset-2 hover:decoration-accent-2"
                >
                  TanStack Start
                </a>{' '}
                ·{' '}
                <a
                  href="https://www.solidjs.com/"
                  target="_blank"
                  rel="noreferrer"
                  class="text-accent-2 underline decoration-border decoration-1 underline-offset-2 hover:decoration-accent-2"
                >
                  SolidJS
                </a>
              </span>
              <span class="font-mono text-xs text-fg-dim">MIT · 2026</span>
            </div>
          </footer>
        </div>
        <Scripts />
      </body>
    </html>
  )
}
