import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { loadSearchHistory, saveSearchHistory } from '../lib/db'
import { BookCover } from '../components/common'
import { IcClose, IcSearch } from '../components/icons'
import { sortSubgenres } from '../lib/subgenres'
import { t } from '../lib/i18n'
import type { SearchHistoryItem } from '../types'

export default function Search() {
  const { books, route, navigate } = useStore()
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState<string | null>(route.genre ?? null)
  const [subgenre, setSubgenre] = useState<string | null>(null)
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(true)

  useMemo(() => {
    loadSearchHistory().then(setHistory)
    return null
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q && !genre) return []
    return books.filter((b) => {
      const matchQ = !q || [b.title, b.author, b.genre, b.subgenre].join(' ').toLowerCase().includes(q)
      const matchG = !genre || b.genre === genre
      const matchS = !subgenre || b.subgenre === subgenre
      return matchQ && matchG && matchS
    })
  }, [books, query, genre, subgenre])

  function submit(value: string) {
    const v = value.trim()
    if (!v) return
    setQuery(v)
    setShowHistory(true)
    const next = [{ query: v, at: Date.now() }, ...history.filter((h) => h.query !== v)].slice(0, 10)
    setHistory(next)
    void saveSearchHistory(next)
  }

  function clearHistory() {
    setHistory([])
    void saveSearchHistory([])
  }

  const active = query.trim() || genre
  const genres = useMemo(() => {
    const counts = new Map<string, number>()
    for (const b of books) if (b.genre) counts.set(b.genre, (counts.get(b.genre) ?? 0) + 1)
    return [...counts].sort((a, b) => b[1] - a[1])
  }, [books])

  // подкатегории считаем только по книгам выбранного жанра: «Проза» есть у вайнахов,
  // но у русской литературы её показывать нечем
  const subgenres = useMemo(() => {
    if (!genre) return []
    const counts = new Map<string, number>()
    for (const b of books) if (b.genre === genre && b.subgenre) counts.set(b.subgenre, (counts.get(b.subgenre) ?? 0) + 1)
    return sortSubgenres([...counts.keys()]).map((s) => [s, counts.get(s) ?? 0] as [string, number])
  }, [books, genre])

  function pickGenre(g: string | null) {
    setGenre(g)
    setSubgenre(null)
  }

  return (
    <div className="screen" style={{ paddingTop: 'calc(14px + var(--safe-top))' }}>
      <div className="search-bar">
        <IcSearch size={19} />
        <input
          className="search-input"
          placeholder={t('Название, автор или жанр')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit((e.target as HTMLInputElement).value)}
          autoFocus
        />
        {query && (
          <button className="search-clear" onClick={() => setQuery('')}>
            <IcClose size={17} />
          </button>
        )}
      </div>

      {!active && showHistory && history.length > 0 && (
        <section className="search-section">
          <div className="row-between">
            <h2 className="section-title">{t('Недавние поиски')}</h2>
            <button className="see-all" onClick={clearHistory}>{t('Очистить')}</button>
          </div>
          <div className="history-list">
            {history.map((h) => (
              <button key={h.query} className="history-item" onClick={() => submit(h.query)}>
                <span className="history-dot" />
                {h.query}
              </button>
            ))}
          </div>
        </section>
      )}

      {!active && (
        <section className="search-section">
          <h2 className="section-title">{t('Жанры')}</h2>
          <div className="genre-wrap">
            {genres.map(([g, n]) => (
              <button key={g} className="chip" onClick={() => pickGenre(g)}>
                {g}
                <span className="chip-count">{n}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {active && (
        <>
          <div className="genre-wrap" style={{ margin: '16px 0 8px' }}>
            {genres.map(([g]) => (
              <button key={g} className={'chip' + (genre === g ? ' active' : '')} onClick={() => pickGenre(genre === g ? null : g)}>
                {g}
              </button>
            ))}
          </div>

          {subgenres.length > 1 && (
            <>
              <div className="subgenre-caption">{genre} · {t('подкатегории')}</div>
              <div className="subgenre-wrap">
                {subgenres.map(([s, n]) => (
                  <button key={s} className={'sub-chip' + (subgenre === s ? ' active' : '')} onClick={() => setSubgenre(subgenre === s ? null : s)}>
                    {s}
                    <span className="chip-count">{n}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="search-results">
            <div className="muted" style={{ fontSize: 13, margin: '4px 2px 12px' }}>
              {t('Найдено: {n}', { n: results.length })}
            </div>
            {results.map((b) => (
              <button key={b.id} className="result-row" onClick={() => navigate({ name: 'book', bookId: b.id })}>
                <BookCover book={b} width={46} height={66} radius={9} />
                <span className="result-body">
                  <b>{b.title}</b>
                  <span>{b.author}{b.genre ? ` · ${b.genre}` : ''}{b.subgenre ? ` · ${b.subgenre}` : ''}</span>
                </span>
              </button>
            ))}
            {!results.length && <div className="muted" style={{ textAlign: 'center', padding: '30px 0' }}>{t('Ничего не найдено в библиотеке')}</div>}
          </div>
        </>
      )}
    </div>
  )
}
