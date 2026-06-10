import { build } from 'esbuild'
import { solidPlugin } from 'esbuild-plugin-solid'
import { gzipSync } from 'node:zlib'
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('.', import.meta.url).pathname
const entriesDir = join(root, 'solid/entries')

const results = []
for (const file of readdirSync(entriesDir).filter((f) => f.endsWith('.tsx'))) {
  const name = file.replace(/\.tsx$/, '')
  const out = join(root, 'dist', `solid-${name}`, 'bundle.js')
  const result = await build({
    entryPoints: [join(entriesDir, file)],
    bundle: true,
    minify: true,
    format: 'esm',
    outfile: out,
    metafile: true,
    define: { 'process.env.NODE_ENV': '"production"' },
    plugins: [solidPlugin()],
    logLevel: 'silent',
  })
  writeFileSync(join(root, 'dist', `solid-${name}`, 'meta.json'), JSON.stringify(result.metafile))
  const raw = readFileSync(out)
  results.push({ name, raw: raw.length, gzip: gzipSync(raw, { level: 9 }).length })
}

results.sort((a, b) => a.gzip - b.gzip)
for (const r of results) {
  console.log(
    `${r.name.padEnd(20)} raw=${String(r.raw).padStart(7)}  gzip=${String(r.gzip).padStart(7)}`,
  )
}
