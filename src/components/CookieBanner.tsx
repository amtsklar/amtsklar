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

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../i18n/LangContext'

const COOKIE_TEXT: Record<string, string> = {
  de: 'AmtsKlar verwendet ausschließlich technisch notwendige Cookies für den Betrieb des Dienstes. Keine Werbung, kein Tracking.',
  en: 'AmtsKlar uses only technically necessary cookies for the operation of the service. No advertising, no tracking.',
  tr: 'AmtsKlar yalnızca hizmetin işleyişi için teknik olarak gerekli çerezler kullanır. Reklam yok, takip yok.',
  sr: 'AmtsKlar koristi isključivo tehnički neophodne kolačiće za rad servisa. Bez reklama, bez praćenja.',
  hr: 'AmtsKlar koristi isključivo tehnički neophodne kolačiće za rad servisa. Bez reklama, bez praćenja.',
  hu: 'Az AmtsKlar kizárólag a szolgáltatás működéséhez szükséges technikai sütiket használ. Sem hirdetés, sem nyomkövetés.',
  sl: 'AmtsKlar uporablja izključno tehnično potrebne piškotke za delovanje storitve. Brez oglaševanja, brez sledenja.',
  sk: 'AmtsKlar používa výlučne technicky nevyhnutné súbory cookie pre prevádzku služby. Žiadna reklama, žiadne sledovanie.',
  ro: 'AmtsKlar folosește exclusiv cookie-uri tehnic necesare pentru funcționarea serviciului. Fără reclame, fără urmărire.',
  pl: 'AmtsKlar używa wyłącznie technicznie niezbędnych plików cookie do działania usługi. Bez reklam, bez śledzenia.',
  ru: 'AmtsKlar использует исключительно технически необходимые файлы cookie для работы сервиса. Без рекламы, без отслеживания.',
  it: 'AmtsKlar utilizza esclusivamente cookie tecnicamente necessari per il funzionamento del servizio. Nessuna pubblicità, nessun tracciamento.',
}

const ACCEPT_TEXT: Record<string, string> = {
  de: 'Verstanden ✓', en: 'Got it ✓', tr: 'Anlaşıldı ✓',
  sr: 'Razumem ✓', hr: 'Razumijem ✓', hu: 'Értettem ✓',
  sl: 'Razumem ✓', sk: 'Rozumiem ✓', ro: 'Am înțeles ✓',
  pl: 'Rozumiem ✓', ru: 'Понятно ✓', it: 'Capito ✓',
}

const PRIVACY_TEXT: Record<string, string> = {
  de: 'Datenschutzerklärung', en: 'Privacy policy', tr: 'Gizlilik politikası',
  sr: 'Politika privatnosti', hr: 'Politika privatnosti', hu: 'Adatvédelmi nyilatkozat',
  sl: 'Politika zasebnosti', sk: 'Zásady ochrany údajov', ro: 'Politica de confidențialitate',
  pl: 'Polityka prywatności', ru: 'Политика конфиденциальности', it: 'Informativa sulla privacy',
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const { lang } = useLang()

  useEffect(() => {
    const accepted = localStorage.getItem('ak_cookies')
    if (!accepted) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem('ak_cookies', 'accepted')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
      background: '#0F2440', borderTop: '2px solid rgba(201,150,58,0.4)',
      padding: '16px 24px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
    }}>
      <div style={{ flex: 1, minWidth: 260 }}>
        <div style={{ fontSize: 14, color: '#C8D8EC', lineHeight: 1.6 }}>
          🍪 <strong style={{ color: '#EDF2FA' }}>{COOKIE_TEXT[lang] || COOKIE_TEXT.de}</strong>{' '}
          <Link to="/datenschutz" style={{ color: '#C9963A', textDecoration: 'underline' }}>
            {PRIVACY_TEXT[lang] || PRIVACY_TEXT.de}
          </Link>
        </div>
      </div>
      <button
        onClick={accept}
        style={{
          background: 'linear-gradient(135deg,#B8832A,#D4A84B)',
          color: '#0C1825', border: 'none', borderRadius: 10,
          padding: '10px 24px', fontSize: 14, fontWeight: 700,
          cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
        }}
      >
        {ACCEPT_TEXT[lang] || ACCEPT_TEXT.de}
      </button>
    </div>
  )
}
