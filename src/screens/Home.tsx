import { useMemo } from 'react'
import { useStore, timeAgo } from '../lib/store'
import type { Book } from '../types'
import { BookCover, ProgressBar } from '../components/common'
import Shelf from '../components/Shelf'
import { IcChevron, IcPlay, IcPlus } from '../components/icons'
import { t } from '../lib/i18n'
import { resolveAsset } from '../lib/resolveAsset'

export default function Home() {
  const { books, navigate } = useStore()
  const continueBook = useMemo(() => {
    const read = books.filter((b) => b.progress > 0 && b.lastOpenedAt)
    if (!read.length) return null
    return read.sort((a, b) => (b.lastOpenedAt ?? 0) - (a.lastOpenedAt ?? 0))[0]
  }, [books])
  const recent = useMemo(() => [...books].sort((a, b) => b.addedAt - a.addedAt).slice(0, 8), [books])
  const favorites = useMemo(() => books.filter((b) => b.favorite), [books])
  const genres = useMemo(() => {
    const counts = new Map<string, number>()
    for (const b of books) if (b.genre) counts.set(b.genre, (counts.get(b.genre) ?? 0) + 1)
    return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [books])
  // раз в сутки подсказываем новую книгу из тех, что ещё не начинали
  const suggestion = useMemo(() => {
    const fresh = books.filter((b) => b.progress === 0)
    if (!fresh.length) return null
    return fresh[Math.floor(Date.now() / 864e5) % fresh.length]
  }, [books])

  return (
    <div className="screen">
      <header className="home-head">
        <div className="brand">
          <img src={resolveAsset('logo.png')} alt="WayBooks" className="brand-logo" />
          <div>
            <div className="brand-name">WayBooks</div>
            <div className="brand-tag">{t('Вай Библиотека')}</div>
          </div>
        </div>
        <button className="icon-btn" onClick={() => navigate({ name: 'add' })} aria-label={t('Добавить книгу')}>
          <IcPlus size={22} />
        </button>
      </header>
      <div className="brand-ornament" aria-hidden="true">
        <span className="line" />
        <span className="glyph">❖</span>
        <span className="line" />
      </div>

      {continueBook ? (
        <ContinueCard book={continueBook} label={t('Продолжить чтение')} onOpen={() => navigate({ name: 'reader', bookId: continueBook.id })} />
      ) : suggestion ? (
        <ContinueCard book={suggestion} label={t('Начать чтение')} onOpen={() => navigate({ name: 'reader', bookId: suggestion.id })} />
      ) : (
        <div className="empty-hero card">
          <div className="empty-hero-text">
            <div className="h2">{t('Здесь появится книга')}</div>
            <p className="muted" style={{ margin: '6px 0 0', fontSize: 14 }}>{t('Добавьте первую книгу, чтобы начать читать.')}</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate({ name: 'add' })}>
            <IcPlus size={20} /> {t('Добавить')}
          </button>
        </div>
      )}

      <Section title={t('Недавно добавленные')} onAll={() => navigate({ name: 'library' })}>
        <Shelf books={recent} meta={(b) => timeAgo(b.addedAt)} onOpen={(b) => navigate({ name: 'book', bookId: b.id })} />
      </Section>

      {favorites.length > 0 && (
        <Section title={t('Избранное')}>
          <Shelf books={favorites} meta={(b) => b.author} onOpen={(b) => navigate({ name: 'book', bookId: b.id })} />
        </Section>
      )}

      <Section title={t('Жанры')}>
        <div className="genre-wrap">
          {genres.map(([g, n]) => (
            <button key={g} className="chip" onClick={() => navigate({ name: 'search', genre: g })}>
              {g}
              <span className="chip-count">{n}</span>
            </button>
          ))}
        </div>
      </Section>
    </div>
  )
}

function ContinueCard({ book, label, onOpen }: { book: Book; label: string; onOpen: () => void }) {
  const pct = Math.round(book.progress * 100)
  const chapter = book.chapters[book.chapterIndex]?.title || book.chapters[0]?.title || ''
  return (
    <div className="continue-card" onClick={onOpen}>
      <div className="continue-bg" style={{ ['--hue' as string]: String(book.coverHue) }}>
        {book.cover && <img src={resolveAsset(book.cover)} alt="" className="continue-bg-img" />}
      </div>
      <div className="continue-inner">
        <BookCover book={book} width={86} height={124} />
        <div className="continue-info">
          <div className="continue-label">{label}</div>
          <div className="continue-title">{book.title}</div>
          <div className="continue-chapter">{chapter}</div>
          <div style={{ margin: '12px 0 10px' }}>
            <ProgressBar value={book.progress} />
          </div>
          <div className="row-between">
            <span className="continue-pct">{pct}% · {t('{n} стр. осталось', { n: book.pages - Math.round(book.progress * book.pages) })}</span>
            <span className="continue-play">
              <IcPlay size={16} /> {t('Читать')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children, onAll }: { title: string; children: React.ReactNode; onAll?: () => void }) {
  return (
    <section className="home-section">
      <div className="row-between" style={{ padding: '0 20px', marginBottom: 12 }}>
        <h2 className="section-title">{title}</h2>
        {onAll && (
          <button className="see-all" onClick={onAll}>
            {t('Смотреть все')} <IcChevron size={15} />
          </button>
        )}
      </div>
      {children}
    </section>
  )
}
