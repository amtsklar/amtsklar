import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { LangProvider } from './i18n/LangContext'
import { ErrorBoundary } from './components/ErrorBoundary'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LangProvider>
        <App />
      </LangProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
