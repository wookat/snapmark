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

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ffffff', '#18181b']

const TOOLS: { id: Tool; label: string; icon: string; key: string }[] = [
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

function drawShape(ctx: CanvasRenderingContext2D, s: Shape, img: HTMLImageElement | HTMLCanvasElement) {
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
      ctx.font = `700 ${Math.round(r * 1.1)}px Inter, sans-serif`
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
        ctx.font = `600 ${size}px Inter, sans-serif`
        ctx.textBaseline = 'top'
        ctx.fillText(s.text, Math.min(x1, x2), Math.min(y1, y2))
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
      tctx.drawImage(img, bx, by, bw, bh, 0, 0, tmp.width, tmp.height)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, bx, by, bw, bh)
      ctx.imageSmoothingEnabled = true
      break
    }
    case 'crop':
      break
  }
}

export default function Editor({ initialImage, onReset }: { initialImage: HTMLImageElement; onReset: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [base, setBase] = useState<HTMLImageElement | HTMLCanvasElement>(initialImage)
  const [shapes, setShapes] = useState<Shape[]>([])
  const [redoStack, setRedoStack] = useState<Shape[]>([])
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

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, W, H)
    ctx.drawImage(base, 0, 0)
    for (const s of shapes) drawShape(ctx, s, base)
    const d = draftRef.current
    if (d) {
      if (d.type === 'crop') {
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
        drawShape(ctx, d, base)
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
    if (Math.abs(d.x2 - d.x1) < 3 && Math.abs(d.y2 - d.y1) < 3 && d.type !== 'pen' && d.type !== 'counter') return
    if (d.type === 'crop') {
      const cx = Math.round(Math.min(d.x1, d.x2))
      const cy = Math.round(Math.min(d.y1, d.y2))
      const cw = Math.round(Math.abs(d.x2 - d.x1))
      const ch = Math.round(Math.abs(d.y2 - d.y1))
      if (cw < 10 || ch < 10) return
      const flat = document.createElement('canvas')
      flat.width = W
      flat.height = H
      const fctx = flat.getContext('2d')!
      fctx.drawImage(base, 0, 0)
      for (const s of shapes) drawShape(fctx, s, base)
      const next = document.createElement('canvas')
      next.width = cw
      next.height = ch
      next.getContext('2d')!.drawImage(flat, cx, cy, cw, ch, 0, 0, cw, ch)
      setBase(next)
      setShapes([])
      setRedoStack([])
      return
    }
    setShapes((prev) => [...prev, d])
    setRedoStack([])
  }

  const undo = () => {
    setShapes((prev) => {
      if (!prev.length) return prev
      setRedoStack((r) => [...r, prev[prev.length - 1]])
      return prev.slice(0, -1)
    })
  }
  const redo = () => {
    setRedoStack((r) => {
      if (!r.length) return r
      setShapes((s) => [...s, r[r.length - 1]])
      return r.slice(0, -1)
    })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const inField = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        downloadRef.current?.()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !inField && !window.getSelection()?.toString()) {
        e.preventDefault()
        copyRef.current?.()
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
      for (const s of shapes) drawShape(ctx, s, base)
      c.toBlob((b) => resolve(b!), 'image/png')
    })

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  const downloadRef = useRef<() => void>(null)
  const copyRef = useRef<() => void>(null)

  const download = async () => {
    const blob = await exportBlob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `snapmark-${Date.now()}.png`
    a.click()
    URL.revokeObjectURL(a.href)
    track('download')
    showToast('PNG downloaded')
  }

  const copy = async () => {
    try {
      const blob = await exportBlob()
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      track('copy')
      showToast('Copied to clipboard')
    } catch {
      showToast('Clipboard blocked — use Download')
    }
  }

  downloadRef.current = download
  copyRef.current = copy

  const commitText = (value: string) => {
    if (textInput && value.trim()) {
      setShapes((prev) => [
        ...prev,
        { type: 'text', x1: textInput.x, y1: textInput.y, x2: textInput.x, y2: textInput.y, color, width: stroke, text: value.trim() },
      ])
      setRedoStack([])
    }
    setTextInput(null)
  }

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-100">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-zinc-800 bg-zinc-900/80 px-2 py-1.5 backdrop-blur sm:px-3 sm:py-2">
        <div className="flex w-full items-center gap-1 overflow-x-auto sm:w-auto">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              title={`${t.label} (${t.key})`}
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
              className={`h-5 w-5 rounded-full border-2 transition sm:h-6 sm:w-6 ${color === c ? 'scale-110 border-white' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <label className="relative ml-0.5 h-5 w-5 cursor-pointer rounded-full sm:h-6 sm:w-6" title="Custom color">
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
        <button onClick={undo} className="rounded-lg px-1.5 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 sm:px-2" title="Undo (Ctrl+Z)">↩<span className="hidden sm:inline"> Undo</span></button>
        <button onClick={redo} disabled={!redoStack.length} className="rounded-lg px-1.5 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 sm:px-2" title="Redo (Ctrl+Shift+Z)">↪</button>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button onClick={copy} className="rounded-lg bg-zinc-800 px-2.5 py-1.5 text-sm font-medium hover:bg-zinc-700 sm:px-3" title="Copy to clipboard (Ctrl+C)">Copy</button>
          <button onClick={download} className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-sm font-semibold text-white hover:bg-blue-500 sm:px-3" title="Download PNG (Ctrl+S)"><span className="hidden sm:inline">Download </span>PNG</button>
          <button onClick={onReset} className="rounded-lg px-1.5 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 sm:px-2" title="New image">✕</button>
        </div>
      </div>
      <div ref={wrapRef} className="relative flex flex-1 items-center justify-center overflow-auto bg-zinc-950 p-3">
        <div className="relative max-h-full max-w-full">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="max-h-[calc(100vh-8rem)] max-w-full touch-none rounded-lg shadow-2xl ring-1 ring-zinc-800"
            style={{ cursor: 'crosshair' }}
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
              className="absolute rounded border border-blue-500 bg-zinc-900/90 px-2 py-1 text-sm text-white outline-none"
              style={{
                left: `${(textInput.x / W) * 100}%`,
                top: `${(textInput.y / H) * 100}%`,
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
