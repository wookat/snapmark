import { useCallback, useEffect, useState } from 'react'
import Editor from './Editor'
import Landing from './Landing'
import { loadImage, normalizeImage } from './lib/image'
import { track } from './track'

declare const chrome: {
  storage?: { local: { get: (k: string[], cb: (r: Record<string, string>) => void) => void; remove: (k: string[]) => void } }
} | undefined

const isExtension = typeof chrome !== 'undefined' && !!chrome?.storage && location.protocol === 'chrome-extension:'

export default function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
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

  return <Landing notice={notice} onFile={handleFile} onSample={openSample} onCapture={captureScreen} />
}
