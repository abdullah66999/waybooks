import { StoreProvider, useStore } from './lib/store'
import { BottomNav } from './components/BottomNav'
import Home from './screens/Home'
import Library from './screens/Library'
import Notes from './screens/Notes'
import BookNotes from './screens/BookNotes'
import Search from './screens/Search'
import Settings from './screens/Settings'
import AddBook from './screens/AddBook'
import BookDetail from './screens/BookDetail'
import Reader from './screens/Reader'
import { t } from './lib/i18n'
import { resolveAsset } from './lib/resolveAsset'

function Shell() {
  const { ready, route } = useStore()
  if (!ready)
    return (
      <div className="app-frame" style={{ display: 'grid', placeItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <img src={resolveAsset('logo.png')} alt="WayBooks" className="splash-logo" style={{ objectFit: "contain" }} />
          <div className="muted" style={{ marginTop: 14, fontSize: 14 }}>{t('Загружаем библиотеку…')}</div>
        </div>
      </div>
    )

  const full = route.name === 'reader'
  return (
    <div className="app-frame">
      {route.name === 'home' && <Home />}
      {route.name === 'library' && <Library />}
      {route.name === 'notes' && <Notes />}
      {route.name === 'bookNotes' && <BookNotes />}
      {route.name === 'search' && <Search />}
      {route.name === 'settings' && <Settings />}
      {route.name === 'add' && <AddBook />}
      {route.name === 'book' && <BookDetail />}
      {route.name === 'reader' && <Reader />}
      {!full && <BottomNav />}
      <div id="sheet-portal" />
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
