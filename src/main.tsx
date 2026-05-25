import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// SPA Routing: Pfad nach 404-Redirect wiederherstellen
const savedPath = sessionStorage.getItem('__ak_path')
if (savedPath) {
  sessionStorage.removeItem('__ak_path')
  window.history.replaceState(null, '', savedPath)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
