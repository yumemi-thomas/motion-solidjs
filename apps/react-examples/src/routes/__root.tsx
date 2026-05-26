/// <reference types="vite/client" />
import { HeadContent, Link, Scripts, createRootRoute, Outlet } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import appCss from '~/styles/app.css?url'
import { ErrorView } from '~/components/ErrorView'
import { NotFoundView } from '~/components/NotFoundView'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      { title: 'Motion React — Examples' },
      {
        name: 'description',
        content:
          'A gallery of motion examples for React: animations, gestures, layout, drag, scroll, SVG and more.',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
  errorComponent: ErrorView,
  notFoundComponent: NotFoundView,
})

function RootDocument(props: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <div className="flex min-h-screen flex-col">
          <nav className="sticky top-0 z-50 border-b border-border bg-bg/70 backdrop-blur-xl backdrop-saturate-150">
            <div className="mx-auto flex max-w-[1280px] items-center gap-5 px-7 py-3.5">
              <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight">
                <span className="h-[22px] w-[22px] rounded-lg bg-grad-rose shadow-glow" />
                <span>Motion React</span>
              </Link>
              <span className="flex-1" />
              <a
                className="text-sm text-fg-muted transition-colors hover:text-fg"
                href="https://motion.dev/"
                target="_blank"
                rel="noreferrer"
              >
                Motion
              </a>
              <a
                className="text-sm text-fg-muted transition-colors hover:text-fg"
                href="https://react.dev/"
                target="_blank"
                rel="noreferrer"
              >
                React
              </a>
              <a
                className="text-sm text-fg-muted transition-colors hover:text-fg"
                href="https://tanstack.com/start/latest/docs/framework/react/overview"
                target="_blank"
                rel="noreferrer"
              >
                TanStack Start
              </a>
            </div>
          </nav>
          <main className="flex-1">{props.children ?? <Outlet />}</main>
          <footer className="border-t border-border px-7 py-8 text-center text-sm text-fg-dim">
            Built with motion · TanStack Start · React
          </footer>
        </div>
        <Scripts />
      </body>
    </html>
  )
}
