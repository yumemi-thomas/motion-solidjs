import path from 'node:path'
import { playwright } from '@vitest/browser-playwright'
import solid from 'vite-plugin-solid'
import { defineConfig } from 'vitest/config'
import pkg from './package.json' with { type: 'json' }

const aliases = {
  '@': path.resolve(import.meta.dirname, 'src'),
  '#tests': path.resolve(import.meta.dirname, 'tests'),
}

export default defineConfig({
  plugins: [solid()],
  resolve: { alias: aliases },
  test: {
    passWithNoTests: true,
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'tests/ssr/**', 'tests/browser/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    projects: [
      {
        plugins: [solid()],
        resolve: { alias: aliases },
        test: {
          name: 'client',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./tests/setup.ts'],
          include: ['tests/**/*.test.{ts,tsx}'],
          // SSR tests live under tests/ssr/ and run as the `ssr` project below
          // (node environment + vite-plugin-solid in ssr mode). Browser tests
          // run as the `browser` project. Excluding them keeps the client suite
          // clean.
          exclude: ['node_modules', 'tests/ssr/**', 'tests/browser/**'],
        },
      },
      /**
       * SSR project. solid-js/web's `node` condition resolves to the server
       * build (where renderToString actually emits HTML — the browser build
       * is a no-op). vite-plugin-solid's ssr: true transforms JSX into the
       * hyperscript form the server build consumes.
       *
       * Tests live under tests/ssr/ so they share the workspace's path
       * aliases without needing a separate tsconfig.
       */
      {
        plugins: [solid({ ssr: true })],
        resolve: { alias: aliases, conditions: ['development', 'node'] },
        test: {
          name: 'ssr',
          environment: 'node',
          include: ['tests/ssr/**/*.test.{ts,tsx}'],
        },
      },
      {
        plugins: [solid()],
        resolve: { alias: aliases },
        test: {
          name: 'browser',
          include: ['tests/browser/**/*.test.{ts,tsx}'],
          setupFiles: ['./tests/browser/setup.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [
              {
                browser: 'chromium',
                viewport: { width: 1000, height: 660 },
              },
            ],
          },
        },
      },
    ],
  },
  build: {
    minify: false,
    lib: {
      entry: path.resolve(import.meta.dirname, 'src/index.ts'),
      formats: ['es'],
    },
    rolldownOptions: {
      external: [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
        'motion',
        'solid-js',
        'solid-js/web',
      ],
      output: {
        dir: './dist/v1',
        entryFileNames: '[name].mjs',
        exports: 'named',
        format: 'es',
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
})
