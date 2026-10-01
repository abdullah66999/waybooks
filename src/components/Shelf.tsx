import { useEffect, useRef, useState } from 'react'
import type { Book } from '../types'
import { BookCover } from './common'

const GAP = 14
const MIN = 104
const SIDE = 20

export default function Shelf({ books, onOpen, meta }: { books: Book[]; onOpen: (b: Book) => void; meta: (b: Book) => string }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState({ cardW: MIN, extra: 0, visible: 0 })
  const [index, setIndex] = useState(0)
  const [dragDx, setDragDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const st = useRef({ x0: 0, lastX: 0, lastT: 0, v: 0, horiz: false, dx: 0 })

  // карточки подбираются так, чтобы в ряд вставало целое число полок без обрезанной пополам обложки;
  // остаток ширины делим поровну по краям, иначе у правой границы остаётся полоска следующей книги
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => {
      const inner = el.clientWidth - SIDE * 2
      const n = Math.max(2, Math.floor((inner + GAP) / (MIN + GAP)))
      const cardW = Math.max(MIN, Math.floor((inner - GAP * (n - 1)) / n))
      const used = n * cardW + (n - 1) * GAP
      setFit({ cardW, extra: Math.max(0, Math.floor((inner - used) / 2)), visible: n })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { cardW, extra, visible } = fit
  const step = cardW + GAP
  const maxIndex = () => Math.max(0, books.length - (visible || 1))

  const i = Math.min(index, maxIndex())
  let x = -i * step + (dragging ? dragDx : 0)
  const min = -maxIndex() * step
  if (x > 0) x = x * 0.35
  else if (x < min) x = min + (x - min) * 0.35

  const onDown = (e: React.PointerEvent) => {
    st.current = { x0: e.clientX, lastX: e.clientX, lastT: performance.now(), v: 0, horiz: false, dx: 0 }
    setDragDx(0)
    setDragging(true)
  }
  const onMove = (e: React.PointerEvent) => {
    if (!dragging) return
    const s = st.current
    const dx = e.clientX - s.x0
    if (!s.horiz) {
      if (Math.abs(dx) < 6) return
      s.horiz = true
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
    const now = performance.now()
    if (now - s.lastT > 0) s.v = (e.clientX - s.lastX) / (now - s.lastT)
    s.lastX = e.clientX
    s.lastT = now
    s.dx = dx
    setDragDx(dx)
  }
  const onUp = () => {
    if (!dragging) return
    setDragging(false)
    const s = st.current
    if (!s.horiz) return
    const projected = i - (s.dx + s.v * 60) / step
    setIndex(Math.max(0, Math.min(maxIndex(), Math.round(projected))))
    setDragDx(0)
  }

  return (
    <div
      ref={wrapRef}
      className={'shelf' + (dragging ? ' dragging' : '')}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onClickCapture={(e) => {
        if (st.current.horiz) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
    >
      <div
        className="shelf-track"
        style={{ gap: GAP, marginLeft: extra, transform: `translateX(${x}px)`, transition: dragging ? 'none' : 'transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)' }}
      >
        {books.map((b) => (
          <button key={b.id} className="shelf-item" style={{ width: cardW }} onClick={() => onOpen(b)}>
            <BookCover book={b} width={cardW} height={Math.round(cardW * 1.5)} />
            <div className="shelf-item-title">{b.title}</div>
            <div className="shelf-item-author">{meta(b)}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
