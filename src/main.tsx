/**
 * AmtsKlar — Österreichische Behördenbriefe sofort verstehen
 * Copyright © 2025-2026 STAR:HORIZON LTD
 * Alle Rechte vorbehalten. All rights reserved.
 *
 * Unauthorized copying, modification, distribution or use of this
 * software, via any medium, is strictly prohibited.
 * Proprietary and confidential.
 *
 * www.amtsklar.at | info@amtsklar.at
 */

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
