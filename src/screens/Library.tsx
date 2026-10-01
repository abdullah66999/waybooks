import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { readStatus, type ReadStatus } from '../types'
import { BookCover, ProgressBar } from '../components/common'
import { IcPlus } from '../components/icons'
import { FORMAT_LABEL } from '../lib/format'
import { t } from '../lib/i18n'

const TABS: { key: ReadStatus; label: string }[] = [
  { key: 'reading', label: 'Читаю' },
  { key: 'want', label: 'Хочу прочитать' },
  { key: 'done', label: 'Прочитал' },
]

// выбранная полка живёт между перерисовками: зашёл в книгу и вернулся — не прыгаешь на «Читаю»
let lastTab: ReadStatus | null = null

export default function Library() {
  const { books, navigate } = useStore()
  const byStatus = useMemo(() => {
    const g: Record<ReadStatus, typeof books> = { reading: [], want: [], done: [] }
    for (const b of books) g[readStatus(b)].push(b)
    // начатое и дочитанное упорядочено по последнему касанию, «хочу прочитать» — по свежести
    g.reading.sort((a, b) => (b.lastOpenedAt ?? 0) - (a.lastOpenedAt ?? 0))
    g.done.sort((a, b) => (b.lastOpenedAt ?? 0) - (a.lastOpenedAt ?? 0))
    g.want.sort((a, b) => b.addedAt - a.addedAt)
    return g
  }, [books])
  // на чистой установке «Читаю» пуст, и первым показываем ту полку, где что-то есть
  const [tab, setTab] = useState<ReadStatus>(() => lastTab ?? TABS.find((x) => byStatus[x.key].length)?.key ?? 'want')
  const list = byStatus[tab]
  const choose = (k: ReadStatus) => {
    lastTab = k
    setTab(k)
  }

  return (
    <>
      <div className="screen">
      <div className="lib-tabs" role="tablist">
        {TABS.map((x) => (
          <button
            key={x.key}
            role="tab"
            aria-selected={tab === x.key}
            className={'chip' + (tab === x.key ? ' active' : '')}
            onClick={() => choose(x.key)}
          >
            {t(x.label)}
            <span className="chip-count">{byStatus[x.key].length}</span>
          </button>
        ))}
      </div>

      <div className="lib-list">
        {list.map((b) => {
            const lastPage = Math.max(1, Math.round(b.progress * b.pages))
            const done = readStatus(b) === 'done'
            return (
              <button key={b.id} className="lib-row" onClick={() => navigate({ name: 'book', bookId: b.id })}>
                <BookCover book={b} width={54} height={76} radius={10} />
                <div className="lib-row-body">
                  <div className="lib-row-title">{b.title}</div>
                  <div className="lib-row-author">
                    {b.author}
                    {b.format !== 'txt' && <span className="lib-row-format">{FORMAT_LABEL[b.format]}</span>}
                  </div>
                  {b.progress > 0 ? (
                    <div className="lib-row-progress">
                      <ProgressBar value={b.progress} />
                      <span className="lib-row-pct">{done ? t('Прочитано') : Math.round(b.progress * 100) + '%'}</span>
                    </div>
                  ) : (
                    <span className="pill">{t('К прочтению')}</span>
                  )}
                  {b.progress > 0 && !done && <div className="lib-row-page">{t('стр. {n} из {total}', { n: lastPage, total: b.pages })}</div>}
                </div>
              </button>
            )
          })}
        {!list.length && (
          <div className="empty-block card">
            <div className="h2" style={{ marginBottom: 6 }}>{t('Здесь пока пусто')}</div>
            <p className="muted" style={{ fontSize: 14, margin: 0 }}>
              {tab === 'reading'
                ? t('Откройте любую книгу — она появится в «Читаю».')
                : tab === 'done'
                  ? t('Дочитанная книга сама перейдёт в «Прочитал».')
                  : t('Нажмите «+», чтобы добавить книгу.')}
            </p>
          </div>
        )}
      </div>
    </div>

    <button className="fab" onClick={() => navigate({ name: 'add' })} aria-label={t('Добавить книгу')}>
      <IcPlus size={26} />
    </button>
  </>
  )
}
