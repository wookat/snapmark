export function loadImage(src: string): Promise<HTMLImageElement> {
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

export async function normalizeImage(img: HTMLImageElement, isSvg: boolean): Promise<{ img: HTMLImageElement; note?: string }> {
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
