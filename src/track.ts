export function track(action: string) {
  try {
    const isHttp = location.protocol.startsWith('http')
    const base = isHttp && location.hostname === 'localhost' ? '' : 'https://ext.zalize.com'
    const name = isHttp ? action : `ext_${action}`
    void fetch(`${base}/api/track`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: name }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* analytics must never break the app */
  }
}
