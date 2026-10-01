import { useRef, useState } from 'react'
import { useStore } from '../lib/store'
import { importFileToBook } from '../lib/importBook'
import { IcBack, IcCheck, IcCloud, IcLink, IcScan, IcUpload } from '../components/icons'
import { Toast } from '../components/common'
import { t } from '../lib/i18n'

export default function AddBook() {
  const { navigate, addBook } = useStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files)
    if (!list.length) return
    setBusy(true)
    setError(null)
    let ok = 0
    for (const f of list) {
      try {
        const book = await importFileToBook(f)
        addBook(book)
        ok++
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Не удалось импортировать файл')
      }
    }
    setBusy(false)
    if (ok) {
      setToast(ok === 1 ? t('Книга добавлена в библиотеку') : t('Добавлено книг: {n}', { n: ok }))
      setTimeout(() => navigate({ name: 'library' }), 900)
    }
  }

  return (
    <div className="screen" style={{ paddingTop: 'calc(14px + var(--safe-top))' }}>
      <header className="detail-topbar">
        <button className="icon-btn" onClick={() => navigate({ name: 'library' })}>
          <IcBack />
        </button>
        <h1 className="h2">{t('Добавить книгу')}</h1>
        <span style={{ width: 40 }} />
      </header>

      <div
        className={'dropzone' + (drag ? ' drag' : '')}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          void handleFiles(e.dataTransfer.files)
        }}
      >
        <div className="dropzone-icon">
          <IcUpload size={40} />
        </div>
        <div className="h2" style={{ marginTop: 18 }}>{t('Загрузите файл книги')}</div>
        <div className="muted" style={{ fontSize: 14, marginTop: 6 }}>EPUB, FB2, TXT, PDF</div>
        <button className="btn btn-light" style={{ marginTop: 22 }} onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}>
          {busy ? t('Импорт…') : t('Выбрать файл')}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".epub,.fb2,.txt,.pdf"
          multiple
          hidden
          onChange={(e) => e.target.files && void handleFiles(e.target.files)}
        />
      </div>

      {error && <div className="import-error">{t(error)}</div>}

      <h3 className="section-title" style={{ margin: '26px 2px 10px' }}>{t('Также можно')}</h3>
      <div className="add-options">
        <OptionRow icon={<IcCloud />} title={t('Открыть с устройства')} subtitle={t('Файловый менеджер телефона')} onClick={() => inputRef.current?.click()} />
        <OptionRow icon={<IcLink />} title={t('По локальному пути')} subtitle={t('Открыть книгу из папки устройства')} onClick={() => inputRef.current?.click()} />
        <OptionRow icon={<IcScan />} title={t('Отсканировать текст')} subtitle={t('Распознавание текста с фото (скоро)')} disabled />
      </div>

      <p className="muted add-note">
        <IcCheck size={16} /> {t('Все книги хранятся только на вашем устройстве. Аккаунт и интернет не требуются.')}
      </p>

      {toast && <Toast text={toast} />}
    </div>
  )
}

function OptionRow({ icon, title, subtitle, onClick, disabled }: { icon: React.ReactNode; title: string; subtitle: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button className="option-row card" onClick={disabled ? undefined : onClick} style={{ opacity: disabled ? 0.5 : 1 }}>
      <span className="option-icon">{icon}</span>
      <span className="option-body">
        <b>{title}</b>
        <span>{subtitle}</span>
      </span>
      <span className="option-arrow">›</span>
    </button>
  )
}
