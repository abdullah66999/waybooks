import { IcBooks, IcEdit, IcGear, IcHome, IcSearch } from './icons'
import { useStore } from '../lib/store'
import { t } from '../lib/i18n'
import type { Route } from '../lib/store'

const ITEMS: { name: Route['name']; label: string; icon: (p: { size?: number; filled?: boolean }) => JSX.Element }[] = [
  { name: 'home', label: 'Главная', icon: IcHome },
  { name: 'library', label: 'Мои книги', icon: IcBooks },
  { name: 'notes', label: 'Заметки', icon: IcEdit },
  { name: 'search', label: 'Поиск', icon: IcSearch },
  { name: 'settings', label: 'Настройки', icon: IcGear },
]

// заметки внутри книги — всё ещё вкладка «Заметки»: без этого подсветка таба гаснет при переходе
const TAB_OF: Partial<Record<Route['name'], Route['name']>> = { bookNotes: 'notes' }

export function BottomNav() {
  const { route, navigate } = useStore()
  const active = TAB_OF[route.name] ?? route.name
  return (
    <nav className="bottom-nav">
      {ITEMS.map(({ name, label, icon: Icon }) => (
        <button key={name} className={'nav-item' + (active === name ? ' active' : '')} onClick={() => navigate({ name })}>
          <Icon size={23} filled={active === name} />
          <span>{t(label)}</span>
        </button>
      ))}
    </nav>
  )
}
