import { useState } from 'react'
import { useStore } from '../lib/store'
import { Sheet } from '../components/common'
import { IcChevron, IcCheck } from '../components/icons'
import ReaderSettingsSheet from '../components/ReaderSettingsSheet'
import { themeOf } from '../lib/themes'
import { LANGS, t } from '../lib/i18n'
import { bookWord } from '../lib/i18n'
import { FONT_OPTIONS, type Lang, type ReaderSettings } from '../types'

export default function Settings() {
  const { settings, setSettings, books, navigate } = useStore()
  const [sheet, setSheet] = useState<null | 'lang' | 'defaults'>(null)

  const dr = settings.defaultReader
  const fontLabel = FONT_OPTIONS.find((f) => f.key === dr.fontFamily)?.label ?? 'Literata'
  const readerSummary = `${dr.fontSize} px · ${fontLabel} · ${t(themeOf(dr.theme).label)}`
  const langLabel = LANGS.find((l) => l.v === settings.language)?.l ?? 'Русский'

  return (
    <>
      <div className="screen">
      <h1 className="h1" style={{ marginBottom: 20 }}>{t('Настройки')}</h1>

      <Caption>{t('Внешний вид')}</Caption>
      <div className="settings-group card">
        <Row title={t('Язык')} value={langLabel} onClick={() => setSheet('lang')} />
        <Row title={t('Чтение по умолчанию')} value={readerSummary} onClick={() => setSheet('defaults')} />
      </div>

      <Caption>{t('Библиотека')}</Caption>
      <div className="settings-group card">
        <Row title={t('Моя библиотека')} value={bookWord(books.length)} onClick={() => navigate({ name: 'library' })} />
        <Row title={t('Добавить книгу')} value="EPUB · FB2 · TXT · PDF" onClick={() => navigate({ name: 'add' })} />
      </div>

      <div className="settings-group card">
        <div className="about-block">
          <img src="/logo.png" alt="" className="about-logo" />
          <div>
            <b>WayBooks</b>
            <div className="muted" style={{ fontSize: 13 }}>{t('Версия')} 1.4</div>
          </div>
        </div>
      </div>
    </div>

      {sheet === 'lang' && (
        <ChoiceSheet title={t('Язык')} options={LANGS.map((l) => ({ v: l.v, l: l.l }))} current={settings.language} onPick={(v) => { setSettings({ language: v as Lang }); setSheet(null) }} onClose={() => setSheet(null)} />
      )}
      {sheet === 'defaults' && (
        <Sheet onClose={() => setSheet(null)} title={t('Чтение по умолчанию')}>
          <p className="sheet-hint">{t('Эти параметры применяются ко всем книгам, где вы не меняли чтение отдельно.')}</p>
          <ReaderSettingsSheetInline value={settings.defaultReader} onChange={(patch) => setSettings({ defaultReader: { ...settings.defaultReader, ...patch } })} />
        </Sheet>
      )}
    </>
  )
}

function Caption({ children }: { children: React.ReactNode }) {
  return <div className="settings-caption">{children}</div>
}

function Row({ title, value, onClick }: { title: string; value?: string; onClick?: () => void }) {
  return (
    <button className="settings-row" onClick={onClick}>
      <span>{title}</span>
      <span className="settings-row-right">
        {value && <em>{value}</em>}
        <IcChevron size={16} />
      </span>
    </button>
  )
}

function ChoiceSheet({ title, options, current, onPick, onClose }: { title: string; options: { v: string; l: string }[]; current: string; onPick: (v: string) => void; onClose: () => void }) {
  return (
    <Sheet onClose={onClose} title={title}>
      {options.map((o) => (
        <button key={o.v} className={'choice-row' + (current === o.v ? ' active' : '')} onClick={() => onPick(o.v)}>
          {o.l}
          {current === o.v && <IcCheck size={18} />}
        </button>
      ))}
    </Sheet>
  )
}

function ReaderSettingsSheetInline({ value, onChange }: { value: ReaderSettings; onChange: (p: Partial<ReaderSettings>) => void }) {
  return <ReaderSettingsSheet value={value} onChange={onChange} preview />
}
