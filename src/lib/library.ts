import type { Book } from '../types'
import { ADDED_GENRE } from '../types'
import { db } from './db'
import { hueFromString } from './cover'
import { resolveAsset } from './resolveAsset'

interface LibMeta {
  id: string
  title: string
  author: string
  genre: string
  subgenre: string
  description: string
  pages: number
  cover: string
  source?: string
  rev: string
}

let promise: Promise<void> | null = null

// подгружает библиотеку (public/library/*.json)
export function ensureLibrary(): Promise<void> {
  if (promise) return promise
  promise = (async () => {
    try {
      // разовая миграция: убрать демонстрационные заглушки, остались только реальные тексты
      if (!(await db.getSetting<boolean>('stubs-v3'))) {
        const all = await db.allBooks()
        for (const b of all) if (b.id.startsWith('seed-')) await db.deleteBook(b.id)
        await db.putSetting('stubs-v3', true)
      }
      const r = await fetch(resolveAsset('/library/index.json'))
      if (!r.ok) return
      const metas: LibMeta[] = await r.json()
      // разовая миграция: добавленные вручную книги живут в своей полке «Добавленные книги»,
      // а не в жанре, который написан в метаданных файла (ФМЭЛ «foreign_prose» и тому подобное)
      if (!(await db.getSetting<boolean>('added-genre-v1'))) {
        const builtin = new Set(metas.map((m) => m.id))
        try {
          const mf = await fetch(resolveAsset('/books/manifest.json'))
          if (mf.ok) for (const m of (await mf.json()) as { id: string }[]) builtin.add(m.id)
        } catch {
          /* нет манифеста — значит бандл-файлов нет, и остальное действительно ручные импорты */
        }
        for (const b of await db.allBooks())
          if (!builtin.has(b.id)) await db.putBook({ ...b, genre: ADDED_GENRE, subgenre: '', notes: b.notes ?? [] })
        await db.putSetting('added-genre-v1', true)
      }
      const known = new Map((await db.allBooks()).map((b) => [b.id, b]))
      // книги, которые сборщик библиотеки отверг (например, из-за битой оцифровки), убираем из базы
      const shipped = new Set(metas.map((m) => m.id))
      for (const [id, b] of known) if (!shipped.has(id) && /^(cc|rp|is)-/.test(id)) await db.deleteBook(id)
      let n = 0
      for (const m of metas) {
        const prev = known.get(m.id)
        const coverUrl = resolveAsset(m.cover)
        // rev — контрольная сумма текста из index.json: менялась глава в сборщике — перечитаем книгу
        if (prev && (await db.getSetting<string>('rev:' + m.id)) === m.rev) {
          if (
            prev.title !== m.title ||
            prev.author !== m.author ||
            prev.genre !== m.genre ||
            prev.subgenre !== m.subgenre ||
            prev.cover !== coverUrl ||
            prev.description !== m.description ||
            prev.source !== m.source
          ) {
            await db.putBook({
              ...prev,
              title: m.title,
              author: m.author,
              genre: m.genre,
              subgenre: m.subgenre,
              cover: coverUrl,
              description: m.description,
              source: m.source,
            })
          }
          continue
        }

        // Если книга уже есть и в ней есть главы, но изменилась ревизия
        let chapters = prev?.chapters ?? []
        let fileSize = prev?.fileSize ?? 0

        const book: Book = {
          id: m.id,
          title: m.title,
          author: m.author,
          genre: m.genre,
          subgenre: m.subgenre ?? '',
          source: m.source,
          description: m.description,
          format: 'txt',
          fileSize,
          pages: m.pages,
          chapters,
          cover: coverUrl,
          coverHue: hueFromString(m.title),
          favorite: prev?.favorite ?? false,
          status: prev?.status,
          addedAt: prev?.addedAt ?? Date.now() - ++n * 36e5,
          lastOpenedAt: prev?.lastOpenedAt ?? null,
          progress: prev ? prev.progress : 0,
          chapterIndex: prev ? Math.min(prev.chapterIndex, Math.max(0, chapters.length - 1)) : 0,
          scrollPosition: 0,
          settings: prev?.settings ?? {},
          bookmarks: prev?.bookmarks ?? [],
          notes: prev?.notes ?? [],
        }
        await db.putBook(book)
        await db.putSetting('rev:' + m.id, m.rev)
      }

      // Запускаем фоновую дозагрузку глав для офлайн-чтения без задержки старта интерфейса
      startBackgroundPreload()
    } catch {
      /* нет сети / нет файлов — не критично */
    }
  })()
  return promise
}

// Загружает полный текст книги при её открытии читателем
export async function loadBookChapters(id: string): Promise<Book | null> {
  const b = await db.getBook(id)
  if (!b) return null
  if (b.chapters && b.chapters.length > 0) return b
  try {
    const br = await fetch(resolveAsset('/library/' + id + '.json'))
    if (!br.ok) return b
    const full = (await br.json()) as { chapters: Book['chapters'] }
    const updated: Book = {
      ...b,
      chapters: full.chapters || [],
      fileSize: JSON.stringify(full).length,
    }
    await db.putBook(updated)
    return updated
  } catch {
    return b
  }
}

let preloaderRunning = false
export function startBackgroundPreload() {
  if (preloaderRunning) return
  preloaderRunning = true
  setTimeout(async () => {
    try {
      const all = await db.allBooks()
      const missing = all.filter((b) => /^(cc|rp|is)-/.test(b.id) && (!b.chapters || b.chapters.length === 0))
      for (const b of missing) {
        await loadBookChapters(b.id)
        // пауза 120мс между запросами, чтобы не забивать сеть и поток
        await new Promise((r) => setTimeout(r, 120))
      }
    } catch {
      // ignore
    } finally {
      preloaderRunning = false
    }
  }, 1500)
}
