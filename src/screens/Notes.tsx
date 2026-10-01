import { useMemo } from 'react'
import { timeAgo, useStore } from '../lib/store'
import { notesWord, t } from '../lib/i18n'
import { BookCover } from '../components/common'
import { IcChevron } from '../components/icons'

export default function Notes() {
  const { books, navigate } = useStore()
  const groups = useMemo(
    () =>
      books
        .filter((b) => b.notes.length)
        .map((b) => ({ b, last: Math.max(...b.notes.map((n) => n.createdAt)) }))
        .sort((x, y) => y.last - x.last),
    [books],
  )
  const total = groups.reduce((s, g) => s + g.b.notes.length, 0)

  return (
    <div className="screen">
      <header className="row-between" style={{ marginBottom: 16 }}>
        <h1 className="h1">{t('Мои заметки')}</h1>
        {!!total && <span className="muted note-total">{total}</span>}
      </header>

      {!groups.length ? (
        <div className="empty-block card">
          <div className="h2" style={{ marginBottom: 6 }}>{t('Заметок пока нет')}</div>
          <p className="muted" style={{ fontSize: 14, margin: 0 }}>
            {t('Откройте книгу, зажмите пальцем слово в тексте и протяните на нужную фразу — цитаты соберутся здесь по книгам.')}
          </p>
        </div>
      ) : (
        <div className="note-groups">
          {groups.map(({ b, last }) => (
            <button key={b.id} className="note-group card" onClick={() => navigate({ name: 'bookNotes', bookId: b.id })}>
              <BookCover book={b} width={46} height={68} radius={9} />
              <span className="note-group-body">
                <span className="note-group-title">{b.title}</span>
                <span className="note-group-author">{b.author}</span>
                <span className="note-group-meta">
                  <b>{notesWord(b.notes.length)}</b> · {t('последняя')} {timeAgo(last)}
                </span>
              </span>
              <IcChevron size={18} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
