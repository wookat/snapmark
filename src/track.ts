export function track(action: string) {
  try {
    if (location.protocol.startsWith('http')) {
      const base = location.hostname === 'localhost' ? '' : 'https://ext.zalize.com'
      void fetch(`${base}/api/track`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
        keepalive: true,
      }).catch(() => {})
    } else {
      void fetch('https://ext.zalize.com/api/track', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: `ext_${action}` }),
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    /* analytics must never break the app */
  }
}
