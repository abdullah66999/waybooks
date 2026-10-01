/**
 * Resolves static asset paths (like /library/..., /covers/..., /books/..., /logo.png)
 * universally whether the app is running:
 * - On GitHub Pages subpath (/waybooks/app/)
 * - In Capacitor on Android (http://localhost/ or capacitor://localhost/)
 * - On local Vite dev server (http://localhost:5173/)
 */
export function resolveAsset(path: string | null | undefined): string {
  if (!path) return ''
  if (/^(data:|blob:|https?:|\/\/)/i.test(path)) return path

  const clean = path.replace(/^\/+/, '')

  // Browser / WebView document.baseURI provides the exact folder URL including subpath
  if (typeof document !== 'undefined' && document.baseURI) {
    try {
      return new URL(clean, document.baseURI).href
    } catch {
      // fallback
    }
  }

  const base = (typeof import.meta !== 'undefined' && (import.meta as any).env?.BASE_URL) || './'
  return base.endsWith('/') ? base + clean : base + '/' + clean
}
