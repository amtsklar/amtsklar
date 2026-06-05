/**
 * AmtsKlar — Widerruf & Refund Policy
 * Copyright © 2025-2026 STAR:HORIZON LTD
 */
import { Link } from 'react-router-dom'

export default function Widerruf() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '60px 24px', fontFamily: 'sans-serif', color: '#1A3A5C' }}>
      <Link to="/" style={{ color: '#C9963A', textDecoration: 'none', fontSize: 14 }}>← Zurück</Link>
      <h1 style={{ fontFamily: 'serif', fontSize: 32, marginTop: 24, marginBottom: 8, color: '#0F2440' }}>
        Widerruf & Rückerstattung
      </h1>
      <p style={{ color: '#6A8AAA', fontSize: 14, marginBottom: 40 }}>Refund & Cancellation Policy · Stand: Mai 2025</p>

      <h2 style={{ fontSize: 18, color: '#0F2440', marginBottom: 8 }}>14-Tage Widerrufsrecht</h2>
      <p style={{ lineHeight: 1.8, marginBottom: 24 }}>
        Verbraucher haben das Recht, ihr Abonnement binnen <strong>14 Tagen</strong> nach Vertragsabschluss
        ohne Angabe von Gründen zu widerrufen und eine vollständige Rückerstattung zu erhalten.
      </p>

      <h2 style={{ fontSize: 18, color: '#0F2440', marginBottom: 8 }}>Refund Policy (English)</h2>
      <p style={{ lineHeight: 1.8, marginBottom: 24 }}>
        Consumers have the right to cancel their subscription within <strong>14 days</strong> of purchase
        and receive a full refund, no questions asked. Refunds are processed by Paddle.com Market Limited
        as Merchant of Record.
      </p>

      <h2 style={{ fontSize: 18, color: '#0F2440', marginBottom: 8 }}>Rückerstattungsanfragen</h2>
      <p style={{ lineHeight: 1.8, marginBottom: 24 }}>
        Bitte senden Sie Ihre Anfrage an:{' '}
        <a href="mailto:info@amtsklar.at" style={{ color: '#C9963A' }}>info@amtsklar.at</a><br />
        Da Paddle.com Market Limited als Merchant of Record fungiert, werden Rückerstattungen
        direkt über Paddle abgewickelt.
      </p>

      <h2 style={{ fontSize: 18, color: '#0F2440', marginBottom: 8 }}>Nach Ablauf der 14 Tage</h2>
      <p style={{ lineHeight: 1.8, marginBottom: 24 }}>
        Nach Ablauf der Widerrufsfrist werden keine anteiligen Rückerstattungen für nicht genutzte
        Zeiträume gewährt. Das Abonnement läuft bis zum Ende des bezahlten Zeitraums.
      </p>

      <h2 style={{ fontSize: 18, color: '#0F2440', marginBottom: 8 }}>Kündigung</h2>
      <p style={{ lineHeight: 1.8 }}>
        Abonnements können jederzeit zum Ende des Abrechnungszeitraums gekündigt werden —
        über das Kundenportal oder per E-Mail an{' '}
        <a href="mailto:info@amtsklar.at" style={{ color: '#C9963A' }}>info@amtsklar.at</a>.
      </p>

      <div style={{ marginTop: 48, borderTop: '1px solid #C5D8ED', paddingTop: 24 }}>
        <Link to="/agb" style={{ color: '#6A8AAA', textDecoration: 'none', fontSize: 13 }}>
          → Vollständige AGB anzeigen
        </Link>
      </div>
    </div>
  )
}
