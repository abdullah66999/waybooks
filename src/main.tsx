import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/fonts.css'
import './styles/global.css'
import './styles/screens.css'

if ('serviceWorker' in navigator && typeof window !== 'undefined' && !window.location.protocol.startsWith('capacitor')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {})
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
