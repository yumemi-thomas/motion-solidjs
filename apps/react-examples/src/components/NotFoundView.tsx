import { Link } from '@tanstack/react-router'

export function NotFoundView() {
  return (
    <div className="mx-auto max-w-[640px] px-7 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-fg-muted">
        That route isn’t in this gallery. Head back and pick an example.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-full bg-fg px-5 py-2 text-sm font-semibold text-bg"
      >
        ← Gallery
      </Link>
    </div>
  )
}
