import type { Book } from '../types'
import { t } from './i18n'
import { ADDED_GENRE } from '../types'
import { hueFromString } from './cover'
import { parseFile, type ParsedBook } from './parsers'

// оценка числа страниц до первого открытия: читалка потом перезапишет её по реальным
// отмеренным полосам, здесь нужен только правдоподобный масштаб для обложек и подписей
function estimatePages(parsed: ParsedBook): number {
  return parsed.chapters.reduce((acc, c) => acc + Math.max(2, Math.round(c.html.replace(/<[^>]+>/g, '').length / 1400)), 0)
}

export function bookFromParsed(parsed: ParsedBook, opts: { id?: string; addedAt?: number } = {}): Book {
  return {
    id: opts.id ?? 'b-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
    title: parsed.title,
    author: parsed.author || t('Неизвестный автор'),
    genre: ADDED_GENRE,
    subgenre: '',
    description: parsed.description,
    format: parsed.format,
    fileSize: 0,
    pages: estimatePages(parsed),
    chapters: parsed.chapters,
    cover: parsed.cover,
    coverHue: hueFromString(parsed.title + parsed.author),
    favorite: false,
    addedAt: opts.addedAt ?? Date.now(),
    lastOpenedAt: null,
    progress: 0,
    chapterIndex: 0,
    scrollPosition: 0,
    settings: {},
    bookmarks: [],
    notes: [],
  }
}

export async function importFileToBook(file: File): Promise<Book> {
  const parsed = await parseFile(file)
  const book = bookFromParsed(parsed)
  book.title = parsed.title || file.name
  book.fileSize = file.size
  return book
}
