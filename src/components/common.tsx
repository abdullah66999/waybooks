import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { Book } from '../types'
import { gradientCover } from '../lib/cover'
import { t } from '../lib/i18n'

export function BookCover({ book, width, height, radius = 14 }: { book: Book; width: number; height: number; radius?: number }) {
  const style: React.CSSProperties = { width, height, borderRadius: radius }
  if (book.cover) {
    return (
      <div className="cover" style={style}>
        <img src={book.cover} alt={book.title} />
      </div>
    )
  }
  return (
    <div className="cover" style={{ ...style, background: gradientCover(book.id + book.title) }}>
      <div className="cover-gen" style={{ padding: Math.max(8, width * 0.09) }}>
        <span style={{ fontSize: Math.max(8, width * 0.075), letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8 }}>
          {book.author.split(' ')[0] || ''}
        </span>
        <b style={{ fontSize: Math.max(10, width * 0.115) }}>{book.title}</b>
      </div>
    </div>
  )
}

export function Sheet({ onClose, children, title }: { onClose: () => void; children: ReactNode; title?: string }) {
  const [container, setContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setContainer((document.getElementById('sheet-portal') || document.querySelector('.app-frame') || document.body) as HTMLElement | null)
  }, [])

  const content = (
    <div className="sheet-root">
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="grabber" />
        {title && (
          <div className="row-between" style={{ marginBottom: 14 }}>
            <h3 className="h2">{title}</h3>
            <button className="icon-btn" onClick={onClose} aria-label={t('Закрыть')}>
              <CloseIcon />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )

  const target = container || (typeof document !== 'undefined' ? (document.getElementById('sheet-portal') || document.querySelector('.app-frame') || document.body) : null)
  return target ? createPortal(content, target) : content
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

export function Toast({ text }: { text: string }) {
  return <div className="toast">{text}</div>
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progress">
      <i style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  )
}
