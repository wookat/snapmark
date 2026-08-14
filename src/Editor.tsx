import { useCallback, useEffect, useRef, useState } from 'react'
import { track } from './track'

type Tool = 'arrow' | 'rect' | 'ellipse' | 'line' | 'pen' | 'highlight' | 'text' | 'counter' | 'blur' | 'crop'

interface Shape {
  type: Tool
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  width: number
  text?: string
  points?: { x: number; y: number }[]
}

type Base = HTMLImageElement | HTMLCanvasElement

type Op =
  | { kind: 'shape'; shape: Shape }
  | { kind: 'crop'; rect: { x: number; y: number; w: number; h: number }; prevShapes: Shape[] }

// Site never loads a webfont; system-ui keeps exports consistent with what the user sees.
const CANVAS_FONT = 'system-ui, sans-serif'

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ffffff', '#18181b']

export const TOOLS: { id: Tool; label: string; icon: string; key: string }[] = [
  { id: 'arrow', label: 'Arrow', icon: '↗', key: '1' },
  { id: 'rect', label: 'Box', icon: '▭', key: '2' },
  { id: 'ellipse', label: 'Ellipse', icon: '◯', key: '3' },
  { id: 'line', label: 'Line', icon: '╱', key: '4' },
  { id: 'pen', label: 'Pen', icon: '✎', key: '5' },
  { id: 'highlight', label: 'Highlight', icon: '▨', key: '6' },
  { id: 'text', label: 'Text', icon: 'T', key: '7' },
  { id: 'counter', label: 'Counter', icon: '①', key: '8' },
  { id: 'blur', label: 'Blur', icon: '▒', key: '9' },
  { id: 'crop', label: 'Crop', icon: '⤤', key: '0' },
]

function drawShape(ctx: CanvasRenderingContext2D, s: Shape) {
  ctx.strokeStyle = s.color
  ctx.fillStyle = s.color
  ctx.lineWidth = s.width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const { x1, y1, x2, y2 } = s
  switch (s.type) {
    case 'rect':
      ctx.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1))
      break
    case 'ellipse':
      ctx.beginPath()
      ctx.ellipse((x1 + x2) / 2, (y1 + y2) / 2, Math.abs(x2 - x1) / 2, Math.abs(y2 - y1) / 2, 0, 0, Math.PI * 2)
      ctx.stroke()
      break
    case 'line':
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      break
    case 'arrow': {
      const angle = Math.atan2(y2 - y1, x2 - x1)
      const head = Math.max(12, s.width * 4)
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x2, y2)
      ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 6), y2 - head * Math.sin(angle - Math.PI / 6))
      ctx.moveTo(x2, y2)
      ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 6), y2 - head * Math.sin(angle + Math.PI / 6))
      ctx.stroke()
      break
    }
    case 'pen':
      if (s.points && s.points.length > 1) {
        ctx.beginPath()
        ctx.moveTo(s.points[0].x, s.points[0].y)
        for (const p of s.points) ctx.lineTo(p.x, p.y)
        ctx.stroke()
      }
      break
    case 'highlight': {
      ctx.save()
      ctx.globalAlpha = 0.35
      ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1))
      ctx.restore()
      break
    }
    case 'counter': {
      const r = 10 + s.width * 2.5
      ctx.beginPath()
      ctx.arc(x1, y1, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = s.color === '#ffffff' ? '#18181b' : '#ffffff'
      ctx.font = `700 ${Math.round(r * 1.1)}px ${CANVAS_FONT}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(s.text ?? '1', x1, y1 + r * 0.05)
      ctx.textAlign = 'start'
      ctx.textBaseline = 'alphabetic'
      break
    }
    case 'text':
      if (s.text) {
        const size = 14 + s.width * 6
        ctx.font = `600 ${size}px ${CANVAS_FONT}`
        ctx.textBaseline = 'top'
        const tw = ctx.measureText(s.text).width
        const tx = Math.max(0, Math.min(Math.min(x1, x2), ctx.canvas.width - tw))
        const ty = Math.max(0, Math.min(Math.min(y1, y2), ctx.canvas.height - size * 1.2))
        ctx.fillText(s.text, tx, ty)
      }
      break
    case 'blur': {
      const bx = Math.min(x1, x2)
      const by = Math.min(y1, y2)
      const bw = Math.abs(x2 - x1)
      const bh = Math.abs(y2 - y1)
      if (bw < 2 || bh < 2) break
      const px = Math.max(6, Math.round(Math.min(bw, bh) / 8))
      const tmp = document.createElement('canvas')
      tmp.width = Math.max(1, Math.ceil(bw / px))
      tmp.height = Math.max(1, Math.ceil(bh / px))
      const tctx = tmp.getContext('2d')!
      tctx.imageSmoothingEnabled = true
      tctx.drawImage(ctx.canvas, bx, by, bw, bh, 0, 0, tmp.width, tmp.height)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, bx, by, bw, bh)
      ctx.imageSmoothingEnabled = true
      break
    }
    case 'crop':
      break
  }
}

export default function Editor({ initialImage, initialNotice, onReset }: { initialImage: HTMLImageElement; initialNotice?: string; onReset: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [base, setBase] = useState<HTMLImageElement | HTMLCanvasElement>(initialImage)
  const [shapes, setShapes] = useState<Shape[]>([])
  const [history, setHistory] = useState<Op[]>([])
  const [redoStack, setRedoStack] = useState<Op[]>([])
  const [tool, setTool] = useState<Tool>('arrow')
  const [color, setColor] = useState(COLORS[0])
  const [stroke, setStroke] = useState(4)
  const [draft, setDraft] = useState<Shape | null>(null)
  const [textInput, setTextInput] = useState<{ x: number; y: number } | null>(null)
  const [toast, setToast] = useState('')
  const draftRef = useRef<Shape | null>(null)
  const textMountRef = useRef(0)

  const W = base.width
  const H = base.height
  // Extreme aspect ratios (e.g. full-page screenshots) collapse to a hairline when
  // fit to the viewport; show them at a legible scale inside the scrollable area instead.
  const extremeAspect = Math.max(W / H, H / W) > 20
  const displayScale = extremeAspect ? Math.max(1, Math.ceil(40 / Math.min(W, H))) : 1

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, W, H)
    ctx.drawImage(base, 0, 0)
    for (const s of shapes) drawShape(ctx, s)
    const d = draftRef.current
    if (d) {
      if (d.type === 'blur') {
        drawShape(ctx, d)
        ctx.save()
        ctx.strokeStyle = 'rgba(59,130,246,0.9)'
        ctx.lineWidth = 1.5
        ctx.setLineDash([5, 4])
        ctx.strokeRect(Math.min(d.x1, d.x2), Math.min(d.y1, d.y2), Math.abs(d.x2 - d.x1), Math.abs(d.y2 - d.y1))
        ctx.restore()
      } else if (d.type === 'crop') {
        ctx.save()
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.fillRect(0, 0, W, H)
        ctx.clearRect(Math.min(d.x1, d.x2), Math.min(d.y1, d.y2), Math.abs(d.x2 - d.x1), Math.abs(d.y2 - d.y1))
        ctx.drawImage(
          base,
          Math.min(d.x1, d.x2), Math.min(d.y1, d.y2), Math.abs(d.x2 - d.x1), Math.abs(d.y2 - d.y1),
          Math.min(d.x1, d.x2), Math.min(d.y1, d.y2), Math.abs(d.x2 - d.x1), Math.abs(d.y2 - d.y1),
        )
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 2
        ctx.setLineDash([6, 4])
        ctx.strokeRect(Math.min(d.x1, d.x2), Math.min(d.y1, d.y2), Math.abs(d.x2 - d.x1), Math.abs(d.y2 - d.y1))
        ctx.restore()
      } else {
        drawShape(ctx, d)
      }
    }
  }, [base, shapes, W, H])

  useEffect(() => {
    redraw()
  }, [redraw, draft])

  const canvasPoint = (e: { clientX: number; clientY: number }) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (textInput) return
    const p = canvasPoint(e)
    if (tool === 'text') {
      e.preventDefault()
      setTextInput({ x: p.x, y: p.y })
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    const s: Shape = {
      type: tool,
      x1: p.x,
      y1: p.y,
      x2: p.x,
      y2: p.y,
      color,
      width: stroke,
      points: tool === 'pen' ? [p] : undefined,
      text: tool === 'counter' ? String(shapes.filter((sh) => sh.type === 'counter').length + 1) : undefined,
    }
    draftRef.current = s
    setDraft(s)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = draftRef.current
    if (!d) return
    const p = canvasPoint(e)
    d.x2 = p.x
    d.y2 = p.y
    if (d.type === 'pen') d.points!.push(p)
    setDraft({ ...d })
  }

  const onPointerUp = () => {
    const d = draftRef.current
    if (!d) return
    draftRef.current = null
    setDraft(null)
    if (Math.abs(d.x2 - d.x1) < 3 && Math.abs(d.y2 - d.y1) < 3 && d.type !== 'pen' && d.type !== 'counter' && d.type !== 'crop') return
    if (d.type === 'crop') {
      const cx = Math.round(Math.min(d.x1, d.x2))
      const cy = Math.round(Math.min(d.y1, d.y2))
      const cw = Math.round(Math.abs(d.x2 - d.x1))
      const ch = Math.round(Math.abs(d.y2 - d.y1))
      if (cw < 10 || ch < 10) {
        showToast('Selection too small to crop')
        return
      }
      const flat = document.createElement('canvas')
      flat.width = W
      flat.height = H
      const fctx = flat.getContext('2d')!
      fctx.drawImage(base, 0, 0)
      for (const s of shapes) drawShape(fctx, s)
      const next = document.createElement('canvas')
      next.width = cw
      next.height = ch
      next.getContext('2d')!.drawImage(flat, cx, cy, cw, ch, 0, 0, cw, ch)
      setHistory((h) => [...h, { kind: 'crop', rect: { x: cx, y: cy, w: cw, h: ch }, prevShapes: shapes }])
      setBase(next)
      setShapes([])
      setRedoStack([])
      return
    }
    setShapes((prev) => [...prev, d])
    setHistory((h) => [...h, { kind: 'shape', shape: d }])
    setRedoStack([])
  }

  // Crop ops store only the rect + shapes; the base for any history point is
  // reconstructed by replaying the crop chain from the original image. This keeps
  // memory O(1) in crop count (undo/redo is low-frequency, so CPU replay is fine).
  const rebuildBase = (ops: Op[]): Base => {
    let b: Base = initialImage
    for (const op of ops) {
      if (op.kind !== 'crop') continue
      const bw = b instanceof HTMLImageElement ? b.naturalWidth || b.width : b.width
      const bh = b instanceof HTMLImageElement ? b.naturalHeight || b.height : b.height
      const flat = document.createElement('canvas')
      flat.width = bw
      flat.height = bh
      const fctx = flat.getContext('2d')!
      fctx.drawImage(b, 0, 0)
      for (const s of op.prevShapes) drawShape(fctx, s)
      const next = document.createElement('canvas')
      next.width = op.rect.w
      next.height = op.rect.h
      next.getContext('2d')!.drawImage(flat, op.rect.x, op.rect.y, op.rect.w, op.rect.h, 0, 0, op.rect.w, op.rect.h)
      b = next
    }
    return b
  }

  const undo = () => {
    if (!history.length) return
    const op = history[history.length - 1]
    if (op.kind === 'shape') {
      setShapes((s) => s.slice(0, -1))
    } else {
      setBase(rebuildBase(history.slice(0, -1)))
      setShapes(op.prevShapes)
    }
    setHistory((h) => h.slice(0, -1))
    setRedoStack((r) => [...r, op])
  }
  const redo = () => {
    if (!redoStack.length) return
    const op = redoStack[redoStack.length - 1]
    if (op.kind === 'shape') {
      setShapes((s) => [...s, op.shape])
    } else {
      setBase(rebuildBase([...history, op]))
      setShapes([])
    }
    setRedoStack((r) => r.slice(0, -1))
    setHistory((h) => [...h, op])
  }

  const dirty = history.length > 0 || shapes.length > 0

  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const confirmReset = () => {
    if (dirty && !window.confirm('Discard this image and all annotations?')) return
    onReset()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const inField = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) handlersRef.current.redo()
        else handlersRef.current.undo()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handlersRef.current.download()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !inField && !window.getSelection()?.toString()) {
        e.preventDefault()
        handlersRef.current.copy()
        return
      }
      if (e.key === 'Escape' && draftRef.current) {
        draftRef.current = null
        setDraft(null)
        return
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (inField) return
      const t = TOOLS.find((tl) => tl.key === e.key)
      if (t) setTool(t.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const exportBlob = (): Promise<Blob> =>
    new Promise((resolve) => {
      const c = document.createElement('canvas')
      c.width = W
      c.height = H
      const ctx = c.getContext('2d')!
      ctx.drawImage(base, 0, 0)
      for (const s of shapes) drawShape(ctx, s)
      c.toBlob((b) => resolve(b!), 'image/png')
    })

  const showToast = (msg: string, ms = 2000) => {
    setToast(msg)
    setTimeout(() => setToast(''), ms)
  }

  useEffect(() => {
    if (initialNotice) showToast(initialNotice, 4000)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const download = async () => {
    const blob = await exportBlob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `snapmark-${new Date().toISOString().slice(0, 19).replace('T', '-').replaceAll(':', '')}.png`
    a.click()
    URL.revokeObjectURL(a.href)
    track('download')
    showToast('PNG downloaded')
  }

  const copy = async () => {
    try {
      // ClipboardItem must be constructed synchronously within the user gesture
      // (Safari rejects clipboard writes after an await); it accepts a Promise<Blob>.
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': exportBlob() })])
      track('copy')
      showToast('Copied to clipboard')
    } catch {
      showToast('Clipboard blocked — use Download')
    }
  }

  // Single latest-handlers ref for the [] keyboard effect: one assignment point,
  // so adding a shortcut can't silently capture stale state.
  const handlersRef = useRef({ undo, redo, download, copy })
  handlersRef.current = { undo, redo, download, copy }

  const commitText = (value: string) => {
    if (textInput && value.trim()) {
      const s: Shape = { type: 'text', x1: textInput.x, y1: textInput.y, x2: textInput.x, y2: textInput.y, color, width: stroke, text: value.trim() }
      setShapes((prev) => [...prev, s])
      setHistory((h) => [...h, { kind: 'shape', shape: s }])
      setRedoStack([])
    }
    setTextInput(null)
  }

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-100">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-zinc-800 bg-zinc-900/80 px-2 py-1.5 backdrop-blur sm:px-3 sm:py-2">
        <button
          onClick={confirmReset}
          title="SnapMark — start a new image"
          className="hidden items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-zinc-800 sm:flex"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white">S</span>
          <span className="hidden text-sm font-bold tracking-tight lg:inline">SnapMark</span>
        </button>
        <div className="mx-1 hidden h-6 w-px bg-zinc-700 sm:block" />
        <div className="grid w-full grid-cols-5 gap-1 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              title={`${t.label} (${t.key})`}
              aria-label={`${t.label} (${t.key})`}
              aria-pressed={tool === t.id}
              className={`flex h-9 min-w-9 items-center justify-center gap-1 rounded-lg px-2 text-sm font-medium transition ${
                tool === t.id ? 'bg-blue-600 text-white' : 'text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <span aria-hidden>{t.icon}</span>
              <span className="hidden lg:inline">{t.label}</span>
            </button>
          ))}
        </div>
        <div className="mx-1 hidden h-6 w-px bg-zinc-700 sm:block" />
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              aria-label={`color ${c}`}
              className={`h-8 w-8 rounded-full border-2 transition sm:h-6 sm:w-6 ${color === c ? 'scale-110 border-white' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <label className="relative ml-0.5 h-8 w-8 cursor-pointer rounded-full sm:h-6 sm:w-6" title="Custom color">
            <span className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(#ef4444,#eab308,#22c55e,#3b82f6,#a855f7,#ef4444)' }} aria-hidden="true" />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              aria-label="custom color"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
        </div>
        <input
          type="range"
          min={2}
          max={12}
          value={stroke}
          onChange={(e) => setStroke(Number(e.target.value))}
          className="w-14 accent-blue-500 sm:w-20"
          aria-label="stroke width"
        />
        <div className="mx-1 hidden h-6 w-px bg-zinc-700 sm:block" />
        <button onClick={undo} disabled={!history.length} aria-label="Undo (Ctrl+Z)" className="h-9 min-w-9 rounded-lg px-1.5 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 sm:px-2" title="Undo (Ctrl+Z)">↩<span className="hidden sm:inline"> Undo</span></button>
        <button onClick={redo} disabled={!redoStack.length} aria-label="Redo (Ctrl+Shift+Z)" className="h-9 min-w-9 rounded-lg px-1.5 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 sm:px-2" title="Redo (Ctrl+Shift+Z)">↪</button>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button onClick={copy} className="rounded-lg bg-zinc-800 px-2.5 py-1.5 text-sm font-medium hover:bg-zinc-700 sm:px-3" title="Copy to clipboard (Ctrl+C)">Copy</button>
          <button onClick={download} className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-sm font-semibold text-white hover:bg-blue-500 sm:px-3" title="Download PNG (Ctrl+S)"><span className="hidden sm:inline">Download </span>PNG</button>
          <button onClick={confirmReset} aria-label="New image" className="h-9 min-w-9 rounded-lg px-1.5 text-sm text-zinc-400 hover:bg-zinc-800 sm:px-2" title="New image">＋<span className="hidden sm:inline"> New</span></button>
        </div>
      </div>
      <div ref={wrapRef} className="relative flex flex-1 items-center justify-center overflow-auto bg-zinc-950 p-3">
        <div className={extremeAspect ? 'relative' : 'relative max-h-full max-w-full'}>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className={`touch-none rounded-lg shadow-2xl ring-1 ring-zinc-800 ${extremeAspect ? '' : 'max-h-[calc(100vh-8rem)] max-w-full'}`}
            style={{ cursor: 'crosshair', ...(extremeAspect ? { width: W * displayScale, height: H * displayScale, maxWidth: 'none', imageRendering: displayScale > 1 ? ('pixelated' as const) : undefined } : {}) }}
          />
          {textInput && (
            <input
              ref={(el) => {
                if (el) {
                  textMountRef.current = Date.now()
                  requestAnimationFrame(() => el.focus())
                }
              }}
              placeholder="Type, then Enter"
              className="absolute rounded border border-blue-500 bg-zinc-900/90 px-2 py-1 font-semibold text-white outline-none"
              style={{
                left: `${Math.min((textInput.x / W) * 100, 70)}%`,
                top: `${Math.min((textInput.y / H) * 100, 92)}%`,
                maxWidth: `${100 - Math.min((textInput.x / W) * 100, 70)}%`,
                // Sub-16px inputs trigger iOS Safari auto-zoom on focus; committed text is still drawn at canvas scale.
                fontSize: `${Math.max(16, (14 + stroke * 6) * ((canvasRef.current?.getBoundingClientRect().width ?? W) / W))}px`,
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitText((e.target as HTMLInputElement).value)
                if (e.key === 'Escape') setTextInput(null)
              }}
              onBlur={(e) => {
                if (Date.now() - textMountRef.current < 200) {
                  e.target.focus()
                  return
                }
                commitText(e.target.value)
              }}
            />
          )}
        </div>
        {toast && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-zinc-800 px-4 py-2 text-sm text-white shadow-lg ring-1 ring-zinc-700">
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}
