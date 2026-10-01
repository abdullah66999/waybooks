import type { ReaderTheme } from '../types'

export interface PageTheme {
  key: ReaderTheme
  label: string
  bg: string
  text: string
  dim: string
  swatch: string
}

// выбор оформления приложения убран (всегда тёмное), но страницы книги пользователь
// выбирает сам: белый, сепия и два тёмных фона — тёмно-серый и чёрный для OLED
export const PAGE_THEMES: PageTheme[] = [
  { key: 'light', label: 'Белый', bg: '#fdfdfd', text: '#1c1c22', dim: '#8a8a92', swatch: '#ffffff' },
  { key: 'sepia', label: 'Сепия', bg: '#f2e8d5', text: '#3d3428', dim: '#9a8a72', swatch: '#e8d9bd' },
  { key: 'dark', label: 'Тёмно-серый', bg: '#26262c', text: '#d9d9de', dim: '#77777f', swatch: '#3a3a42' },
  { key: 'black', label: 'Чёрный (OLED)', bg: '#000000', text: '#c9c9cf', dim: '#5f5f68', swatch: '#000000' },
]

export function themeOf(t: ReaderTheme): PageTheme {
  return PAGE_THEMES.find((x) => x.key === t) ?? PAGE_THEMES.find((x) => x.key === 'dark')!
}
