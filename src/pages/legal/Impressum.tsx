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

import { Link } from 'react-router-dom'

const S = {
  page: { background: '#EEF4FB', minHeight: '100vh', color: '#0F2440' },
  header: { padding: '14px 20px', borderBottom: '1px solid #C5D8ED', background: '#FFFFFF', boxShadow: '0 1px 12px rgba(15,36,64,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  inner: { maxWidth: 700, margin: '0 auto', padding: '40px 24px 80px' },
  h1: { fontFamily: 'Libre Baskerville,serif', fontSize: 30, fontWeight: 700, marginBottom: 32, color: '#0F2440' },
  h2: { fontFamily: 'Libre Baskerville,serif', fontSize: 18, fontWeight: 700, marginBottom: 12, marginTop: 28, color: '#0F2440' },
  p: { fontSize: 15, lineHeight: 1.8, color: '#2A5080', marginBottom: 12 },
  card: { background: '#FFFFFF', border: '1px solid #C5D8ED', borderRadius: 12, padding: '20px 24px', marginBottom: 16 },
}

export default function Impressum() {
  return (
    <div style={S.page}>
      <div style={S.header}>
        <Link to="/" style={{ fontFamily: 'Libre Baskerville,serif', fontSize: 19, fontWeight: 700, textDecoration: 'none' }}>
          <span style={{ color: '#0F2440' }}>Amts</span><span style={{ color: '#C9963A' }}>Klar</span>
        </Link>
        <Link to="/" style={{ fontSize: 14, color: '#2A5080', textDecoration: 'none' }}>← Zurück</Link>
      </div>
      <div style={S.inner}>
        <h1 style={S.h1}>Impressum</h1>

        <div style={S.card}>
          <h2 style={{ ...S.h2, marginTop: 0 }}>Betreiber</h2>
          <p style={S.p}>
            <strong>STAR:HORIZON LTD</strong><br />
            Wilson Business Park, Office 620<br />
            Manchester M40 8WN<br />
            England, United Kingdom
          </p>
          <p style={S.p}>
            <strong>Company Number:</strong> 13583376<br />
            <strong>Registered in England and Wales</strong><br />
            <a
              href="https://find-and-update.company-information.service.gov.uk/company/13583376"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#C9963A' }}
            >
              Companies House Eintrag →
            </a>
          </p>
          <p style={S.p}>
            <strong>Directors / Geschäftsführung:</strong><br />
            Philipp Bekik &amp; Doris Sturmberger
          </p>
          <p style={S.p}>
            E-Mail: <a href="mailto:info@amtsklar.at" style={{ color: '#C9963A' }}>info@amtsklar.at</a><br />
            Website: <a href="https://www.amtsklar.at" style={{ color: '#C9963A' }}>www.amtsklar.at</a>
          </p>
          <p style={S.p}>
            <strong>Unternehmensgegenstand:</strong> Betrieb eines Online-Informationsdienstes zur Erklärung österreichischer Behördenbriefe mittels KI-Technologie.
          </p>
          <p style={S.p}>
            <strong>Hinweis gemäß § 5 ECG (Österreich):</strong> Der Anbieter ist kein zugelassener Rechtsdienstleister. Die Inhalte stellen keine Rechtsberatung dar.
          </p>
        </div>

        <div style={S.card}>
          <h2 style={{ ...S.h2, marginTop: 0 }}>Zahlungsabwicklung</h2>
          <p style={S.p}>
            Die Zahlungsabwicklung erfolgt über <strong>Paddle.com Market Limited</strong> als Merchant of Record.<br />
            Paddle.com Market Limited, Judd House, 18-29 Mora Street, London, EC1V 8BT, Vereinigtes Königreich.<br />
            Paddle handelt als autorisierter Wiederverkäufer und Händler für AmtsKlar-Abonnements.
          </p>
        </div>

        <div style={S.card}>
          <h2 style={{ ...S.h2, marginTop: 0 }}>Technologie-Dienstleister</h2>
          <p style={S.p}>
            Die automatisierte Analyse wird durch <strong>Anthropic, PBC</strong> bereitgestellt.<br />
            Anthropic, PBC, 548 Market Street, PMB 90375, San Francisco, CA 94104, USA.<br />
            Briefinhalte werden ausschließlich zur Analyse an Anthropic übermittelt und nicht dauerhaft gespeichert.
          </p>
        </div>

        <div style={S.card}>
          <h2 style={{ ...S.h2, marginTop: 0 }}>Haftungsausschluss</h2>
          <p style={S.p}>
            AmtsKlar ist ein Informationsdienst und kein zugelassener Rechtsdienstleister. Die bereitgestellten Analysen und Erklärungen stellen keine Rechtsberatung im Sinne des österreichischen Rechtsanwaltsgesetzes (RAO) oder des schweizerischen Anwaltsgesetzes dar. Für rechtlich verbindliche Auskünfte wenden Sie sich bitte an einen zugelassenen Rechtsanwalt oder die Arbeiterkammer.
          </p>
          <p style={S.p}>
            Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Richtigkeit, Vollständigkeit und Aktualität der Analyse-Ergebnisse.
          </p>
        </div>

        <div style={S.card}>
          <h2 style={{ ...S.h2, marginTop: 0 }}>Streitbeilegung</h2>
          <p style={S.p}>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung bereit: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" style={{ color: '#C9963A' }}>ec.europa.eu/consumers/odr</a>.<br />
            Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </div>

        <p style={{ ...S.p, fontSize: 13, color: '#6A8AAA' }}>Stand: Mai 2025</p>
      </div>
    </div>
  )
}
