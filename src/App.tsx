import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Analyse from './pages/Analyse'
import Impressum from './pages/legal/Impressum'
import Datenschutz from './pages/legal/Datenschutz'
import AGB from './pages/legal/AGB'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<Landing />} />
        <Route path="/analyse"     element={<Analyse />} />
        <Route path="/impressum"   element={<Impressum />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
        <Route path="/agb"         element={<AGB />} />
      </Routes>
    </BrowserRouter>
  )
}
