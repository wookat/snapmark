// Post-build: prerender the landing page into dist/index.html (React hydrates on load)
// and emit dist/sitemap.xml with the build date as <lastmod>.
import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'vite'

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
const { render } = await vite.ssrLoadModule('/src/entry-prerender.tsx')
const html = render()
await vite.close()

const indexFile = new URL('../dist/index.html', import.meta.url)
const marker = '<div id="root"></div>'
const built = readFileSync(indexFile, 'utf8')
if (!built.includes(marker)) throw new Error('prerender: root marker not found in dist/index.html')
writeFileSync(indexFile, built.replace(marker, `<div id="root">${html}</div>`))

const lastmod = new Date().toISOString().slice(0, 10)
writeFileSync(
  new URL('../dist/sitemap.xml', import.meta.url),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://ext.zalize.com/</loc><lastmod>${lastmod}</lastmod></url>\n</urlset>\n`,
)
console.log(`prerendered ${html.length} chars into dist/index.html; sitemap lastmod=${lastmod}`)
