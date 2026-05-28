import { lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Analyse from './pages/Analyse';

// Legal pages lazy-loaded — only downloaded when visited
const Impressum  = lazy(() => import('./pages/legal/Impressum'));
const Datenschutz = lazy(() => import('./pages/legal/Datenschutz'));
const AGB        = lazy(() => import('./pages/legal/AGB'));

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"           element={<Landing />} />
        <Route path="/analyse"    element={<Analyse />} />
        <Route path="/impressum"  element={<Impressum />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
        <Route path="/agb"        element={<AGB />} />
        <Route path="*"           element={<Landing />} />
      </Routes>
    </BrowserRouter>
  );
}
