import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { localeOf, notesWord, t } from '../lib/i18n'
import { BookCover, Sheet, Toast } from '../components/common'
import { IcBack, IcComment, IcTrash } from '../components/icons'
import type { Note } from '../types'

const day = (ts: number) => new Date(ts).toLocaleDateString(localeOf(), { day: 'numeric', month: 'long' })

export default function BookNotes() {
  const { route, books, navigate, updateBook } = useStore()
  const book = books.find((b) => b.id === route.bookId)
  const notes = useMemo(() => [...(book?.notes ?? [])].sort((a, b) => b.createdAt - a.createdAt), [book])
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const notify = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  if (!book)
    return (
      <div className="screen">
        <p className="muted">{t('Книга не найдена.')}</p>
      </div>
    )

  function open(chapterIndex: number, page: number) {
    // читалка открывается с сохранённой позиции — поэтому позицию ставим прямо перед переходом
    updateBook(book!.id, () => ({ chapterIndex, scrollPosition: page }))
    navigate({ name: 'reader', bookId: book!.id })
  }

  function startComment(note: Note) {
    setEditingNote(note)
    setCommentDraft(note.comment ?? '')
  }

  function saveComment() {
    if (!editingNote) return
    const text = commentDraft.trim()
    updateBook(book!.id, (b) => ({
      notes: b.notes.map((n) => (n.id === editingNote.id ? { ...n, comment: text || undefined } : n)),
    }))
    setEditingNote(null)
    notify(text ? t('Комментарий сохранён') : t('Комментарий удалён'))
  }

  function deleteComment() {
    if (!editingNote) return
    updateBook(book!.id, (b) => ({
      notes: b.notes.map((n) => (n.id === editingNote.id ? { ...n, comment: undefined } : n)),
    }))
    setEditingNote(null)
    notify(t('Комментарий удалён'))
  }

  return (
    <div className="screen">
      <header className="detail-topbar">
        <button className="icon-btn" onClick={() => navigate({ name: 'notes' })}>
          <IcBack />
        </button>
        <div style={{ flex: 1 }} />
        <span className="muted note-total">{notesWord(notes.length)}</span>
      </header>

      <div className="note-book-head">
        <BookCover book={book} width={54} height={80} radius={10} />
        <div className="note-book-head-text">
          <div className="note-book-name">{book.title}</div>
          <div className="note-book-author">{book.author}</div>
        </div>
      </div>

      {!notes.length ? (
        <div className="empty-block card">
          <p className="muted" style={{ fontSize: 14, margin: 0 }}>{t('Заметок в этой книге больше нет.')}</p>
        </div>
      ) : (
        <div className="note-list">
          {notes.map((n) => (
            <article key={n.id} className="note-card card">
              <button className="note-open" onClick={() => open(n.chapterIndex, n.page)}>
                <p className="note-text">{n.text}</p>
                <div className="note-meta">
                  {n.chapterTitle || book.chapters[n.chapterIndex]?.title || t('Глава {n}', { n: n.chapterIndex + 1 })} · {t('стр. {n}', { n: n.page + 1 })} · {day(n.createdAt)}
                </div>
              </button>
              {n.comment && (
                <div className="note-comment-box" onClick={() => startComment(n)}>
                  <div className="note-comment-head">
                    <IcComment size={14} />
                    <span>{t('Комментарий')}</span>
                  </div>
                  <div className="note-comment-text">{n.comment}</div>
                </div>
              )}
              <footer className="note-card-foot">
                <button className="note-action-btn" onClick={() => startComment(n)}>
                  <IcComment size={15} />
                  <span>{n.comment ? t('Изменить комментарий') : t('Комментировать')}</span>
                </button>
                <button className="note-del" onClick={() => updateBook(book.id, (x) => ({ notes: x.notes.filter((y) => y.id !== n.id) }))} aria-label={t('Удалить заметку')}>
                  <IcTrash size={15} />
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}

      {editingNote && (
        <Sheet onClose={() => setEditingNote(null)} title={t('Комментарий к заметке')}>
          <div className="note-comment-quote-preview">
            “{editingNote.text}”
          </div>
          <textarea
            className="note-input"
            rows={4}
            value={commentDraft}
            placeholder={t('Напишите свои мысли или комментарий…')}
            onChange={(e) => setCommentDraft(e.target.value)}
            autoFocus
          />
          <div className="note-sheet-actions">
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveComment}>
              {t('Сохранить')}
            </button>
            {editingNote.comment && (
              <button className="btn btn-danger-outline" onClick={deleteComment}>
                {t('Удалить комментарий')}
              </button>
            )}
          </div>
        </Sheet>
      )}

      {toast && <Toast text={toast} />}
    </div>
  )
}
