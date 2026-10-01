import type { AppSettings, Book, SearchHistoryItem } from '../types'

const DB_NAME = 'chitalka'
const DB_VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('books')) db.createObjectStore('books', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode)
    const req = fn(t.objectStore(store))
    req.onsuccess = () => resolve(req.result as T)
    req.onerror = () => reject(req.error)
    t.oncomplete = () => db.close()
  })
}

export const db = {
  allBooks: () => tx<Book[]>('books', 'readonly', (s) => s.getAll()),
  putBook: (book: Book) => tx('books', 'readwrite', (s) => s.put(book)),
  deleteBook: (id: string) => tx('books', 'readwrite', (s) => s.delete(id)),
  clearBooks: () => tx('books', 'readwrite', (s) => s.clear()),
  getSetting: <T>(key: string) =>
    tx<{ key: string; value: T } | undefined>('settings', 'readonly', (s) => s.get(key)).then((r) => r?.value),
  putSetting: <T>(key: string, value: T) => tx('settings', 'readwrite', (s) => s.put({ key, value })),
}

// в сохранённых настройках вполне могут лежать «sepia» и «light» из прежних версий —
// их выбрасываем здесь, иначе читалка и настройки разошлись бы по цвету
export async function loadAppSettings(fallback: AppSettings): Promise<AppSettings> {
  const s = await db.getSetting<AppSettings & { appTheme?: string }>('app-settings')
  if (!s) return fallback
  const dr = { ...fallback.defaultReader, ...(s.defaultReader ?? {}) }
  return { language: s.language === 'en' || s.language === 'ce' ? s.language : fallback.language, defaultReader: dr }
}

export async function saveAppSettings(s: AppSettings) {
  await db.putSetting('app-settings', s)
}

export async function loadSearchHistory(): Promise<SearchHistoryItem[]> {
  return (await db.getSetting<SearchHistoryItem[]>('search-history')) ?? []
}

export async function saveSearchHistory(h: SearchHistoryItem[]) {
  await db.putSetting('search-history', h.slice(0, 10))
}
