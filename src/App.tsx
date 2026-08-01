import { useCallback, useEffect, useState } from 'react'
import Editor from './Editor'
import { track } from './track'

declare const chrome: {
  storage?: { local: { get: (k: string[], cb: (r: Record<string, string>) => void) => void; remove: (k: string[]) => void } }
} | undefined

const isExtension = typeof chrome !== 'undefined' && !!chrome?.storage && location.protocol === 'chrome-extension:'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

const FEATURES = [
  { title: '100% private', desc: 'Your screenshots never leave your device. No uploads, no servers, no public galleries — everything is processed locally in your browser.' },
  { title: 'Annotate in seconds', desc: 'Arrows, boxes, ellipses, lines, freehand pen, text and pixelate/blur for hiding sensitive info. Undo/redo included.' },
  { title: 'Capture, paste or drop', desc: 'Capture your screen directly (on desktop), paste from clipboard with Ctrl+V, or drag & drop / upload any image.' },
  { title: 'Free & no account', desc: 'No sign-up, no watermark, no limits. Works on desktop and mobile.' },
]

export default function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    track('visit')
    if (isExtension && chrome?.storage) {
      chrome.storage.local.get(['pendingCapture'], (r) => {
        if (r.pendingCapture) {
          loadImage(r.pendingCapture).then(setImage)
          chrome.storage!.local.remove(['pendingCapture'])
        }
      })
    }
  }, [])

  const handleFile = useCallback((file: File | null) => {
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    loadImage(url).then((img) => {
      setImage(img)
      track('open_image')
      URL.revokeObjectURL(url)
    })
  }, [])

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith('image/'))
      if (item) handleFile(item.getAsFile())
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [handleFile])

  const captureScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      const video = document.createElement('video')
      video.srcObject = stream
      await video.play()
      await new Promise((r) => setTimeout(r, 300))
      const c = document.createElement('canvas')
      c.width = video.videoWidth
      c.height = video.videoHeight
      c.getContext('2d')!.drawImage(video, 0, 0)
      stream.getTracks().forEach((t) => t.stop())
      const img = await loadImage(c.toDataURL('image/png'))
      setImage(img)
      track('capture')
    } catch {
      /* user cancelled */
    }
  }

  if (image) {
    return <Editor initialImage={image} onReset={() => setImage(null)} />
  }

  return (
    <div
      className="min-h-full"
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        handleFile(e.dataTransfer.files[0] ?? null)
      }}
    >
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">S</div>
          <span className="text-lg font-semibold tracking-tight">SnapMark</span>
        </div>
        <nav className="flex items-center gap-4 text-sm text-zinc-400">
          <a href="#extension" className="hover:text-white">Chrome extension</a>
          <a href="https://github.com/wookat/snapmark" target="_blank" rel="noreferrer" className="hover:text-white">GitHub</a>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16">
        <section className="py-10 text-center sm:py-16">
          <p className="mb-4 inline-block rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
            A maintained alternative to the Lightshot extension
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Screenshot &amp; annotate.
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Nothing leaves your device.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-zinc-400 sm:text-lg">
            Capture or paste a screenshot, add arrows, boxes, text and blur, then copy or download — entirely in your browser.
            No uploads, no account, no broken buttons.
          </p>

          <div
            className={`mx-auto mt-10 max-w-xl rounded-2xl border-2 border-dashed p-8 transition ${
              dragOver ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-700 bg-zinc-900/50'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={captureScreen}
                className="w-full rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 sm:w-auto"
              >
                📸 Capture screen
              </button>
              <label className="w-full cursor-pointer rounded-xl bg-zinc-800 px-6 py-3.5 text-base font-medium text-zinc-200 transition hover:bg-zinc-700 sm:w-auto">
                Upload image
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
              </label>
              <p className="text-sm text-zinc-500">…or paste with Ctrl+V, or drag &amp; drop an image here</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h3 className="mb-2 font-semibold text-white">{f.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-400">{f.desc}</p>
            </div>
          ))}
        </section>

        <section id="lightshot" className="mt-14 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8">
          <h2 className="text-2xl font-bold">Why an alternative to Lightshot?</h2>
          <p className="mt-3 text-zinc-400">
            The popular Lightshot screenshot extension (2,000,000+ users) hasn't been updated since July 2024, and recent
            reviews report blank screenshots and broken captures. Lightshot also uploads screenshots to prnt.sc servers,
            where they have repeatedly been found publicly discoverable.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-700 text-zinc-400">
                  <th className="py-2 pr-4 font-medium">&nbsp;</th>
                  <th className="py-2 pr-4 font-medium text-white">SnapMark</th>
                  <th className="py-2 font-medium">Lightshot</th>
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                {[
                  ['Actively maintained', '✅ Yes', '⚠️ Last update Jul 2024'],
                  ['Screenshots stay local', '✅ Never uploaded', '❌ Uploaded to prnt.sc'],
                  ['Works without account', '✅', '✅'],
                  ['Blur / hide sensitive info', '✅ Pixelate tool', '❌'],
                  ['Web version (no install)', '✅ ext.zalize.com', '❌'],
                  ['Manifest V3', '✅', '❌ MV2 (deprecated)'],
                ].map(([k, a, b]) => (
                  <tr key={k} className="border-b border-zinc-800/60">
                    <td className="py-2.5 pr-4 text-zinc-400">{k}</td>
                    <td className="py-2.5 pr-4">{a}</td>
                    <td className="py-2.5">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="extension" className="mt-14 rounded-2xl border border-zinc-800 bg-gradient-to-br from-blue-950/40 to-purple-950/30 p-6 sm:p-8">
          <h2 className="text-2xl font-bold">Chrome extension</h2>
          <p className="mt-3 text-zinc-400">
            Prefer one-click capture of the current tab? The open-source SnapMark extension (Manifest V3) captures the visible
            tab and opens it in this same editor — still 100% local.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="https://github.com/wookat/snapmark/releases"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200"
            >
              Download extension (.zip)
            </a>
            <a
              href="https://github.com/wookat/snapmark#install-the-extension"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-zinc-600 px-5 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
            >
              Install instructions
            </a>
          </div>
          <p className="mt-3 text-xs text-zinc-500">Chrome Web Store listing pending. Meanwhile: download the zip → chrome://extensions → enable Developer mode → “Load unpacked”.</p>
        </section>
      </main>

      <footer className="border-t border-zinc-800 py-8">
        <div className="mx-auto max-w-5xl px-4 text-xs leading-relaxed text-zinc-500">
          <p>
            SnapMark is an independent open-source tool and is not affiliated with, endorsed by, or connected to Lightshot,
            Skillbrains, or prnt.sc. “Lightshot” is referenced solely for comparison purposes. All image processing happens
            locally in your browser; we do not receive, store, or transmit your images. Anonymous usage counters (page visits
            and button clicks, no personal data, no cookies) are collected to improve the product.
          </p>
          <p className="mt-3">© {new Date().getFullYear()} SnapMark · zalize.com · <a className="underline hover:text-zinc-300" href="https://github.com/wookat/snapmark" target="_blank" rel="noreferrer">Source code</a></p>
        </div>
      </footer>
    </div>
  )
}
