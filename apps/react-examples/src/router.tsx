import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { ErrorView } from './components/ErrorView'
import { NotFoundView } from './components/NotFoundView'

export function getRouter() {
  const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultErrorComponent: ErrorView,
    defaultNotFoundComponent: NotFoundView,
  })

  return router
}
