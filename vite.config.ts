import { defineConfig } from 'vite-plus'

export default defineConfig({
  test: {
    projects: ['packages/solid'],
  },
  lint: {
    ignorePatterns: [
      '.agents/**',
      '.claude/**',
      '**/dist/**',
      '**/coverage/**',
      '**/bench/dist/**',
      '**/bench/analyze/**',
      'node_modules/**',
      '**/node_modules/**',
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    rules: {
      'no-unused-expressions': 'off',
      'no-unused-vars': 'off',
      'typescript/await-thenable': 'off',
      'typescript/no-floating-promises': 'off',
      'typescript/no-useless-default-assignment': 'off',
    },
    overrides: [
      {
        files: ['apps/examples/**', 'packages/solid/**'],
        jsPlugins: ['eslint-plugin-solid'],
        rules: {
          'solid/components-return-once': 'warn',
          'solid/event-handlers': 'error',
          'solid/jsx-no-duplicate-props': 'error',
          'solid/jsx-no-script-url': 'error',
          'solid/no-destructure': 'error',
          'solid/no-innerhtml': 'off',
          'solid/reactivity': [
            'warn',
            { customReactiveFunctions: ['resolveElements', 'resolveFirst', 'render'] },
          ],
          'solid/self-closing-comp': 'error',
        },
      },
    ],
  },
  fmt: {
    ignorePatterns: [
      '.agents/**',
      '.claude/**',
      '**/dist/**',
      '**/coverage/**',
      '**/bench/dist/**',
      '**/bench/analyze/**',
      'node_modules/**',
      '**/node_modules/**',
    ],
    semi: false,
    singleQuote: true,
  },
  staged: {
    '*.{js,ts,tsx}': 'vp check --fix',
  },
})
