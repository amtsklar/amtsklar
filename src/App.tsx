import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Analyse from './pages/Analyse'
import Impressum from './pages/legal/Impressum'
import Datenschutz from './pages/legal/Datenschutz'
import AGB from './pages/legal/AGB'
import CookieBanner from './components/CookieBanner'
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
        <Route path="/vorlagen"    element={<Vorlagen />} />
        <Route path="*"            element={<Landing />} />
      </Routes>
    </BrowserRouter>
  )
}
