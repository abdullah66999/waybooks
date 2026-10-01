interface P {
  size?: number
  filled?: boolean
}

const wrap = (size = 24) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const })

export const IcHome = ({ size, filled }: P) => (
  <svg {...wrap(size)} fill={filled ? 'currentColor' : 'none'}>
    <path d="M3 10.5 12 3l9 7.5" fill="none" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" fill={filled ? 'currentColor' : 'none'} />
  </svg>
)
export const IcBooks = ({ size, filled }: P) => (
  <svg {...wrap(size)} fill={filled ? 'currentColor' : 'none'}>
    <path d="M4 5a2 2 0 0 1 2-2h3v18H6a2 2 0 0 1-2-2V5Z" />
    <path d="M15 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" />
    <path d="M9 3h6" fill="none" stroke="currentColor" />
  </svg>
)
export const IcSearch = (p: P) => (
  <svg {...wrap(p.size)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)
export const IcGear = (p: P) => (
  <svg {...wrap(p.size)}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9c.27.6.85 1 1.56 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1Z" />
  </svg>
)
export const IcBack = (p: P) => (
  <svg {...wrap(p.size)}>
    <path d="m15 5-7 7 7 7" />
  </svg>
)
export const IcClose = (p: P) => (
  <svg {...wrap(p.size)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)
export const IcPlus = (p: P) => (
  <svg {...wrap(p.size ?? 26)}>
    <path d="M12 5v14M5 12h14" strokeWidth={2.2} />
  </svg>
)
export const IcBookmark = ({ size, filled }: P) => (
  <svg {...wrap(size)} fill={filled ? 'currentColor' : 'none'}>
    <path d="M6 3h12v18l-6-4.5L6 21V3Z" />
  </svg>
)
export const IcDots = (p: P) => (
  <svg {...wrap(p.size)} fill="currentColor" stroke="none">
    <circle cx="12" cy="5" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="12" cy="19" r="1.7" />
  </svg>
)
export const IcDownload = (p: P) => (
  <svg {...wrap(p.size)}>
    <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
    <path d="M4 19h16" />
  </svg>
)
export const IcUpload = (p: P) => (
  <svg {...wrap(p.size ?? 40)}>
    <path d="M12 16V4m0 0 4 4m-4-4L8 8" />
    <path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
  </svg>
)
export const IcTrash = (p: P) => (
  <svg {...wrap(p.size)}>
    <path d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13" />
  </svg>
)
export const IcClock = (p: P) => (
  <svg {...wrap(p.size)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </svg>
)
export const IcStar = ({ size, filled }: P) => (
  <svg {...wrap(size)} fill={filled ? 'currentColor' : 'none'}>
    <path d="m12 3 2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 17l-5.6 3 1.3-6.2L3 9.5l6.3-.7L12 3Z" />
  </svg>
)
export const IcChevron = (p: P) => (
  <svg {...wrap(p.size)}>
    <path d="m9 5 7 7-7 7" />
  </svg>
)
export const IcToc = (p: P) => (
  <svg {...wrap(p.size)}>
    <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
  </svg>
)
export const IcText = (p: P) => (
  <svg {...wrap(p.size)}>
    <path d="M4 7V5h16v2M12 5v14m-3 0h6" />
  </svg>
)
export const IcSun = (p: P) => (
  <svg {...wrap(p.size)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
)
export const IcCloud = (p: P) => (
  <svg {...wrap(p.size ?? 28)}>
    <path d="M7 18a4.5 4.5 0 1 1 .8-8.9A6 6 0 0 1 19 10.5 3.75 3.75 0 0 1 18.5 18H7Z" />
    <path d="M12 15v-5m0 0-2 2m2-2 2 2" />
  </svg>
)
export const IcLink = (p: P) => (
  <svg {...wrap(p.size ?? 28)}>
    <path d="M10 14a4.5 4.5 0 0 0 6.6.4l2.7-2.7a4.5 4.5 0 0 0-6.4-6.4l-1.5 1.5" />
    <path d="M14 10a4.5 4.5 0 0 0-6.6-.4L4.7 12.3a4.5 4.5 0 0 0 6.4 6.4l1.5-1.5" />
  </svg>
)
export const IcScan = (p: P) => (
  <svg {...wrap(p.size ?? 28)}>
    <path d="M4 8V5a1 1 0 0 1 1-1h3m8 0h3a1 1 0 0 1 1 1v3m0 8v3a1 1 0 0 1-1 1h-3m-8 0H5a1 1 0 0 1-1-1v-3" />
    <path d="M4 12h16" />
  </svg>
)
export const IcPlay = (p: P) => (
  <svg {...wrap(p.size)} fill="currentColor" stroke="none">
    <path d="M8 5.5v13l11-6.5-11-6.5Z" />
  </svg>
)
export const IcEdit = (p: P) => (
  <svg {...wrap(p.size)}>
    <path d="M4 20h4L20 8l-4-4L4 16v4Z" />
  </svg>
)
export const IcRefresh = (p: P) => (
  <svg {...wrap(p.size)}>
    <path d="M20 11a8 8 0 1 0-2.3 6.3" />
    <path d="M20 4v7h-7" />
  </svg>
)
export const IcCheck = (p: P) => (
  <svg {...wrap(p.size)}>
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
)
export const IcAlignL = (p: P) => (
  <svg {...wrap(p.size)}>
    <path d="M4 6h16M4 10h10M4 14h16M4 18h10" />
  </svg>
)
export const IcAlignC = (p: P) => (
  <svg {...wrap(p.size)}>
    <path d="M4 6h16M7 10h10M4 14h16M7 18h10" />
  </svg>
)
export const IcAlignJ = (p: P) => (
  <svg {...wrap(p.size)}>
    <path d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
)
export const IcLock = (p: P) => (
  <svg {...wrap(p.size)}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
)
export const IcComment = (p: P) => (
  <svg {...wrap(p.size)}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

