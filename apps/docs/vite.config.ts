import path from 'node:path'
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/solid-start/plugin/vite'
import { nitro } from 'nitro/vite'
import viteSolid from 'vite-plugin-solid'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@mdx-js/rollup'
import rehypeShiki from '@shikijs/rehype'
import remarkGfm from 'remark-gfm'

// Alias `motion-solidjs` to source so vite-plugin-solid transforms its JSX
// (the shipped dist is unbundled; aliasing source keeps local docs in sync). `@` resolves the
// source-internal self-references like `from '@/features'`.
const motionSolidSrc = path.resolve(import.meta.dirname, '../../packages/solid/src')

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      'motion-solidjs': path.join(motionSolidSrc, 'index.ts'),
      '@': motionSolidSrc,
      '~': path.resolve(import.meta.dirname, 'src'),
    },
  },
  optimizeDeps: {
    exclude: ['motion-solidjs'],
  },
  ssr: {
    noExternal: ['motion-solidjs', 'flubber'],
  },
  plugins: [
    tailwindcss(),
    // solid-jsx adapts @mdx-js output to Solid's JSX runtime — Solid's own
    // compiler doesn't see MDX files, so inline components inside .mdx are
    // not reactive. Components imported from .tsx work normally.
    {
      enforce: 'pre',
      ...mdx({
        jsxImportSource: 'solid-jsx',
        providerImportSource: 'solid-jsx',
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          [
            rehypeShiki,
            {
              theme: 'github-light',
              defaultLanguage: 'tsx',
              fallbackLanguage: 'tsx',
            },
          ],
        ],
      }),
    },
    tanstackStart(),
    nitro(),
    viteSolid({ ssr: true }),
  ],
})
