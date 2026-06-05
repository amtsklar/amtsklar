/**
 * AmtsKlar — Österreichische Behördenbriefe sofort verstehen
 * Copyright © 2025-2026 STAR:HORIZON LTD
 * Alle Rechte vorbehalten. All rights reserved.
 *
 * Unauthorized copying, modification, distribution or use of this
 * software, via any medium, is strictly prohibited.
 * Proprietary and confidential.
 *
 * [www.amtsklar.at](https://www.amtsklar.at) | info@amtsklar.at
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Analyse from './pages/Analyse'
import Impressum from './pages/legal/Impressum'
import Datenschutz from './pages/legal/Datenschutz'
import AGB from './pages/legal/AGB'
import Widerruf from './pages/legal/Widerruf'
import CookieBanner from './components/CookieBanner'
import NotFound from './pages/NotFound'
import Vorlagen from './pages/Vorlagen'

export default function App() {
  return (
    <BrowserRouter>
      <CookieBanner />
      <Routes>
        <Route path="/"            element={<Landing />} />
        <Route path="/analyse"     element={<Analyse />} />
        <Route path="/impressum"   element={<Impressum />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
        <Route path="/agb"         element={<AGB />} />
        <Route path="/widerruf"    element={<Widerruf />} />
        <Route path="/vorlagen"    element={<Vorlagen />} />
        <Route path="*"            element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
