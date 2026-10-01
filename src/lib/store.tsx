import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppSettings, Book } from '../types'
import { DEFAULT_READER } from '../types'
import { db, loadAppSettings, saveAppSettings } from './db'
import { ensureLibrary } from './library'
import { ensureBundledFiles } from './bundledFiles'
import { setLang, t } from './i18n'

export interface Route {
  name:
    | 'home'
    | 'library'
    | 'notes'
    | 'bookNotes'
    | 'search'
    | 'settings'
    | 'add'
    | 'book'
    | 'reader'
  bookId?: string
  genre?: string
}

interface Store {
  ready: boolean
  books: Book[]
  settings: AppSettings
  route: Route
  navigate: (r: Route) => void
  updateBook: (id: string, patch: Partial<Book> | ((b: Book) => Partial<Book>)) => void
  addBook: (b: Book) => void
  removeBook: (id: string) => void
  setSettings: (patch: Partial<AppSettings>) => void
  importError: string | null
  setImportError: (e: string | null) => void
}

const Ctx = createContext<Store>(null as unknown as Store)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [books, setBooks] = useState<Book[]>([])
  const [route, setRoute] = useState<Route>({ name: 'home' })
  const [importError, setImportError] = useState<string | null>(null)
  const [settings, setSettingsState] = useState<AppSettings>({
    language: 'ru',
    defaultReader: DEFAULT_READER,
  })
  const booksRef = useRef(books)
  booksRef.current = books

  // t() вызывают и вне React (formatSize, timeAgo, парсеры), поэтому язык держим в модуле i18n,
  // а провайдер обновляет его на каждом рендере — смена языка перерисовывает всё дерево
  setLang(settings.language)

  useEffect(() => {
    ;(async () => {
      await ensureLibrary()
      await ensureBundledFiles()
      const [all, s] = await Promise.all([db.allBooks(), loadAppSettings(settings)])
      setBooks(all.sort((a, b) => b.addedAt - a.addedAt))
      setSettingsState(s)
      setReady(true)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const persist = useCallback((b: Book) => {
    void db.putBook(b)
  }, [])

  const navigate = useCallback((r: Route) => setRoute(r), [])

  const updateBook = useCallback(
    (id: string, patch: Partial<Book> | ((b: Book) => Partial<Book>)) => {
      setBooks((prev) => {
        const idx = prev.findIndex((b) => b.id === id)
        if (idx < 0) return prev
        const cur = prev[idx]
        const next = { ...cur, ...(typeof patch === 'function' ? patch(cur) : patch) }
        const copy = [...prev]
        copy[idx] = next
        persist(next)
        return copy
      })
    },
    [persist],
  )

  const addBook = useCallback((b: Book) => {
    setBooks((prev) => {
      const copy = [b, ...prev.filter((x) => x.id !== b.id)]
      return copy
    })
    persist(b)
  }, [persist])

  const removeBook = useCallback((id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id))
    void db.deleteBook(id)
  }, [])

  const setSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch }
      void saveAppSettings(next)
      return next
    })
  }, [])

  const value = useMemo<Store>(
    () => ({ ready, books, settings, route, navigate, updateBook, addBook, removeBook, setSettings, importError, setImportError }),
    [ready, books, settings, route, navigate, updateBook, addBook, removeBook, setSettings, importError],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  return useContext(Ctx)
}

export function formatSize(bytes: number): string {
  if (bytes > 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' ' + t('МБ')
  return Math.round(bytes / 1024) + ' ' + t('КБ')
}

export function timeAgo(ts: number): string {
  const d = Math.floor((Date.now() - ts) / 864e5)
  if (d === 0) return t('сегодня')
  if (d === 1) return t('вчера')
  if (d < 7) return t('{n} дн. назад', { n: d })
  if (d < 30) return t('{n} нед. назад', { n: Math.floor(d / 7) })
  return t('{n} мес. назад', { n: Math.floor(d / 30) })
}
