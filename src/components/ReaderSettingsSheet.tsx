import type { ReaderSettings } from '../types'
import { FONT_OPTIONS } from '../types'
import { PAGE_THEMES } from '../lib/themes'
import { t } from '../lib/i18n'
import { IcAlignC, IcAlignJ, IcAlignL, IcSun } from './icons'

interface Props {
  value: ReaderSettings
  onChange: (patch: Partial<ReaderSettings>) => void
  preview?: boolean
}

export default function ReaderSettingsSheet({ value, onChange, preview }: Props) {
  return (
    <div className={'reader-settings' + (preview ? ' preview-mode' : '')}>
      {/* Font size */}
      <Group label={t('Размер шрифта')}>
        <div className="fs-row">
          <span className="fs-a-small">Aa</span>
          <input
            type="range"
            min={14}
            max={30}
            step={1}
            value={value.fontSize}
            onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
          />
          <span className="fs-a-large">Aa</span>
          <output className="fs-val">{value.fontSize} px</output>
        </div>
      </Group>

      {/* Font family */}
      <Group label={t('Шрифт')}>
        <div className="font-row">
          {FONT_OPTIONS.map((f) => (
            <button
              key={f.key}
              className={'font-pill' + (value.fontFamily === f.key ? ' active' : '')}
              style={{ fontFamily: f.stack }}
              onClick={() => onChange({ fontFamily: f.key })}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Group>

      {/* Line height */}
      <Group label={t('Межстрочный интервал')}>
        <div className="trio">
          {[
            { v: 1.35, lines: 3, gap: 3 },
            { v: 1.65, lines: 3, gap: 6 },
            { v: 2.0, lines: 3, gap: 9 },
          ].map((o, i) => (
            <button key={i} className={'seg' + (near(value.lineHeight, o.v) ? ' active' : '')} onClick={() => onChange({ lineHeight: o.v })}>
              <span className="lines-demo" style={{ ['--gap' as string]: `${o.gap}px` }}>
                <i /><i /><i />
              </span>
            </button>
          ))}
        </div>
      </Group>

      {/* Paragraph spacing */}
      <Group label={t('Интервал между абзацами')}>
        <div className="trio">
          {[
            { v: 0.3, gap: 4 },
            { v: 0.9, gap: 9 },
            { v: 1.6, gap: 15 },
          ].map((o, i) => (
            <button key={i} className={'seg' + (near(value.paragraphSpacing, o.v) ? ' active' : '')} onClick={() => onChange({ paragraphSpacing: o.v })}>
              <span className="para-demo" style={{ ['--gap' as string]: `${o.gap}px` }}>
                <i /><i />
              </span>
            </button>
          ))}
        </div>
      </Group>

      {/* Alignment */}
      <Group label={t('Выравнивание')}>
        <div className="trio">
          <AlignBtn active={value.alignment === 'left'} onClick={() => onChange({ alignment: 'left' })} icon={<IcAlignL size={22} />} />
          <AlignBtn active={value.alignment === 'center'} onClick={() => onChange({ alignment: 'center' })} icon={<IcAlignC size={22} />} />
          <AlignBtn active={value.alignment === 'justify'} onClick={() => onChange({ alignment: 'justify' })} icon={<IcAlignJ size={22} />} />
        </div>
      </Group>

      {/* Theme */}
      <Group label={t('Цвет фона')}>
        <div className="theme-row">
          {PAGE_THEMES.map((th) => (
            <button
              key={th.key}
              className={'theme-dot' + (value.theme === th.key ? ' active' : '')}
              style={{ background: th.swatch }}
              title={t(th.label)}
              onClick={() => onChange({ theme: th.key })}
            >
              {value.theme === th.key && <span className="theme-dot-check" />}
            </button>
          ))}
        </div>
      </Group>

      {/* Brightness */}
      <Group label={t('Яркость')}>
        <div className="bright-row">
          <IcSun size={18} />
          <input
            type="range"
            min={0.35}
            max={1}
            step={0.01}
            value={value.brightness}
            onChange={(e) => onChange({ brightness: Number(e.target.value) })}
          />
          <span className="bright-val">{Math.round(value.brightness * 100)}%</span>
        </div>
      </Group>
    </div>
  )
}

function AlignBtn({ active, onClick, icon }: { active: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button className={'seg' + (active ? ' active' : '')} onClick={onClick}>
      {icon}
    </button>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rs-group">
      <div className="rs-label">{label}</div>
      {children}
    </div>
  )
}

function near(a: number, b: number) {
  return Math.abs(a - b) < 0.09
}
