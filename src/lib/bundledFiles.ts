import type { Book } from '../types'
import { db } from './db'
import { bookFromParsed } from './importBook'
import { parseFile } from './parsers'
import { resolveAsset } from './resolveAsset'

interface BundledItem {
  id: string
  file: string
  name: string
  format: string
  title: string
  author: string
  genre: string
  subgenre: string
  description: string
  chapters: number
  bytes: number
  rev: string
}

// в библиотеке есть книги, которые приходят не из JSON, а настоящими файлами EPUB и FB2.
// они проходят тот же parseFile, что и файл, выбранный пользователем, — так форматы
// перестают быть «кодом на будущее» и проверяются при каждом установлении приложения
export async function ensureBundledFiles(): Promise<void> {
  try {
    const r = await fetch(resolveAsset('/books/manifest.json'))
    if (!r.ok) return
    const items: BundledItem[] = await r.json()
    const known = new Map((await db.allBooks()).map((b) => [b.id, b]))
    for (const m of items) {
      const prev = known.get(m.id)
      if (prev && (await db.getSetting<string>('rev:' + m.id)) === m.rev) continue
      const fr = await fetch(resolveAsset(m.file))
      if (!fr.ok) continue
      const blob = await fr.blob()
      const file = new File([blob], m.name, { type: m.format === 'epub' ? 'application/epub+zip' : 'text/xml' })
      const parsed = await parseFile(file)
      const sameChapters = !!prev && prev.chapters.length === parsed.chapters.length
      const book: Book = {
        // название и автора берём из самого файла: именно их парсер и должен уметь читать
        ...bookFromParsed(parsed, { id: m.id, addedAt: prev?.addedAt ?? Date.now() }),
        cover: resolveAsset((m as any).cover || `/covers/${m.id}.jpg` || parsed.cover),
        fileSize: blob.size,
        genre: m.genre,
        subgenre: m.subgenre,
        favorite: prev?.favorite ?? false,
        lastOpenedAt: prev?.lastOpenedAt ?? null,
        settings: prev?.settings ?? {},
        bookmarks: prev?.bookmarks ?? [],
        notes: prev?.notes ?? [],
        progress: sameChapters ? prev!.progress : 0,
        chapterIndex: sameChapters ? Math.min(prev!.chapterIndex, parsed.chapters.length - 1) : 0,
        scrollPosition: 0,
      }
      await db.putBook(book)
      await db.putSetting('rev:' + m.id, m.rev)
    }
  } catch {
    /* файл не читается или не скачался — библиотека остаётся без этих двух книг, остальное работает */
  }
}
