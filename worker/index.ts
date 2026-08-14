import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  METRICS: KVNamespace
  ASSETS: Fetcher
}

const ALLOWED_ACTIONS = new Set([
  'visit', 'capture', 'open_image', 'copy', 'download',
  'ext_visit', 'ext_capture', 'ext_open_image', 'ext_copy', 'ext_download',
])

const app = new Hono<{ Bindings: Bindings }>()

app.use(
  '/api/*',
  cors({
    origin: (origin) =>
      origin === 'https://ext.zalize.com' || origin.startsWith('chrome-extension://') ? origin : 'https://ext.zalize.com',
  }),
)

app.post('/api/track', async (c) => {
  try {
    const { action } = await c.req.json<{ action: string }>()
    if (!ALLOWED_ACTIONS.has(action)) return c.json({ ok: false }, 400)
    const day = new Date().toISOString().slice(0, 10)
    const keys = [`total:${action}`, `day:${day}:${action}`]
    c.executionCtx.waitUntil(
      (async () => {
        for (const key of keys) {
          const cur = parseInt((await c.env.METRICS.get(key)) ?? '0', 10)
          // day: keys expire after 90 days so per-day counters never accumulate forever.
          await c.env.METRICS.put(key, String(cur + 1), key.startsWith('day:') ? { expirationTtl: 60 * 60 * 24 * 90 } : undefined)
        }
      })(),
    )
    return c.json({ ok: true })
  } catch {
    return c.json({ ok: false }, 400)
  }
})

app.all('/api/track', (c) => c.json({ ok: false, error: 'method not allowed' }, 405, { Allow: 'POST' }))

app.get('/api/stats', async (c) => {
  const actions = [...ALLOWED_ACTIONS]
  const values = await Promise.all(actions.map((a) => c.env.METRICS.get(`total:${a}`)))
  const out: Record<string, number> = {}
  actions.forEach((a, i) => {
    out[a] = parseInt(values[i] ?? '0', 10)
  })
  return c.json(out)
})

app.all('/api/stats', (c) => c.json({ error: 'method not allowed' }, 405, { Allow: 'GET' }))

const INDEXNOW_KEY = 'a7c1f4e29b8d4d63a0f5e8c2d9b71a44'
app.get(`/${INDEXNOW_KEY}.txt`, (c) => c.text(INDEXNOW_KEY))

app.get('/robots.txt', (c) => c.text('User-agent: *\nAllow: /\nSitemap: https://ext.zalize.com/sitemap.xml\n'))

const SECURITY_HEADERS: Record<string, string> = {
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'content-security-policy':
    "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
}

app.get('*', async (c) => {
  const res = await c.env.ASSETS.fetch(c.req.raw)
  const headers = new Headers(res.headers)
  const { pathname } = new URL(c.req.url)
  if (pathname.startsWith('/assets/')) {
    headers.set('cache-control', 'public, max-age=31536000, immutable')
  } else {
    if (res.ok && pathname !== '/' && !pathname.endsWith('.html')) {
      // Non-hashed static files (sample.png, og.png, favicon, extension.zip) change rarely.
      headers.set('cache-control', 'public, max-age=3600, stale-while-revalidate=86400')
    }
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v)
  }
  return new Response(res.body, { status: res.status, headers })
})

export default app
