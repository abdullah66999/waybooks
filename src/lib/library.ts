import type { Book } from '../types'
import { ADDED_GENRE } from '../types'
import { db } from './db'
import { hueFromString } from './cover'

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

// подгружает полнотекстовую библиотеку (public/library/*.json) один раз
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
      const r = await fetch('/library/index.json')
      if (!r.ok) return
      const metas: LibMeta[] = await r.json()
      // разовая миграция: добавленные вручную книги живут в своей полке «Добавленные книги»,
      // а не в жанре, который написан в метаданных файла (ФМЭЛ «foreign_prose» и тому подобное)
      if (!(await db.getSetting<boolean>('added-genre-v1'))) {
        const builtin = new Set(metas.map((m) => m.id))
        try {
          const mf = await fetch('/books/manifest.json')
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
      for (const [id, b] of known) if (!shipped.has(id) && /^(cc|rp)-/.test(id)) await db.deleteBook(id)
      let n = 0
      for (const m of metas) {
        const prev = known.get(m.id)
        // rev — контрольная сумма текста из index.json: менялась глава в сборщике — перечитаем книгу
        if (prev && (await db.getSetting<string>('rev:' + m.id)) === m.rev) {
          // текст тот же, но сборщик мог переименовать жанр, добавить поджанр или дорисовать обложку —
          // правим витрину, главы не трогаем.
          // pages тут не сравниваем: читалка держит его равным реально отмеренным полосам,
          // и на каждом запуске сбрасывать это число обратно — значит гонять счётчик туда-сюда
          if (prev.title !== m.title || prev.author !== m.author || prev.genre !== m.genre || prev.subgenre !== m.subgenre || prev.cover !== m.cover || prev.description !== m.description || prev.source !== m.source)
            await db.putBook({ ...prev, title: m.title, author: m.author, genre: m.genre, subgenre: m.subgenre, cover: m.cover, description: m.description, source: m.source })
          continue
        }
        const br = await fetch('/library/' + m.id + '.json')
        if (!br.ok) continue
        const full = (await br.json()) as { chapters: Book['chapters'] }
        const book: Book = {
          id: m.id,
          title: m.title,
          author: m.author,
          genre: m.genre,
          subgenre: m.subgenre ?? '',
          source: m.source,
          description: m.description,
          format: 'txt',
          fileSize: JSON.stringify(full).length,
          pages: m.pages,
          chapters: full.chapters,
          cover: m.cover,
          coverHue: hueFromString(m.title),
          favorite: prev?.favorite ?? false,
          status: prev?.status,
          addedAt: prev?.addedAt ?? Date.now() - ++n * 36e5,
          lastOpenedAt: prev?.lastOpenedAt ?? null,
          // прогресс мог ссылаться на главу, которой в новой сборке нет — начинаем заново
          progress: prev && prev.chapters.length === full.chapters.length ? prev.progress : 0,
          chapterIndex: prev && prev.chapters.length === full.chapters.length ? Math.min(prev.chapterIndex, full.chapters.length - 1) : 0,
          scrollPosition: 0,
          settings: prev?.settings ?? {},
          bookmarks: prev?.bookmarks ?? [],
          notes: prev?.notes ?? [],
        }
        await db.putBook(book)
        await db.putSetting('rev:' + m.id, m.rev)
      }
    } catch {
      /* нет сети / нет файлов — не критично */
    }
  })()
  return promise
}
