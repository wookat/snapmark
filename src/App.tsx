import { useCallback, useEffect, useState } from 'react'
import Editor, { TOOLS } from './Editor'
import { track } from './track'

declare const chrome: {
  storage?: { local: { get: (k: string[], cb: (r: Record<string, string>) => void) => void; remove: (k: string[]) => void } }
} | undefined

const isExtension = typeof chrome !== 'undefined' && !!chrome?.storage && location.protocol === 'chrome-extension:'

const canCaptureScreen = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getDisplayMedia

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Mobile Safari caps canvases at ~16.7MP; stay below it and keep exports snappy.
const MAX_PIXELS = 16_000_000
// SVGs without explicit dimensions rasterize tiny; upscale small ones for a usable canvas.
const MIN_SVG_EDGE = 1024
// Small raster images (icons) get integer nearest-neighbor upscaling so they are annotatable.
const MIN_RASTER_EDGE = 256

async function normalizeImage(img: HTMLImageElement, isSvg: boolean): Promise<{ img: HTMLImageElement; note?: string }> {
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height
  let scale = 1
  let pixelated = false
  let note: string | undefined
  if (isSvg && Math.max(w, h) < MIN_SVG_EDGE) {
    scale = MIN_SVG_EDGE / Math.max(w, h)
    note = `SVG rasterized at ${Math.round(w * scale)}×${Math.round(h * scale)}`
  } else if (!isSvg && Math.max(w, h) < MIN_RASTER_EDGE) {
    scale = Math.ceil(MIN_RASTER_EDGE / Math.max(w, h))
    pixelated = true
    note = `Small image upscaled ×${scale} to ${w * scale}×${h * scale}`
  } else if (w * h > MAX_PIXELS) {
    scale = Math.sqrt(MAX_PIXELS / (w * h))
    note = `Large image scaled to ${Math.round(w * scale)}×${Math.round(h * scale)} for compatibility`
  }
  if (scale === 1) return { img }
  const c = document.createElement('canvas')
  c.width = Math.round(w * scale)
  c.height = Math.round(h * scale)
  const ctx = c.getContext('2d')!
  if (pixelated) ctx.imageSmoothingEnabled = false
  else ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, c.width, c.height)
  return { img: await loadImage(c.toDataURL('image/png')), note }
}

function Icon({ d, className = 'h-5 w-5' }: { d: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

const IC = {
  camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  pen: 'M12 19l7-7 3 3-7 7-3-3z M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z',
  zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  eyeOff: 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94 M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19 M14.12 14.12a3 3 0 1 1-4.24-4.24 M1 1l22 22',
  smartphone: 'M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z M12 18h.01',
  clipboard: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2 M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  undo: 'M3 7v6h6 M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13',
  crop: 'M6.13 1L6 16a2 2 0 0 0 2 2h15 M1 6.13L16 6a2 2 0 0 1 2 2v15',
  type: 'M4 7V4h16v3 M9 20h6 M12 4v16',
  check: 'M20 6L9 17l-5-5',
  x: 'M18 6L6 18 M6 6l12 12',
  warn: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01',
  puzzle: 'M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073a1.026 1.026 0 0 1 .303-.917l1.525-1.525A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02z',
}

const SMALL_FEATURES = [
  { icon: IC.pen, title: 'Full annotation kit', desc: 'Arrows, boxes, ellipses, lines, pen, highlighter, text, step counters and blur.' },
  { icon: IC.eyeOff, title: 'Pixelate sensitive info', desc: 'Hide emails, tokens and faces before sharing anything.' },
  { icon: IC.crop, title: 'Crop', desc: 'Trim your capture to exactly what matters.' },
  { icon: IC.undo, title: 'Undo / redo', desc: 'Full history — experiment without fear.' },
  { icon: IC.clipboard, title: 'Copy to clipboard', desc: 'One click and it is ready to paste anywhere.' },
  { icon: IC.download, title: 'Download as PNG', desc: 'Crisp, full-resolution export. No watermark.' },
  { icon: IC.smartphone, title: 'Works on mobile', desc: 'Upload and annotate from your phone too.' },
  { icon: IC.zap, title: 'Instant, no install', desc: 'The web app loads in under a second. No sign-up.' },
]

const FAQS = [
  { q: 'Is SnapMark really free?', a: 'Yes. No account, no watermark, no limits, no “Pro” upsell. The web app and the Chrome extension are free and open source.' },
  { q: 'Where are my screenshots stored?', a: 'Only on your device. All processing happens in your browser with the Canvas API — images are never uploaded to any server.' },
  { q: 'How is this different from Lightshot?', a: 'Lightshot uploads every screenshot to prnt.sc where links have repeatedly been found publicly discoverable, and its extension (still Manifest V2) has not been updated since July 2024. SnapMark keeps everything local, is actively maintained, and adds blur/pixelate for sensitive info.' },
  { q: 'Do I need to install anything?', a: 'No. The web app works instantly in any modern browser, on desktop and mobile. The optional Chrome extension adds one-click capture of the current tab.' },
  { q: 'Can I capture a specific area?', a: 'Capture your screen, then use the Crop tool to trim to the exact area — or blur everything you don’t want to show.' },
]

function EditorMockup() {
  return (
    <div className="select-none overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-blue-900/10" aria-hidden="true">
      <div className="flex items-center gap-1.5 border-b border-zinc-100 bg-zinc-50 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-amber-400" />
        <span className="h-3 w-3 rounded-full bg-green-400" />
        <span className="ml-3 hidden rounded-md bg-white px-3 py-0.5 text-[11px] text-zinc-500 ring-1 ring-zinc-200 sm:block">ext.zalize.com</span>
      </div>
      <div className="flex flex-wrap items-center gap-1 border-b border-zinc-100 bg-white px-3 py-2">
        {TOOLS.map((t, i) => (
          <span key={t.id} className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs ${i === 0 ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}>{t.icon}</span>
        ))}
        <span className="mx-1 h-5 w-px bg-zinc-200" />
        {['#ef4444', '#f97316', '#22c55e', '#3b82f6'].map((c, i) => (
          <span key={c} className={`h-4 w-4 rounded-full ${i === 0 ? 'ring-2 ring-zinc-300 ring-offset-1' : ''}`} style={{ backgroundColor: c }} />
        ))}
        <span className="ml-auto hidden rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white sm:block">Download PNG</span>
      </div>
      <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 p-5 sm:p-7">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70">
          <div className="mb-3 h-3 w-2/5 rounded bg-zinc-200" />
          <div className="mb-2 h-2 w-full rounded bg-zinc-100" />
          <div className="mb-2 h-2 w-11/12 rounded bg-zinc-100" />
          <div className="relative mb-2 h-2 w-3/5 rounded bg-zinc-100">
            <span className="absolute -inset-x-2 -inset-y-1.5 rounded-md border-2 border-red-500" />
          </div>
          <div className="mb-2 h-2 w-4/5 rounded bg-zinc-100" />
          <div className="flex gap-2 pt-1">
            <span className="h-6 w-20 rounded-md bg-blue-600/90" />
            <span className="h-6 w-16 rounded-md bg-zinc-100" />
          </div>
        </div>
        <svg className="absolute right-8 top-8 h-16 w-16 text-red-500 sm:right-12" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <path d="M56 8 C40 20 28 34 14 50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M14 50 L16 38 M14 50 L26 47" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <span className="absolute bottom-8 right-8 rounded-md bg-red-700 px-2 py-1 text-xs font-bold text-white shadow sm:right-12">Fix this!</span>
        <span className="absolute bottom-8 left-8 h-8 w-24 rounded-md bg-zinc-400/60 backdrop-blur-sm sm:left-12" style={{ filter: 'blur(0.5px)', backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,.35) 0 4px, transparent 4px 8px)' }} />
      </div>
    </div>
  )
}

function CompareCell({ v }: { v: string }) {
  if (v.startsWith('yes:')) return <span className="inline-flex items-center gap-1.5 text-emerald-700"><Icon d={IC.check} className="h-4 w-4 shrink-0" />{v.slice(4)}</span>
  if (v.startsWith('no:')) return <span className="inline-flex items-center gap-1.5 text-zinc-500"><Icon d={IC.x} className="h-4 w-4 shrink-0" />{v.slice(3)}</span>
  if (v.startsWith('warn:')) return <span className="inline-flex items-center gap-1.5 text-amber-600"><Icon d={IC.warn} className="h-4 w-4 shrink-0" />{v.slice(5)}</span>
  return <span>{v}</span>
}

export default function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [notice, setNotice] = useState('')
  const [editorNotice, setEditorNotice] = useState<string | undefined>(undefined)

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
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setNotice('Only image files are supported (PNG, JPEG, WebP, GIF, SVG…)')
      return
    }
    setNotice('')
    const url = URL.createObjectURL(file)
    loadImage(url)
      .then((img) => normalizeImage(img, file.type === 'image/svg+xml'))
      .then(({ img, note }) => {
        setEditorNotice(file.type === 'image/gif' ? 'Animated GIF — only the first frame is editable' : note)
        setImage(img)
        track('open_image')
      })
      .catch(() => setNotice('Could not load that file — it may be corrupted or unsupported.'))
      .finally(() => URL.revokeObjectURL(url))
  }, [])

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith('image/'))
      if (item) handleFile(item.getAsFile())
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [handleFile])

  const openSample = async () => {
    try {
      const img = await loadImage('/sample.png')
      setImage(img)
      track('open_image')
    } catch {
      /* asset missing */
    }
  }

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
    return (
      <Editor
        initialImage={image}
        initialNotice={editorNotice}
        onReset={() => {
          setImage(null)
          setEditorNotice(undefined)
        }}
      />
    )
  }

  return (
    <div
      className="min-h-full bg-white text-zinc-900"
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
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white shadow-sm shadow-blue-600/30">S</span>
            <span className="text-[17px] font-bold tracking-tight">SnapMark</span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-500 md:flex" aria-label="Main">
            <a href="#features" className="transition hover:text-zinc-900">Features</a>
            <a href="#compare" className="transition hover:text-zinc-900">Compare</a>
            <a href="#faq" className="transition hover:text-zinc-900">FAQ</a>
            <a href="https://github.com/wookat/snapmark" target="_blank" rel="noreferrer" className="transition hover:text-zinc-900">GitHub</a>
          </nav>
          <a
            href="#extension"
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-blue-600/30 transition hover:bg-blue-500"
          >
            Get the extension
          </a>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:pb-24 lg:pt-20">
          <div className="text-center lg:text-left">
            <p className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700">
              <Icon d={IC.shield} className="h-3.5 w-3.5" />
              The maintained, private Lightshot alternative
            </p>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Screenshot &amp; annotate
              <br />
              <span className="text-blue-600">like a pro.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-zinc-500 lg:mx-0">
              Capture, paste or drop a screenshot, mark it up with arrows, text and blur, then copy or download.
              100% free, no account — and nothing ever leaves your device.
            </p>
            <div
              className={`mt-8 rounded-2xl border-2 border-dashed p-5 transition sm:p-6 ${
                dragOver ? 'border-blue-500 bg-blue-50' : 'border-zinc-200 bg-zinc-50/60'
              }`}
            >
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                {canCaptureScreen && (
                  <button
                    onClick={captureScreen}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-7 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 sm:w-auto"
                  >
                    <Icon d={IC.camera} className="h-5 w-5" />
                    Capture screen
                  </button>
                )}
                <label
                  className={
                    canCaptureScreen
                      ? 'inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-7 py-3.5 text-[15px] font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 sm:w-auto'
                      : 'inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-blue-600 px-7 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 sm:w-auto'
                  }
                >
                  <Icon d={IC.upload} className="h-5 w-5" />
                  Upload image
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
              {notice && (
                <p role="alert" className="mt-3 text-center text-sm font-medium text-amber-700 lg:text-left">
                  {notice}
                </p>
              )}
              <p className="mt-3 text-center text-sm text-zinc-500 lg:text-left">
                …or <span className="pointer-coarse:hidden">paste with <kbd className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-xs font-semibold text-zinc-500">Ctrl</kbd>+<kbd className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-xs font-semibold text-zinc-500">V</kbd>, </span>drag &amp; drop anywhere, or{' '}
                <button onClick={openSample} className="font-semibold text-blue-600 underline decoration-blue-300 underline-offset-2 transition hover:text-blue-500">try a sample image</button>
              </p>
            </div>
            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-medium text-zinc-500 lg:justify-start">
              {['Free forever', 'No account', 'No uploads', 'No watermark'].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5"><Icon d={IC.check} className="h-4 w-4 text-emerald-500" />{t}</li>
              ))}
            </ul>
          </div>
          <EditorMockup />
        </section>

        {/* Stats band */}
        <section className="border-y border-zinc-100 bg-zinc-50/70">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 text-center sm:grid-cols-4 sm:px-6">
            {[
              ['10 tools', 'annotation toolkit'],
              ['0 uploads', 'everything stays local'],
              ['$0', 'free, no account'],
              ['MV3', 'modern Chrome extension'],
            ].map(([big, small]) => (
              <div key={big}>
                <p className="text-2xl font-bold tracking-tight text-blue-600 sm:text-3xl">{big}</p>
                <p className="mt-1 text-sm text-zinc-500">{small}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Alternating features */}
        <section id="features" className="mx-auto max-w-6xl space-y-20 px-4 py-20 sm:px-6 lg:space-y-28 lg:py-28">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-wider text-blue-600">Annotate</p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Make your point in seconds</h2>
              <p className="mt-4 text-lg leading-relaxed text-zinc-500">
                Arrows, boxes, ellipses, lines, freehand pen and text — everything you need to highlight what matters.
                Full undo/redo history means you can experiment freely.
              </p>
              <ul className="mt-6 space-y-3 text-[15px] text-zinc-600">
                {['10 annotation tools with custom colors and stroke width', 'Numbered step counters and highlighter for tutorials', 'Keyboard shortcuts: 1–0 to switch tools, Ctrl+Z / Ctrl+Shift+Z'].map((t) => (
                  <li key={t} className="flex items-start gap-2.5"><Icon d={IC.check} className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />{t}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 sm:p-10">
              <div className="mx-auto flex max-w-sm flex-wrap items-center justify-center gap-2 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-zinc-200/60">
                {TOOLS.map((t, idx) => (
                  <span key={t.id} className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-lg ${idx === 0 ? 'bg-blue-600 text-white' : 'bg-zinc-50 text-zinc-600'}`}>
                    {t.icon}
                    <span className="text-[10px] font-medium">{t.label}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="order-last lg:order-first">
              <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 sm:p-10">
                <div className="mx-auto max-w-sm rounded-2xl bg-white p-6 shadow-lg ring-1 ring-zinc-200/60">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Icon d={IC.shield} className="h-6 w-6" /></span>
                    <div>
                      <p className="font-bold">Local-only processing</p>
                      <p className="text-sm text-zinc-500">Canvas API, in your browser</p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-2.5 text-sm">
                    {[['Your device', 'yes'], ['Our servers', 'no'], ['Public galleries', 'no'], ['Third parties', 'no']].map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
                        <span className="text-zinc-600">{k}</span>
                        {v === 'yes'
                          ? <span className="inline-flex items-center gap-1 font-semibold text-emerald-700"><Icon d={IC.check} className="h-4 w-4" />Stored</span>
                          : <span className="inline-flex items-center gap-1 font-semibold text-zinc-500"><Icon d={IC.x} className="h-4 w-4" />Never</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-wider text-blue-600">Privacy</p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Nothing ever leaves your device</h2>
              <p className="mt-4 text-lg leading-relaxed text-zinc-500">
                Lightshot uploads every capture to prnt.sc — where screenshots have repeatedly been found publicly
                discoverable. SnapMark processes everything locally in your browser. There is no server that could
                leak your images, because your images never reach one.
              </p>
              <ul className="mt-6 space-y-3 text-[15px] text-zinc-600">
                {['Pixelate/blur tool for emails, tokens and faces', 'No cookies, no tracking pixels, no personal data', 'Open source — verify it yourself on GitHub'].map((t) => (
                  <li key={t} className="flex items-start gap-2.5"><Icon d={IC.check} className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />{t}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-wider text-blue-600">Capture anywhere</p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Capture, paste or drop</h2>
              <p className="mt-4 text-lg leading-relaxed text-zinc-500">
                Grab your screen directly on desktop, paste from the clipboard with Ctrl+V, or drag &amp; drop any
                image — on any device, including your phone. No install required.
              </p>
              <ul className="mt-6 space-y-3 text-[15px] text-zinc-600">
                {['Native screen capture via your browser', 'Instant clipboard paste support', 'Fully responsive — works great on mobile'].map((t) => (
                  <li key={t} className="flex items-start gap-2.5"><Icon d={IC.check} className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />{t}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 sm:p-10">
              <div className="mx-auto grid max-w-sm gap-3">
                {[
                  [IC.camera, 'Capture screen', 'Pick a screen, window or tab'],
                  [IC.clipboard, 'Paste with Ctrl+V', 'Straight from your clipboard'],
                  [IC.upload, 'Drop or upload', 'Any image file, any device'],
                ].map(([icon, title, sub]) => (
                  <div key={title} className="flex items-center gap-3.5 rounded-2xl bg-white p-4 shadow-md ring-1 ring-zinc-200/60">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Icon d={icon} className="h-5 w-5" /></span>
                    <div>
                      <p className="font-semibold">{title}</p>
                      <p className="text-sm text-zinc-500">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Small features grid */}
        <section className="border-y border-zinc-100 bg-zinc-50/70 py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Everything you need. Nothing you don’t.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-zinc-500">A focused toolkit that covers the whole screenshot workflow.</p>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {SMALL_FEATURES.map((f) => (
                <div key={f.title} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md">
                  <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon d={f.icon} className="h-5 w-5" /></span>
                  <h3 className="font-bold">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section id="compare" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Why switch from Lightshot?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-zinc-500">
            The Lightshot extension (2,000,000+ users) hasn’t been updated since July 2024, still runs deprecated
            Manifest V2, and uploads your screenshots to prnt.sc.
          </p>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-zinc-200 shadow-sm">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
                  <th className="px-5 py-3.5 font-semibold"><span className="sr-only">Feature</span></th>
                  <th className="px-5 py-3.5 font-bold text-blue-600">SnapMark</th>
                  <th className="px-5 py-3.5 font-semibold">Lightshot</th>
                </tr>
              </thead>
              <tbody className="text-zinc-700">
                {[
                  ['Actively maintained', 'yes:Yes', 'warn:Last update Jul 2024'],
                  ['Screenshots stay local', 'yes:Never uploaded', 'no:Uploaded to prnt.sc'],
                  ['Blur / hide sensitive info', 'yes:Pixelate tool', 'no:Not available'],
                  ['Web version (no install)', 'yes:ext.zalize.com', 'no:Extension only'],
                  ['Works on mobile', 'yes:Yes', 'no:No'],
                  ['Manifest V3', 'yes:Yes', 'no:MV2 (deprecated)'],
                  ['Free, no account', 'yes:Yes', 'yes:Yes'],
                ].map(([k, a, b]) => (
                  <tr key={k} className="border-b border-zinc-100 last:border-0">
                    <td className="px-5 py-3.5 font-medium text-zinc-500">{k}</td>
                    <td className="px-5 py-3.5 font-medium"><CompareCell v={a} /></td>
                    <td className="px-5 py-3.5"><CompareCell v={b} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Extension */}
        <section id="extension" className="border-y border-zinc-100 bg-zinc-50/70 py-20 lg:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="mb-3 inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-blue-600"><Icon d={IC.puzzle} className="h-4 w-4" />Chrome extension</p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">One-click capture of any tab</h2>
              <p className="mt-4 text-lg leading-relaxed text-zinc-500">
                The open-source SnapMark extension (Manifest V3) captures the visible tab and opens it in this same
                editor — still 100% local, still zero uploads.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href="https://github.com/wookat/snapmark/releases/latest/download/snapmark-extension.zip"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-7 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
                >
                  <Icon d={IC.download} className="h-5 w-5" />
                  Download extension (.zip)
                </a>
                <a
                  href="https://github.com/wookat/snapmark#install-the-extension"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-7 py-3.5 text-[15px] font-semibold text-zinc-700 transition hover:border-zinc-400"
                >
                  Install instructions
                </a>
              </div>
              <p className="mt-4 text-sm text-zinc-500">Chrome Web Store listing pending. Meanwhile: unzip → chrome://extensions → Developer mode → “Load unpacked”.</p>
            </div>
            <ol className="space-y-4">
              {[
                ['Download & unzip', 'One click above — snapmark-extension.zip downloads directly'],
                ['Load in Chrome', 'chrome://extensions → Developer mode → Load unpacked'],
                ['Capture any page', 'Click the toolbar icon — the tab opens in the editor instantly'],
              ].map(([title, sub], i) => (
                <li key={title} className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{i + 1}</span>
                  <div>
                    <p className="font-bold">{title}</p>
                    <p className="mt-0.5 text-sm text-zinc-500">{sub}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:py-28">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Frequently asked questions</h2>
          <div className="mt-10 divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white shadow-sm">
            {FAQS.map((f) => (
              <details key={f.q} className="group px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-zinc-900 [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="text-zinc-500 transition group-open:rotate-45"><Icon d="M12 5v14 M5 12h14" className="h-5 w-5" /></span>
                </summary>
                <p className="mt-3 text-[15px] leading-relaxed text-zinc-500">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA band */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:pb-28">
          <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-14 text-center shadow-xl shadow-blue-600/20 sm:px-12 lg:py-20">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Take your screenshots to the next level</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">Free, private and instant. Your first annotated screenshot is 10 seconds away.</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {canCaptureScreen ? (
                <button
                  onClick={captureScreen}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-[15px] font-bold text-blue-700 shadow-lg transition hover:bg-blue-50 sm:w-auto"
                >
                  <Icon d={IC.camera} className="h-5 w-5" />
                  Capture screen — it’s free
                </button>
              ) : (
                <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-[15px] font-bold text-blue-700 shadow-lg transition hover:bg-blue-50 sm:w-auto">
                  <Icon d={IC.upload} className="h-5 w-5" />
                  Upload an image — it’s free
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
                </label>
              )}
              <a
                href="https://github.com/wookat/snapmark/releases"
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-full border border-white/40 px-8 py-3.5 text-[15px] font-semibold text-white transition hover:bg-white/10 sm:w-auto"
              >
                Get the extension
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 bg-zinc-50/70">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">S</span>
                <span className="text-[17px] font-bold tracking-tight">SnapMark</span>
              </div>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-500">Free, private screenshot annotation — entirely in your browser.</p>
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">Product</p>
              <ul className="mt-2 space-y-0.5 text-sm text-zinc-500">
                <li><a href="#features" className="inline-block py-1.5 hover:text-zinc-900">Features</a></li>
                <li><a href="#compare" className="inline-block py-1.5 hover:text-zinc-900">Compare vs Lightshot</a></li>
                <li><a href="#extension" className="inline-block py-1.5 hover:text-zinc-900">Chrome extension</a></li>
                <li><a href="#faq" className="inline-block py-1.5 hover:text-zinc-900">FAQ</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">Open source</p>
              <ul className="mt-2 space-y-0.5 text-sm text-zinc-500">
                <li><a href="https://github.com/wookat/snapmark" target="_blank" rel="noreferrer" className="inline-block py-1.5 hover:text-zinc-900">Source code</a></li>
                <li><a href="https://github.com/wookat/snapmark/releases" target="_blank" rel="noreferrer" className="inline-block py-1.5 hover:text-zinc-900">Releases</a></li>
                <li><a href="https://github.com/wookat/snapmark/issues" target="_blank" rel="noreferrer" className="inline-block py-1.5 hover:text-zinc-900">Report an issue</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">Privacy</p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                All image processing happens locally. We collect anonymous usage counters only — no personal data, no
                cookies, no images.
              </p>
            </div>
          </div>
          <div className="mt-10 border-t border-zinc-200 pt-6 text-xs leading-relaxed text-zinc-500">
            <p>
              SnapMark is an independent open-source tool and is not affiliated with, endorsed by, or connected to
              Lightshot, Skillbrains, or prnt.sc. “Lightshot” is referenced solely for comparison purposes.
            </p>
            <p className="mt-2">
              <span className="font-semibold text-zinc-500">More from ZALIZE:</span>{' '}
              <a href="https://qr.zalize.com" className="hover:text-zinc-600">HonestQR</a>
              {' · '}
              <a href="https://prompter.zalize.com" className="hover:text-zinc-600">PromptCue</a>
              {' · '}
              <a href="https://pdf.zalize.com" className="hover:text-zinc-600">PDF Suite</a>
              {' · '}
              <a href="https://scribe.zalize.com" className="hover:text-zinc-600">ScribeFlow</a>
            </p>
            <p className="mt-2">© {new Date().getFullYear()} SnapMark · zalize.com</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
