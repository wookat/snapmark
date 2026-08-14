import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// CSS is ~8KB gzipped; inlining it removes the render-blocking stylesheet request
// (HTML is served max-age=0, so there is no cacheability downside).
function inlineCss(): Plugin {
  return {
    name: 'inline-css',
    enforce: 'post',
    generateBundle(_, bundle) {
      const cssAssets = Object.keys(bundle).filter((k) => k.endsWith('.css'))
      const html = bundle['index.html']
      if (!html || html.type !== 'asset' || typeof html.source !== 'string') return
      for (const key of cssAssets) {
        const css = bundle[key]
        if (css.type !== 'asset' || typeof css.source !== 'string') continue
        const link = new RegExp(`<link[^>]*href="[^"]*${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`)
        if (!link.test(html.source)) continue
        html.source = html.source.replace(link, `<style>${css.source}</style>`)
        delete bundle[key]
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), inlineCss()],
  base: './',
})
