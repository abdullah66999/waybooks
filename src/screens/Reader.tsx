import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../lib/store'
import { DEFAULT_READER, FONT_OPTIONS } from '../types'
import { localeOf, t } from '../lib/i18n'
import type { Book, Note, ReaderSettings } from '../types'
import { themeOf } from '../lib/themes'
import { Sheet, Toast } from '../components/common'
import ReaderSettingsSheet from '../components/ReaderSettingsSheet'
import { IcBack, IcBookmark, IcClock, IcComment, IcEdit, IcSearch, IcToc } from '../components/icons'

type SheetKind = null | 'settings' | 'toc' | 'bookmarks' | 'notes' | 'search'

interface HistoryEntry {
  chapterIndex: number
  page: number
  at: number
}

const GAP = 36
const PAD = 22
const TURN_MS = 320
// переход между главами: старый лист гаснет, новый входит с края. Раньше полоса за один
// кадр прыгала с -8897px в 0 — свайп обрывался телепортом вместо листания
const CROSS_OUT_MS = 150
const CROSS_IN_MS = 260
const FADE_MS = 150
const CROSS_LEAD = 0.55
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const HOLD_MS = 320
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
// до того как первая глава отмерена, считаем полосу примерно в 520 знаков — иначе на долю
// секунды внизу мелькнёт итог, посчитанный по совсем другой оценке
const FALLBACK_CPD = 520
// измеренные полосы глав на текущие настройки; пересобирается только при смене шрифта/окна
const PAGE_CACHE = new Map<string, number[]>()

// число страниц и шаг колонки берём из реальной раскладки: браузер сам решает,
// какой ширины сделать колонку, а арифметика по scrollWidth даёт погрешность на каждой странице
function measurePages(track: HTMLDivElement) {
  const lefts: number[] = []
  for (const sel of ['.reader-chapter-title', '.reader-body', '.reader-chapter-nav']) {
    const el = track.querySelector(sel)
    if (el) for (const r of el.getClientRects()) lefts.push(r.left)
  }
  if (!lefts.length) return { count: 1, step: 0 }
  lefts.sort((a, b) => a - b)
  const cols: number[] = []
  for (const x of lefts) if (!cols.length || x - cols[cols.length - 1] > 2) cols.push(x)
  return { count: cols.length, step: cols.length > 1 ? (cols[cols.length - 1] - cols[0]) / (cols.length - 1) : 0 }
}

// —— выделение текста своими руками: на .reader-pager стоит touch-action:none, а свайп
// перехватывает жест, поэтому нативный long-press браузера сюда не доходит.
// Долгое нажатие берёт слово под пальцем, протяжка добирает символ за символом до того места,
// куда ушёл палец. Само нативное выделение намеренно выключено (user-select:none): панель
// Android «Копировать / Выбрать все» рисуется поверх WebView и затыкает нашу кнопку «В заметки»,
// поэтому подсветку тоже рисуем сами — по строкам Range.
interface Caret {
  node: Text
  offset: number
}

function caretAt(x: number, y: number): Caret | null {
  const d = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null
  }
  const r = d.caretRangeFromPoint?.(x, y)
  if (r) return { node: r.startContainer as Text, offset: r.startOffset }
  const p = d.caretPositionFromPoint?.(x, y)
  return p ? { node: p.offsetNode as Text, offset: p.offset } : null
}

const isWordChar = (c: string) => /[\p{L}\p{N}]/u.test(c)

// стартовый захват — слово под пальцем; тычок в пробел переносит выделение на следующее слово
function wordSpan(node: Text, offset: number): Caret[] {
  const s = node.data
  const at = Math.max(0, Math.min(offset, s.length))
  let a = at
  let b = at
  while (a > 0 && isWordChar(s[a - 1])) a--
  while (b < s.length && isWordChar(s[b])) b++
  if (a === b) {
    const next = s.slice(at).search(/[\p{L}\p{N}]/u)
    if (next < 0) return []
    a = at + next
    b = a
    while (b < s.length && isWordChar(s[b])) b++
  }
  return [
    { node, offset: a },
    { node, offset: b },
  ]
}

function rangeBetween(a: Caret, b: Caret): Range | null {
  const r = document.createRange()
  try {
    r.setStart(a.node, a.offset)
    r.setEnd(b.node, b.offset)
  } catch {
    return null
  }
  // палец пошёл назад: браузер схлопнул диапазон в более раннюю точку — разворачиваем обратно
  if (r.startContainer !== a.node || r.startOffset !== a.offset) {
    r.setStart(b.node, b.offset)
    r.setEnd(a.node, a.offset)
  }
  return r
}

export default function Reader() {
  const { route, books, settings: appSettings, navigate, updateBook } = useStore()
  const book = books.find((b) => b.id === route.bookId)
  const bookId = book?.id

  const [settings, setSettings] = useState<ReaderSettings>(() => {
    const s = { ...DEFAULT_READER, ...appSettings.defaultReader, ...(book?.settings ?? {}) }
    // в сохранённых настройках старой книги может лежать фон, которого в списке больше нет —
    // themeOf подставляет ему замену, и стейт выравниваем по ней же
    return { ...s, theme: themeOf(s.theme).key }
  })
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  const [ui, setUi] = useState(false)
  const [sheet, setSheet] = useState<SheetKind>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [editingCommentNote, setEditingCommentNote] = useState<Note | null>(null)
  const [commentText, setCommentText] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([])

  const [colW, setColW] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const [pitch, setPitch] = useState(0)
  const [slide, setSlide] = useState(true)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef(false)
  const [dragDx, setDragDx] = useState(0)
  const [hold, setHold] = useState(0)
  const [cross, setCross] = useState(0)
  const [fade, setFade] = useState(1)
  const [dur, setDur] = useState(TURN_MS)
  const crossTimer = useRef(0)
  const turning = useRef(false)
  const pagerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const pendingPage = useRef<number | null>(null)
  const lastCount = useRef(1)
  const st = useRef({ x0: 0, lastX: 0, lastT: 0, v: 0, horiz: false, dx: 0 })
  const saveTimer = useRef(0)
  const settingsTimer = useRef(0)
  const wheelLock = useRef(0)

  // выделенный фрагмент: текст, полоски подсветки и точка на экране, над которой вешать кнопку
  const [sel, setSel] = useState<{ text: string; rects: { x: number; y: number; w: number; h: number }[]; x: number; y: number } | null>(null)
  const anchor = useRef<Caret | null>(null)
  const selBody = useRef<HTMLElement | null>(null)
  const selecting = useRef(false)
  const holdTimer = useRef(0)
  const suppressClick = useRef(false)

  // глава и страница — один атомарный стейт: по отдельности React успевает отрисовать
  // новый текст со старым смещением трека, и при переходе в главу текст «уезжает» назад
  const [pos, setPos] = useState(() => ({ chapter: book?.chapterIndex ?? 0, page: book?.scrollPosition ?? 0 }))
  const posRef = useRef(pos)
  posRef.current = pos
  const { chapter, page } = pos

  // полосы всех глав, отмеренные тем же раскладчиком, что рисует страницу
  const measureRef = useRef<HTMLDivElement>(null)
  const [counts, setCounts] = useState<number[]>([])
  // до загрузки шрифта раскладчика полосы считать нельзя: с запасным шрифтом их меньше,
  // и кэш навсегда оставляет неверное число — счётчик на границе глав идёт назад
  const [fontReady, setFontReady] = useState(false)

  // measure available page width
  useEffect(() => {
    const el = pagerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setColW(Math.max(140, el.clientWidth - PAD * 2)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const repaginate = useCallback(() => {
    const track = trackRef.current
    if (!track || !colW) return
    const { count, step } = measurePages(track)
    if (step) setPitch(step)
    setPageCount(count)
    const target = pendingPage.current
    const cur = posRef.current.page
    if (target != null) {
      pendingPage.current = null
      const next = target === -1 ? count - 1 : Math.min(target, count - 1)
      if (next !== cur) setPos((p) => ({ ...p, page: next }))
    } else {
      // при смене шрифта или размера окна держим ту же долю главы, а не номер страницы.
      // до первого замера lastCount пуст — иначе доля считается от единицы и сохранённая
      // позиция внутри главы обнуляется при каждом открытии книги
      const prev = lastCount.current
      const next = prev > 1 ? (count > 1 ? Math.min(count - 1, Math.round((cur / (prev - 1)) * (count - 1))) : 0) : Math.min(cur, count - 1)
      if (next !== cur) setPos((p) => ({ ...p, page: next }))
    }
    lastCount.current = count
  }, [colW])

  useLayoutEffect(() => {
    repaginate()
  }, [repaginate, chapter, settings.fontSize, settings.lineHeight, settings.paragraphSpacing, settings.alignment, settings.fontFamily, book?.chapters.length])

  // веб-шрифт доезжает только к первому рендеру текста и меняет раскладку — пересчитываем
  useEffect(() => {
    let alive = true
    const done = () => alive && setFontReady(true)
    const stack = FONT_OPTIONS.find((f) => f.key === settings.fontFamily)?.stack ?? FONT_OPTIONS[1].stack
    // статус document.fonts к этому моменту уже 'loaded' (интерфейс-то отрисован), поэтому
    // ждём именно нужный читалке шрифт: без этого все главы отмеряются запасным и полос
    // выходит меньше — счётчик на границе глав идёт назад
    const pending = document.fonts?.load(`19px ${stack}`, 'Йцукен гшщ')
    if (pending) pending.then(done).catch(done)
    else done()
    repaginate()
    return () => {
      alive = false
    }
  }, [repaginate, settings.fontFamily])

  // уехавшая адресная строка и поворот меняют высоту, а с ней и число страниц
  useEffect(() => {
    const onResize = () => repaginate()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [repaginate])

  // «стр. X из Y» по всей книге считаем по реальным полосам каждой главы: оценка из сборки
  // всегда расходится с тем, что разложил браузер, и из-за этого счётчик то стоит, то прыгает
  const sig = bookId ? `${bookId}|${book?.chapters.length ?? 0}|${colW}|${settings.fontSize}|${settings.lineHeight}|${settings.paragraphSpacing}|${settings.alignment}|${settings.fontFamily}` : ''
  useEffect(() => {
    const host = measureRef.current
    if (!host || !book || !colW || !fontReady) return
    const cached = PAGE_CACHE.get(sig)
    if (cached) {
      setCounts(cached)
      return
    }
    let alive = true
    let raf = 0
    const arr: number[] = []
    const run = () => {
      if (!alive) return
      const t0 = performance.now()
      while (arr.length < book.chapters.length && performance.now() - t0 < 14) {
        const c = book.chapters[arr.length]
        const h = document.createElement('h2')
        h.className = 'reader-chapter-title'
        h.textContent = c.title
        const b = document.createElement('div')
        b.className = 'reader-body'
        b.innerHTML = c.html
        const nav = document.createElement('div')
        nav.className = 'reader-chapter-nav'
        // ширины задаём те же, что у видимой полосы, иначе раскладка измерится другая
        for (const el of [h, b, nav]) el.style.width = `${colW}px`
        host.replaceChildren(h, b, nav)
        arr.push(measurePages(host).count || 1)
      }
      host.replaceChildren()
      setCounts(arr.slice())
      if (arr.length < book.chapters.length) raf = requestAnimationFrame(run)
      else PAGE_CACHE.set(sig, arr.slice())
    }
    run()
    return () => {
      alive = false
      cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, colW, fontReady])

  useEffect(() => {
    if (slide) return
    const id = requestAnimationFrame(() => setSlide(true))
    return () => cancelAnimationFrame(id)
  }, [slide])

  // auto-hide controls
  useEffect(() => {
    if (!ui) return
    const t = window.setTimeout(() => setUi(false), 4200)
    return () => clearTimeout(t)
  }, [ui])

  // persist per-book reader settings
  useEffect(() => {
    if (!bookId) return
    window.clearTimeout(settingsTimer.current)
    settingsTimer.current = window.setTimeout(() => {
      updateBook(bookId, { settings: settingsRef.current })
    }, 500)
    return () => window.clearTimeout(settingsTimer.current)
  }, [settings, bookId, updateBook])

  // flush settings on exit
  useEffect(() => {
    return () => {
      if (bookId) updateBook(bookId, { settings: settingsRef.current })
    }
  }, [bookId, updateBook])

  const pendingPatch = useRef<Partial<Book> | null>(null)

  const lens = useMemo(() => (book?.chapters ?? []).map((c) => c.html.replace(/<[^>]+>/g, '').length || 1), [book?.chapters])

  // главы слишком разные по длине, поэтому прогресс считаем от полос: иначе на границе
  // главы счётчик перескакивает через десятки страниц или встаёт. Неотмеренные главы делим
  // на плотность уже измеренных — итог по книге подплывает плавно, а не меняется вдвое
  const pageCounts = useMemo(() => {
    let chars = 0
    let pages = 0
    lens.forEach((l, i) => {
      if (counts[i]) {
        chars += l
        pages += counts[i]
      }
    })
    const cpd = pages ? Math.max(150, chars / pages) : FALLBACK_CPD
    return lens.map((l, i) => counts[i] ?? Math.max(1, Math.round(l / cpd)))
  }, [lens, counts])

  const spans = useMemo(() => {
    const before: number[] = []
    let acc = 0
    for (const p of pageCounts) {
      before.push(acc)
      acc += p
    }
    return { before, total: acc || 1 }
  }, [pageCounts])

  const progressOf = useCallback((chIdx: number, pg: number) => clamp01((spans.before[chIdx] + pg + 1) / spans.total), [spans])

  const persistProgress = (chapterIndex: number, pg: number) => {
    if (!bookId || !book) return
    const p = progressOf(chapterIndex, pg)
    pendingPatch.current = {
      chapterIndex,
      scrollPosition: pg,
      progress: p,
      lastOpenedAt: Date.now(),
      // открыл книгу — она едет в «Читаю»; дошёл до конца — в «Прочитал»
      status: p >= 1 ? 'done' : 'reading',
    }
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      if (!pendingPatch.current) return
      updateBook(bookId, pendingPatch.current)
      pendingPatch.current = null
    }, 450)
  }

  // save progress whenever page/chapter changes
  useEffect(() => {
    if (!bookId || !pageCount) return
    persistProgress(chapter, page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, chapter, pageCount, bookId])

  // полка и карточка считают «осталось стр.» по book.pages — держим это число равным
  // измеренному, иначе главная и читалка показывают разное количество страниц одной книги
  useEffect(() => {
    if (bookId && spans.total !== book?.pages) updateBook(bookId, { pages: spans.total })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, spans.total])

  // flush unsaved progress on exit
  useEffect(() => {
    return () => {
      window.clearTimeout(saveTimer.current)
      window.clearTimeout(crossTimer.current)
      window.clearTimeout(holdTimer.current)
      if (bookId && pendingPatch.current) updateBook(bookId, pendingPatch.current)
      pendingPatch.current = null
    }
  }, [bookId, updateBook])

  // выделение относится к конкретной полосе: перелистнули — цитата уже про другой текст
  useEffect(() => {
    clearSel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos.chapter, pos.page])

  const theme = themeOf(settings.theme)
  const fontStack = FONT_OPTIONS.find((f) => f.key === settings.fontFamily)?.stack ?? FONT_OPTIONS[1].stack
  const ch = book?.chapters[Math.min(chapter, (book?.chapters.length ?? 1) - 1)]
  const overall = progressOf(chapter, page)
  const pageInBook = Math.min(spans.total, spans.before[chapter] + page + 1)

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!book || q.length < 2) return []
    const out: { chapterIndex: number; snippet: string }[] = []
    book.chapters.forEach((c, i) => {
      const text = c.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
      const idx = text.toLowerCase().indexOf(q)
      if (idx >= 0 && out.length < 30) {
        out.push({ chapterIndex: i, snippet: '…' + text.slice(Math.max(0, idx - 40), idx + 90).trim() + '…' })
      }
    })
    return out
  }, [query, book])

  // переход через границу глав: лист гаснет на месте, новая глава въезжает с того же края.
  // Без этого полоса прыгала из -8897px в 0 за кадр — свайп обрывался телепортом
  function crossChapter(i: number, targetPage: number, dir: number) {
    if (!book || turning.current) return
    turning.current = true
    setSlide(true)
    setFade(0)
    crossTimer.current = window.setTimeout(() => {
      setSlide(false)
      setHold(0)
      setDur(CROSS_IN_MS)
      setPos({ chapter: i, page: 0 })
      setCross(dir * step * CROSS_LEAD)
      pendingPage.current = targetPage
      setHistory((h) => [...h.slice(-24), { chapterIndex: chapter, page, at: Date.now() }])
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setSlide(true)
          setCross(0)
          setFade(1)
          turning.current = false
        })
      )
    }, CROSS_OUT_MS)
  }

  function cancelCross() {
    window.clearTimeout(crossTimer.current)
    turning.current = false
    setCross(0)
    setFade(1)
    setHold(0)
  }

  function goChapter(i: number, targetPage = 0) {
    if (!book || i < 0 || i >= book.chapters.length) return
    cancelCross()
    setSlide(false)
    if (i === chapter) {
      const last = pageCount - 1
      setPos((p) => ({ ...p, page: targetPage === -1 ? last : Math.min(targetPage, last) }))
      return
    }
    setHistory((h) => [...h.slice(-24), { chapterIndex: chapter, page, at: Date.now() }])
    pendingPage.current = targetPage
    setPos({ chapter: i, page: 0 })
  }

  function turn(dir: number) {
    if (!book || turning.current) return
    if (dir > 0) {
      if (page < pageCount - 1) setPos((p) => ({ ...p, page: p.page + 1 }))
      else if (chapter < book.chapters.length - 1) crossChapter(chapter + 1, 0, 1)
    } else {
      if (page > 0) setPos((p) => ({ ...p, page: p.page - 1 }))
      else if (chapter > 0) crossChapter(chapter - 1, -1, -1)
    }
  }

  // keyboard paging on desktop
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setDur(TURN_MS)
        turn(1)
      } else if (e.key === 'ArrowLeft') {
        setDur(TURN_MS)
        turn(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageCount, chapter])

  if (!book || !ch) {
    return (
      <div className="reader-root">
        <p style={{ padding: 30 }}>{t('Книга не найдена')}</p>
      </div>
    )
  }

  function patchSettings(patch: Partial<ReaderSettings>) {
    setSettings((s) => ({ ...s, ...patch }))
  }

  function notify(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 1600)
  }

  function addBookmark() {
    updateBook(book!.id, (b) => ({
      bookmarks: [...b.bookmarks, { id: 'bm' + Date.now(), chapterIndex: chapter, label: ch!.title, scrollPosition: page, createdAt: Date.now() }],
    }))
    notify(t('Закладка сохранена'))
  }

  // одна и та же цитата, сохранённая дважды, — мусор: выделение легко поймать повторно
  function addNote(text: string): boolean {
    const q = text.replace(/\s+/g, ' ').trim()
    if (!q || !book) return false
    if (book.notes.some((n) => n.text === q && n.chapterIndex === chapter && n.page === page)) return false
    updateBook(book.id, (b) => ({
      notes: [...b.notes, { id: 'n' + Date.now().toString(36), chapterIndex: chapter, chapterTitle: ch!.title, page, text: q, createdAt: Date.now() }],
    }))
    return true
  }

  function saveNote() {
    if (!addNote(draft)) return
    setDraft('')
    notify(t('Заметка сохранена'))
  }

  function noteFromSel() {
    if (!sel) return
    notify(addNote(sel.text) ? t('Цитата в заметках') : t('Такая заметка уже есть'))
    clearSel()
  }

  function saveComment() {
    if (!editingCommentNote || !book) return
    const text = commentText.trim()
    updateBook(book.id, (b) => ({
      notes: b.notes.map((n) => (n.id === editingCommentNote.id ? { ...n, comment: text || undefined } : n)),
    }))
    setEditingCommentNote(null)
    notify(text ? t('Комментарий сохранён') : t('Комментарий удалён'))
  }

  function deleteComment() {
    if (!editingCommentNote || !book) return
    updateBook(book.id, (b) => ({
      notes: b.notes.map((n) => (n.id === editingCommentNote.id ? { ...n, comment: undefined } : n)),
    }))
    setEditingCommentNote(null)
    notify(t('Комментарий удалён'))
  }

  // шаг колонки берём из замеров раскладки: colW + GAP расходится с браузером на дробных пикселях
  const step = pitch || colW + GAP
  let dd = 0
  if (dragging) {
    dd = Math.max(-step, Math.min(step, dragDx))
    if ((page === 0 && dd > 0) || (page === pageCount - 1 && dd < 0)) dd *= 0.35
  } else {
    dd = hold
  }

  function clearSel() {
    window.clearTimeout(holdTimer.current)
    selecting.current = false
    anchor.current = null
    selBody.current = null
    setSel(null)
  }

  function placeSel(r: Range | null) {
    if (!r) return
    const text = r.toString().replace(/\s+/g, ' ').trim()
    if (!text) {
      setSel(null)
      return
    }
    const rects = Array.from(r.getClientRects())
      .filter((q) => q.width > 1 && q.height > 1)
      .map((q) => ({ x: Math.round(q.left), y: Math.round(q.top), w: Math.round(q.width), h: Math.round(q.height) }))
    const box = r.getBoundingClientRect()
    setSel({ text, rects, x: box.left + box.width / 2, y: box.top })
  }

  function beginSelect(x: number, y: number) {
    const body = trackRef.current?.querySelector<HTMLElement>('.reader-body')
    const at = body ? caretAt(x, y) : null
    if (!body || !at || at.node.nodeType !== 3 || !body.contains(at.node)) return
    const span = wordSpan(at.node as Text, at.offset)
    if (!span.length) return
    selBody.current = body
    selecting.current = true
    anchor.current = span[0]
    placeSel(rangeBetween(span[0], span[1]))
  }

  function extendSel(x: number, y: number) {
    const body = selBody.current
    const a = anchor.current
    if (!body || !a) return
    const at = caretAt(x, y)
    if (!at || at.node.nodeType !== 3 || !body.contains(at.node)) return
    placeSel(rangeBetween(a, { node: at.node as Text, offset: at.offset }))
  }

  function onDown(e: React.PointerEvent) {
    st.current = { x0: e.clientX, lastX: e.clientX, lastT: performance.now(), v: 0, horiz: false, dx: 0 }
    setDragDx(0)
    setHold(0)
    dragRef.current = true
    setDragging(true)
    if (sel) {
      // касание при активном выделении снимает его — но новое долгое нажатие тут же работает,
      // иначе с первой цитатой пришлось бы делать два тычка ради второй
      clearSel()
      suppressClick.current = true
    }
    const { clientX: x, clientY: y } = e
    window.clearTimeout(holdTimer.current)
    holdTimer.current = window.setTimeout(() => beginSelect(x, y), HOLD_MS)
  }
  function onMove(e: React.PointerEvent) {
    // выделение проверяется до gate по перетаскиванию: pointermove может прийти в тот же кадр,
    // когда setDragging ещё не отрисовался, и тогда первый ход протяжки терялся
    if (selecting.current) {
      extendSel(e.clientX, e.clientY)
      return
    }
    if (!dragRef.current) return
    const s = st.current
    const dx = e.clientX - s.x0
    if (!s.horiz) {
      if (Math.abs(dx) < 8) return
      window.clearTimeout(holdTimer.current)
      s.horiz = true
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
    const now = performance.now()
    if (now - s.lastT > 0) s.v = (e.clientX - s.lastX) / (now - s.lastT)
    s.lastX = e.clientX
    s.lastT = now
    s.dx = dx
    setDragDx(dx)
  }
  function onUp() {
    if (!dragRef.current) return
    dragRef.current = false
    setDragging(false)
    window.clearTimeout(holdTimer.current)
    if (selecting.current) {
      // клик после выделения не должен ещё и прятать панель — палец только что держал текст
      selecting.current = false
      suppressClick.current = true
    }
    const s = st.current
    if (!s.horiz) return
    // один свайп = ровно один листок (или переход в главу), без пролёта нескольких страниц
    const dir = s.dx < 0 ? 1 : -1
    const atEdge = dir > 0 ? page >= pageCount - 1 && chapter + 1 < book!.chapters.length : page === 0 && chapter > 0
    // при переходе в главу полоса ждёт там, где её оставил палец, и гаснет: отскок назад
    // в тот же кадр читается как обрыв свайпа
    setHold(atEdge ? dd : 0)
    // резкий флик должен и заканчиваться резко, иначе после быстрого взмаха листок доплзает
    setDur(Math.round(Math.min(TURN_MS, Math.max(170, TURN_MS - Math.abs(s.v) * 90))))
    if (Math.abs(s.dx) > step * 0.25 || Math.abs(s.v) > 0.45) turn(dir)
  }
  function onWheel(e: React.WheelEvent) {
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
    if (Math.abs(d) < 4) return
    const now = performance.now()
    if (now - wheelLock.current < 260) return
    wheelLock.current = now
    setDur(TURN_MS)
    turn(d > 0 ? 1 : -1)
  }

  const dim = 1 - settings.brightness

  const layoutStyle = {
    columnWidth: colW ? `${colW}px` : undefined,
    columnGap: `${GAP}px`,
    fontFamily: fontStack,
    fontSize: settings.fontSize,
    lineHeight: settings.lineHeight,
    textAlign: settings.alignment,
    ['--para-gap' as string]: `${settings.paragraphSpacing}em`,
  }

  return (
    <div className="reader-root" style={{ background: theme.bg, color: theme.text }}>
      {dim > 0.01 && <div className="reader-dim" style={{ opacity: dim }} />}

      <div
        ref={pagerRef}
        className={'reader-pager' + (dragging ? ' dragging' : '')}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        // нативное выделение мышью отбито: иначе браузер на первом же ходе забирает жест
        // (pointercancel) и наша протяжка перестаёт расширять цитату
        onMouseDown={(e) => e.preventDefault()}
        onWheel={onWheel}
        onClick={() => setUi((v) => !v)}
        onClickCapture={(e) => {
          if (st.current.horiz || suppressClick.current) {
            suppressClick.current = false
            e.preventDefault()
            e.stopPropagation()
          }
        }}
      >
        <div
          ref={trackRef}
          className="reader-page-track"
          style={{
            ...layoutStyle,
            transform: `translateX(${-page * step + dd + cross}px)`,
            opacity: fade,
            transition: dragging || !slide ? 'none' : `transform ${dur}ms ${EASE}, opacity ${FADE_MS}ms linear`,
          }}
        >
          <h2 className="reader-chapter-title" style={{ fontFamily: fontStack, width: colW || undefined }}>
            {ch.title}
          </h2>
          <div className="reader-body" style={{ width: colW || undefined }} dangerouslySetInnerHTML={{ __html: ch.html }} />
          <div className="reader-chapter-nav" style={{ width: colW || undefined }}>
            {chapter > 0 && (
              <button className="rcn" style={{ color: theme.dim }} onClick={() => goChapter(chapter - 1)}>
                ← {t('Предыдущая')}
              </button>
            )}
            <span />
            {chapter < book.chapters.length - 1 && (
              <button className="rcn" style={{ color: theme.dim }} onClick={() => goChapter(chapter + 1)}>
                {t('Следующая')} →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* невидимая копия полосы: на ней главы меряются в полосы, пока видимая показывает текст */}
      <div className="reader-pager reader-measure" aria-hidden="true">
        <div ref={measureRef} className="reader-page-track" style={layoutStyle} />
      </div>

      <div className={'reader-page-num' + (ui ? ' hidden' : '')} style={{ color: theme.dim }}>
        {t('{n} из {total}', { n: pageInBook, total: spans.total })}
      </div>

      <header className={'reader-top' + (ui ? '' : ' hidden')} style={{ background: theme.bg }}>
        <button
          className="r-icon"
          onClick={() => {
            persistProgress(chapter, page)
            navigate({ name: 'book', bookId: book.id })
          }}
        >
          <IcBack size={22} />
        </button>
        <div className="reader-top-title">
          <b>{book.title}</b>
          <span>{book.author}</span>
        </div>
      </header>

      <div
        className={'reader-bottom' + (ui ? '' : ' hidden')}
        style={{ background: theme.bg, color: theme.text }}
      >
        <div className="reader-track">
          <i style={{ width: `${overall * 100}%` }} />
        </div>
        <div className="reader-caption">
          {Math.round(overall * 100)}% {t('от всей книги')} · {t('стр. {n} из {total}', { n: pageInBook, total: spans.total })}
        </div>
        <div className="reader-tools">
          <button className="reader-tool" onClick={() => setSheet('toc')}>
            <IcToc size={20} />
            <span>{t('Оглавление')}</span>
          </button>
          <button className="reader-tool" onClick={() => setSheet('bookmarks')}>
            <IcBookmark size={20} />
            <span>{t('Закладки')}</span>
          </button>
          <button className="reader-tool" onClick={() => setSheet('notes')}>
            <IcEdit size={20} />
            <span>{t('Заметки')}</span>
          </button>
          <button className="reader-tool" onClick={() => setSheet('settings')}>
            <b className="rt-aa">Aa</b>
            <span>{t('Текст')}</span>
          </button>
          <button className="reader-tool" onClick={() => setSheet('search')}>
            <IcSearch size={20} />
            <span>{t('Поиск')}</span>
          </button>
        </div>
      </div>

      {sheet === 'settings' && (
        <Sheet onClose={() => setSheet(null)} title={t('Настройки текста')}>
          <ReaderSettingsSheet value={settings} onChange={patchSettings} />
        </Sheet>
      )}

      {sheet === 'toc' && (
        <Sheet onClose={() => setSheet(null)} title={t('Оглавление')}>
          <div className="toc-list">
            {book.chapters.map((c, i) => (
              <button
                key={i}
                className={'toc-row' + (i === chapter ? ' active' : '')}
                onClick={() => {
                  goChapter(i)
                  setSheet(null)
                }}
              >
                <span className="toc-num">{i + 1}</span>
                <span className="toc-title">{c.title}</span>
                {i === chapter && <span className="toc-current">›</span>}
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {sheet === 'bookmarks' && (
        <Sheet onClose={() => setSheet(null)} title={t('Закладки и история')}>
          <button className="btn btn-primary" style={{ width: '100%', marginBottom: 14 }} onClick={addBookmark}>
            {t('+ Добавить закладку')}
          </button>
          {!book.bookmarks.length && <p className="muted" style={{ textAlign: 'center', padding: '24px 0' }}>{t('Пока нет закладок')}</p>}
          {book.bookmarks.map((bm) => (
            <div key={bm.id} className="list-row">
              <button
                className="bm-jump"
                onClick={() => {
                  goChapter(bm.chapterIndex, (bm as { scrollPosition?: number }).scrollPosition ?? 0)
                  setSheet(null)
                }}
              >
                <IcBookmark size={16} filled /> {bm.label}
              </button>
              <button className="bm-del" onClick={() => updateBook(book.id, (b) => ({ bookmarks: b.bookmarks.filter((x) => x.id !== bm.id) }))}>
                ✕
              </button>
            </div>
          ))}
          {history.length > 0 && (
            <>
              <div className="rs-label" style={{ marginTop: 18, display: 'flex', gap: 6, alignItems: 'center' }}>
                <IcClock size={14} /> {t('История позиций')}
              </div>
              {history
                .slice(-6)
                .reverse()
                .map((h, i) => (
                  <button
                    key={i}
                    className="hist-row"
                    onClick={() => {
                      goChapter(h.chapterIndex, h.page)
                      setSheet(null)
                    }}
                  >
                    {t('Глава {n}', { n: h.chapterIndex + 1 })} · {new Date(h.at).toLocaleTimeString(localeOf(), { hour: '2-digit', minute: '2-digit' })}
                  </button>
                ))}
            </>
          )}
        </Sheet>
      )}

      {sheet === 'notes' && (
        <Sheet onClose={() => setSheet(null)} title={t('Заметки')}>
          <textarea
            className="note-input"
            rows={4}
            value={draft}
            placeholder={t('Заметка к главе «{title}»', { title: ch.title })}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button className="btn btn-primary note-save" disabled={!draft.trim()} onClick={saveNote}>
            {t('Сохранить заметку')}
          </button>
          {!book.notes.length && (
            <p className="muted" style={{ textAlign: 'center', padding: '18px 0' }}>
              {t('В этой книге заметок пока нет. Печатать не обязательно: зажмите пальцем слово и протяните на нужную фразу — над выделением появится «В заметки».')}
            </p>
          )}
          {[...book.notes]
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((n) => (
              <div key={n.id} className="reader-note-item card" style={{ marginBottom: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <button
                    className="bm-jump note-jump"
                    style={{ flex: 1, textAlign: 'left', wordBreak: 'break-word' }}
                    onClick={() => {
                      goChapter(n.chapterIndex, n.page)
                      setSheet(null)
                    }}
                  >
                    <IcEdit size={16} /> <span>{n.text}</span>
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 'none' }}>
                    <button
                      className="note-action-btn"
                      style={{ padding: 6 }}
                      title={n.comment ? t('Изменить комментарий') : t('Комментировать')}
                      onClick={() => {
                        setEditingCommentNote(n)
                        setCommentText(n.comment ?? '')
                      }}
                    >
                      <IcComment size={16} />
                    </button>
                    <button className="bm-del" onClick={() => updateBook(book.id, (b) => ({ notes: b.notes.filter((x) => x.id !== n.id) }))}>
                      ✕
                    </button>
                  </div>
                </div>
                {n.comment && (
                  <div
                    className="note-comment-box"
                    style={{ margin: '8px 0 0', cursor: 'pointer' }}
                    onClick={() => {
                      setEditingCommentNote(n)
                      setCommentText(n.comment ?? '')
                    }}
                  >
                    <div className="note-comment-head">
                      <IcComment size={12} />
                      <span>{t('Комментарий')}</span>
                    </div>
                    <div className="note-comment-text" style={{ fontSize: 13 }}>{n.comment}</div>
                  </div>
                )}
              </div>
            ))}
        </Sheet>
      )}

      {editingCommentNote && (
        <Sheet onClose={() => setEditingCommentNote(null)} title={t('Комментарий к заметке')}>
          <div className="note-comment-quote-preview">
            “{editingCommentNote.text}”
          </div>
          <textarea
            className="note-input"
            rows={4}
            value={commentText}
            placeholder={t('Напишите свои мысли или комментарий…')}
            onChange={(e) => setCommentText(e.target.value)}
            autoFocus
          />
          <div className="note-sheet-actions">
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveComment}>
              {t('Сохранить')}
            </button>
            {editingCommentNote.comment && (
              <button className="btn btn-danger-outline" onClick={deleteComment}>
                {t('Удалить комментарий')}
              </button>
            )}
          </div>
        </Sheet>
      )}

      {sheet === 'search' && (
        <Sheet onClose={() => setSheet(null)} title={t('Поиск по книге')}>
          <div className="search-bar" style={{ marginBottom: 14 }}>
            <IcSearch size={18} />
            <input className="search-input" placeholder={t('Введите текст…')} value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
          </div>
          {query.length >= 2 && !searchResults.length && <p className="muted" style={{ textAlign: 'center' }}>{t('Совпадений нет')}</p>}
          {searchResults.map((r, i) => (
            <button
              key={i}
              className="search-hit"
              onClick={() => {
                goChapter(r.chapterIndex)
                setSheet(null)
                setQuery('')
              }}
            >
              <b>{t('Глава {n}', { n: r.chapterIndex + 1 })}</b>
              <span>{r.snippet}</span>
            </button>
          ))}
        </Sheet>
      )}

      {sel && (
        <div className="sel-hl" aria-hidden="true">
          {sel.rects.map((r, i) => (
            <span key={i} style={{ left: r.x, top: r.y, width: r.w, height: r.h }} />
          ))}
        </div>
      )}

      {sel && (
        <div
          className="sel-bar"
          data-text={sel.text}
          style={{
            left: Math.round(Math.min(Math.max(sel.x, 96), window.innerWidth - 96)),
            top: Math.round(Math.max(sel.y, 76)),
          }}
        >
          <button className="sel-save" onClick={noteFromSel}>
            <IcEdit size={15} /> {t('В заметки')}
          </button>
        </div>
      )}

      {toast && <Toast text={toast} />}
    </div>
  )
}
