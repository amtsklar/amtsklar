/**
 * AmtsKlar — Österreichische Behördenbriefe sofort verstehen
 * Copyright © 2025-2026 STAR:HORIZON LTD
 * Alle Rechte vorbehalten. All rights reserved.
 */

import { Link } from 'react-router-dom'
import { useLang } from '../i18n/LangContext'

const TEXTS: Record<string, { title: string; sub: string; btn: string }> = {
  de: { title: 'Seite nicht gefunden', sub: 'Diese Seite existiert nicht oder wurde verschoben.', btn: '← Zur Startseite' },
  en: { title: 'Page not found', sub: 'This page does not exist or has been moved.', btn: '← Back to home' },
  tr: { title: 'Sayfa bulunamadı', sub: 'Bu sayfa mevcut değil veya taşındı.', btn: '← Ana sayfaya dön' },
  sr: { title: 'Stranica nije pronađena', sub: 'Ova stranica ne postoji ili je premještena.', btn: '← Na početnu stranicu' },
  hr: { title: 'Stranica nije pronađena', sub: 'Ova stranica ne postoji ili je premještena.', btn: '← Na početnu stranicu' },
  hu: { title: 'Az oldal nem található', sub: 'Ez az oldal nem létezik vagy áthelyezték.', btn: '← Vissza a főoldalra' },
  sl: { title: 'Stran ni najdena', sub: 'Ta stran ne obstaja ali je bila premaknjena.', btn: '← Na začetno stran' },
  sk: { title: 'Stránka nenájdená', sub: 'Táto stránka neexistuje alebo bola presunutá.', btn: '← Na hlavnú stránku' },
  ro: { title: 'Pagina nu a fost găsită', sub: 'Această pagină nu există sau a fost mutată.', btn: '← Înapoi la pagina principală' },
  pl: { title: 'Strona nie znaleziona', sub: 'Ta strona nie istnieje lub została przeniesiona.', btn: '← Powrót do strony głównej' },
  ru: { title: 'Страница не найдена', sub: 'Эта страница не существует или была перемещена.', btn: '← На главную страницу' },
  it: { title: 'Pagina non trovata', sub: 'Questa pagina non esiste o è stata spostata.', btn: '← Torna alla pagina principale' },
}

export default function NotFound() {
  const { lang } = useLang()
  const t = TEXTS[lang] || TEXTS.de

  return (
    <div style={{
      background: '#EEF4FB', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: '#FFFFFF', border: '1.5px solid #C5D8ED',
        borderRadius: 16, padding: '48px 32px', maxWidth: 480,
        textAlign: 'center', boxShadow: '0 4px 24px rgba(15,36,64,0.08)',
      }}>
        <div style={{
          fontFamily: 'Libre Baskerville,serif',
          fontSize: 72, fontWeight: 700, color: '#C5D8ED',
          lineHeight: 1, marginBottom: 16,
        }}>404</div>

        <div style={{
          fontFamily: 'Libre Baskerville,serif',
          fontSize: 22, fontWeight: 700, color: '#0F2440', marginBottom: 12,
        }}>
          {t.title}
        </div>

        <p style={{ fontSize: 15, color: '#2A5080', lineHeight: 1.7, marginBottom: 32 }}>
          {t.sub}
        </p>

        <Link to="/" style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg,#B8832A,#D4A84B)',
          color: '#FFFFFF', borderRadius: 12,
          padding: '13px 28px', fontSize: 15, fontWeight: 700,
          textDecoration: 'none',
        }}>
          {t.btn}
        </Link>

        <div style={{ marginTop: 24 }}>
          <Link to="/analyse" style={{ fontSize: 13, color: '#6A8AAA', textDecoration: 'none' }}>
            {lang === 'de' ? 'Brief analysieren →' :
             lang === 'en' ? 'Analyse letter →' :
             lang === 'tr' ? 'Mektubu analiz et →' : 'Brief analysieren →'}
          </Link>
        </div>
      </div>
    </div>
  )
}
