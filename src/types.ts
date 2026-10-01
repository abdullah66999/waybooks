export type BookFormat = 'epub' | 'fb2' | 'txt' | 'pdf'

// добавленную вручную книгу не несём в жанр из метаданных файла («foreign_prose» и прочий ФМЭЛ):
// для пользователя это просто его полка
export const ADDED_GENRE = 'Добавленные книги'

export type ReaderTheme = 'light' | 'sepia' | 'dark' | 'black'

export type Lang = 'ru' | 'en' | 'ce'

// полка книги: начатая, «хочу прочитать», дочитанная. Нет поля — считаем по прогрессу,
// иначе старая база выглядывает пустой на всех трёх полках сразу
export type ReadStatus = 'reading' | 'want' | 'done'

export function readStatus(b: Book): ReadStatus {
  if (b.status) return b.status
  if (b.progress >= 1) return 'done'
  return b.progress > 0 || b.lastOpenedAt ? 'reading' : 'want'
}

export interface Chapter {
  title: string
  html: string
}

export interface Book {
  id: string
  title: string
  author: string
  genre: string
  subgenre: string // поджанр внутри жанра: Роман, Повесть…; пусто у импортированных книг
  source?: string // где напечатан текст: домен издателя сборщика; пусто у импортированных книг
  description: string
  format: BookFormat
  fileSize: number
  pages: number
  chapters: Chapter[]
  cover: string | null // data URL, or null -> gradient generated from id
  coverHue: number
  favorite: boolean
  status?: ReadStatus
  addedAt: number
  lastOpenedAt: number | null
  // reading progress
  progress: number // 0..1
  chapterIndex: number
  scrollPosition: number // px within chapter
  // per-book reader settings (partial overrides of defaults)
  settings: Partial<ReaderSettings>
  bookmarks: Bookmark[]
  notes: Note[]
}

export interface Bookmark {
  id: string
  chapterIndex: number
  label: string
  scrollPosition?: number
  createdAt: number
}

// заметка всегда привязана к месту: без этого список превращается в набор цитат непонятно откуда
export interface Note {
  id: string
  chapterIndex: number
  chapterTitle: string
  page: number
  text: string
  comment?: string
  createdAt: number
}

export interface ReaderSettings {
  fontSize: number // px
  fontFamily: string // css font stack key
  lineHeight: number // e.g. 1.5
  paragraphSpacing: number // em
  alignment: 'left' | 'center' | 'justify'
  theme: ReaderTheme
  brightness: number // 0.3..1
}

export interface AppSettings {
  language: Lang
  defaultReader: ReaderSettings
}

export interface SearchHistoryItem {
  query: string
  at: number
}

export const DEFAULT_READER: ReaderSettings = {
  fontSize: 19,
  fontFamily: 'literata',
  lineHeight: 1.6,
  paragraphSpacing: 0.9,
  alignment: 'left',
  theme: 'dark',
  brightness: 1,
}

export const FONT_OPTIONS: { key: string; label: string; stack: string }[] = [
  { key: 'inter', label: 'Inter', stack: "'Inter', 'Palochka', system-ui, sans-serif" },
  { key: 'literata', label: 'Literata', stack: "'Literata', Georgia, 'Palochka', serif" },
  { key: 'georgia', label: 'Georgia', stack: "Georgia, 'Times New Roman', 'Palochka', serif" },
  { key: 'roboto', label: 'Roboto', stack: "'Roboto', 'Palochka', system-ui, sans-serif" },
  { key: 'system', label: 'System', stack: "system-ui, -apple-system, 'Palochka', sans-serif" },
]
