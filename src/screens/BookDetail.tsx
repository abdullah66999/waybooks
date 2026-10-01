import { useState } from 'react'
import { formatSize, useStore } from '../lib/store'
import { BookCover, ProgressBar, Sheet, Toast } from '../components/common'
import { IcBack, IcCheck, IcClock, IcDots, IcEdit, IcPlay, IcRefresh, IcStar, IcTrash } from '../components/icons'
import { FORMAT_LABEL } from '../lib/format'
import { chapterWord, t } from '../lib/i18n'
import { readStatus } from '../types'

export default function BookDetail() {
  const { route, books, navigate, updateBook, removeBook } = useStore()
  const book = books.find((b) => b.id === route.bookId)
  const [menu, setMenu] = useState(false)
  const [edit, setEdit] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [form, setForm] = useState({ title: book?.title ?? '', author: book?.author ?? '', genre: book?.genre ?? '', description: book?.description ?? '' })

  if (!book) {
    return (
      <div className="screen">
        <p className="muted">{t('Книга не найдена.')}</p>
      </div>
    )
  }

  const pct = Math.round(book.progress * 100)
  const st = readStatus(book)

  function notify(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 1800)
  }

  function startEdit() {
    setForm({ title: book!.title, author: book!.author, genre: book!.genre, description: book!.description })
    setEdit(true)
    setMenu(false)
  }

  return (
    <>
      <div className="screen detail-screen">
      <header className="detail-topbar">
        <button className="icon-btn" onClick={() => navigate({ name: 'library' })}>
          <IcBack />
        </button>
        <div style={{ flex: 1 }} />
        <button className="icon-btn" onClick={() => updateBook(book.id, (b) => ({ favorite: !b.favorite }))} style={{ color: book.favorite ? '#ffd166' : undefined }}>
          <IcStar size={20} filled={book.favorite} />
        </button>
        <button className="icon-btn" onClick={() => setMenu(true)}>
          <IcDots size={20} />
        </button>
      </header>

      <div className="detail-hero">
        <BookCover book={book} width={168} height={242} radius={20} />
      </div>

      <h1 className="detail-title">{book.title}</h1>
      <div className="detail-author">{book.author}</div>

      <div className="detail-meta">
        <span className="badge">{FORMAT_LABEL[book.format]}</span>
        <span className="badge">{formatSize(book.fileSize)}</span>
        <span className="badge">{chapterWord(book.chapters.length)}</span>
        {book.genre && <span className="badge">{book.genre}</span>}
        {book.subgenre && <span className="badge badge-sub">{book.subgenre}</span>}
      </div>

      {book.description && <p className="detail-desc">{book.description}</p>}
      {book.source && <div className="detail-source">{t('Источник текста: {x}', { x: book.source })}</div>}

      {book.progress > 0 && (
        <div className="detail-progress card">
          <div className="row-between" style={{ marginBottom: 8 }}>
            <span className="muted" style={{ fontSize: 13 }}>{t('Прогресс чтения')}</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{pct}%</span>
          </div>
          <ProgressBar value={book.progress} />
          <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
            {t('Глава {n}: {title}', { n: book.chapterIndex + 1, title: book.chapters[book.chapterIndex]?.title })}
          </div>
        </div>
      )}

      <div className="detail-actions">
        <button className="btn btn-light" style={{ width: '100%' }} onClick={() => navigate({ name: 'reader', bookId: book.id })}>
          <IcPlay size={18} /> {book.progress > 0 ? t('Продолжить') : t('Читать')}
        </button>
      </div>

      {/* полка: «хочу прочитать» и «прочитано» — начатая книга попадает в «Читаю» сама, при открытии читалки */}
      <div className="detail-status">
        <button
          className={'status-btn' + (st === 'want' ? ' active' : '')}
          onClick={() => { const next = st === 'want' ? undefined : 'want'; updateBook(book.id, { status: next }); notify(t(next === 'want' ? 'Добавлено в «Хочу прочитать»' : 'Убрано из «Хочу прочитать»')) }}
        >
          <IcClock size={18} /> {t('Хочу прочитать')}
        </button>
        <button
          className={'status-btn' + (st === 'done' ? ' active' : '')}
          onClick={() => { const next = st === 'done' ? undefined : 'done'; updateBook(book.id, { status: next }); notify(t(next === 'done' ? 'Книга отмечена как прочитанная' : 'Снята отметка «Прочитано»')) }}
        >
          <IcCheck size={18} /> {t('Прочитано')}
        </button>
      </div>
    </div>

    {menu && (
      <Sheet onClose={() => setMenu(false)} title={t('Действия')}>
        <button className="menu-action" onClick={startEdit}>
          <IcEdit size={20} /> {t('Изменить метаданные')}
        </button>
        <button className="menu-action" onClick={() => { updateBook(book.id, { progress: 0, chapterIndex: 0, scrollPosition: 0, status: 'want' }); setMenu(false); notify(t('Прогресс сброшен')) }}>
          <IcRefresh size={20} /> {t('Сбросить прогресс')}
        </button>
        <button className="menu-action danger" onClick={() => { removeBook(book.id); navigate({ name: 'library' }) }}>
          <IcTrash size={20} /> {t('Удалить книгу')}
        </button>
      </Sheet>
    )}

    {edit && (
      <Sheet onClose={() => setEdit(false)} title={t('Метаданные')}>
        <label className="field"><span>{t('Название')}</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
        <label className="field"><span>{t('Автор')}</span><input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></label>
        <label className="field"><span>{t('Жанр')}</span><input value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} /></label>
        <label className="field"><span>{t('Описание')}</span><textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={() => { updateBook(book.id, form); setEdit(false); notify(t('Сохранено')) }}>
          {t('Сохранить')}
        </button>
      </Sheet>
    )}

    {toast && <Toast text={toast} />}
  </>
  )
}
