import { Link } from 'react-router-dom'

// ═══════════════════════════════════════════════════════════════════
// IMPRESSUM — Gemäß § 5 ECG (Österreich) & Art. 246 EGBGB
// Bitte ersetze [DEIN_VORNAME_NACHNAME], [DEINE_STRASSE_NR],
// [PLZ], [ORT], [DEINE_EMAIL@DOMAIN.COM] mit deinen echten Daten.
// ═══════════════════════════════════════════════════════════════════

const S = {
  page: { background: '#182638', minHeight: '100vh', color: '#EDF2FA', fontFamily: 'DM Sans,sans-serif' },
  header: { padding: '14px 20px', borderBottom: '1px solid #2A4A6A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  body: { maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' },
  h1: { fontFamily: 'Libre Baskerville,serif', fontSize: 32, fontWeight: 700, color: '#EDF2FA', marginBottom: 8 } as React.CSSProperties,
  h2: { fontFamily: 'Libre Baskerville,serif', fontSize: 20, fontWeight: 700, color: '#EDF2FA', marginTop: 40, marginBottom: 12, paddingTop: 24, borderTop: '1px solid #2A4A6A' } as React.CSSProperties,
  h3: { fontSize: 15, fontWeight: 600, color: '#C9963A', marginTop: 20, marginBottom: 8 } as React.CSSProperties,
  p: { fontSize: 15, color: '#C8D8EC', lineHeight: 1.75, marginBottom: 12 } as React.CSSProperties,
  note: { background: 'rgba(201,150,58,0.08)', border: '1px solid rgba(201,150,58,0.2)', borderRadius: 10, padding: '14px 18px', fontSize: 14, color: '#C9963A', lineHeight: 1.65, marginBottom: 28 } as React.CSSProperties,
  updated: { fontSize: 13, color: '#6A8AAA', marginBottom: 32 } as React.CSSProperties,
}

export default function Impressum() {
  return (
    <div style={S.page}>
      <div style={S.header}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <svg width="32" height="32" viewBox="0 0 32 32"><defs><linearGradient id="g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#D4A84B"/><stop offset="100%" stopColor="#A8731E"/></linearGradient></defs><rect width="32" height="32" rx="8" fill="url(#g)"/><text x="16" y="22" fontFamily="Georgia,serif" fontSize="18" fontWeight="bold" fill="white" textAnchor="middle">§</text></svg>
          <span style={{ fontFamily: 'Libre Baskerville,serif', fontSize: 18 }}>
            <span style={{ color: '#EDF2FA', fontWeight: 400 }}>Amts</span>
            <span style={{ color: '#C9963A', fontWeight: 700 }}>Klar</span>
          </span>
        </Link>
        <Link to="/" style={{ fontSize: 14, color: '#90AECA', textDecoration: 'none' }}>← Zurück</Link>
      </div>

      <div style={S.body}>
        <h1 style={S.h1}>Impressum</h1>
        <p style={S.updated}>Stand: Juni 2025</p>

        <div style={S.note}>
          ⚠️ Vor Veröffentlichung: Ersetze alle markierten Felder [IN ECKIGEN KLAMMERN] mit deinen echten Daten.
        </div>

        {/* § 5 ECG */}
        <h2 style={S.h2}>Angaben gemäß § 5 ECG</h2>

        <h3 style={S.h3}>Diensteanbieter</h3>
        <p style={S.p}>
          [DEIN_VORNAME_NACHNAME]<br />
          [STRASSE UND HAUSNUMMER]<br />
          [PLZ] [ORT]<br />
          Schweiz
        </p>

        <h3 style={S.h3}>Kontakt</h3>
        <p style={S.p}>
          E-Mail: <a href="mailto:[DEINE_EMAIL@DOMAIN.COM]" style={{ color: '#C9963A' }}>[DEINE_EMAIL@DOMAIN.COM]</a><br />
          (Anfragen werden werktags innerhalb von 48 Stunden beantwortet)
        </p>

        <h3 style={S.h3}>Unternehmensgegenstand</h3>
        <p style={S.p}>
          Betrieb des Informationsdienstes AmtsKlar unter amtsklar.at zur KI-gestützten
          Erklärung österreichischer Behördenschreiben für Privatpersonen.
        </p>

        <h3 style={S.h3}>Umsatzsteuer</h3>
        <p style={S.p}>
          Die Zahlungsabwicklung und Rechnungsstellung erfolgt ausschließlich durch Paddle.com
          Europe Limited (Handelsregister England und Wales, Nr. 10212606), die als
          Merchant of Record fungiert. Paddle ist für die Erhebung und Abführung der
          anfallenden Umsatzsteuer verantwortlich. Auf den Rechnungen von Paddle wird
          die jeweils gültige Umsatzsteuer separat ausgewiesen.
        </p>

        <h2 style={S.h2}>Hinweise zum Dienst</h2>

        <h3 style={S.h3}>Kein Rechtsdienstleistungsunternehmen</h3>
        <p style={S.p}>
          AmtsKlar ist ein Informationsdienst und kein Rechtsdienstleistungsunternehmen.
          Die Inhalte des Dienstes dienen ausschließlich zur allgemeinen Information
          und ersetzen keine individuelle Rechtsberatung durch einen zugelassenen
          Rechtsanwalt oder eine andere rechtsberatende Stelle. Die Nutzung der
          Dienste von AmtsKlar begründet kein Mandats- oder Beratungsverhältnis.
        </p>

        <h3 style={S.h3}>Keine Gewährleistung für Vollständigkeit und Richtigkeit</h3>
        <p style={S.p}>
          Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung
          für die Richtigkeit, Vollständigkeit und Aktualität der bereitgestellten
          Informationen. Die Analysen werden mittels KI-Technologie generiert und
          können Fehler enthalten. Bei rechtlich relevanten Angelegenheiten ist
          immer eine zugelassene Fachkraft zu konsultieren.
        </p>

        <h3 style={S.h3}>Zahlungsabwicklung durch Paddle</h3>
        <p style={S.p}>
          Alle Zahlungen, Abonnementverwaltung, Rechnungen und damit verbundene
          Vertragsbeziehungen werden über Paddle.com Europe Limited abgewickelt.
          Paddle fungiert als vollständiger Merchant of Record. Fragen zu Rechnungen,
          Zahlungen oder Abonnementkündigungen sind direkt an Paddle zu richten:
          {' '}<a href="https://paddle.net" target="_blank" rel="noopener noreferrer" style={{ color: '#C9963A' }}>paddle.net</a>.
        </p>

        <h2 style={S.h2}>Urheberrecht</h2>
        <p style={S.p}>
          Die durch den Seitenbetreiber erstellten Inhalte und Werke auf dieser
          Website unterliegen dem schweizerischen Urheberrecht. Downloads und Kopien
          dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
          Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden,
          werden die Urheberrechte Dritter beachtet. Gesetzestexte stammen aus dem
          Rechtsinformationssystem des Bundes (RIS) unter{' '}
          <a href="https://www.ris.bka.gv.at" target="_blank" rel="noopener noreferrer" style={{ color: '#C9963A' }}>ris.bka.gv.at</a>
          {' '}(CC BY 4.0).
        </p>

        <h2 style={S.h2}>Streitbeilegung</h2>
        <p style={S.p}>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung
          (OS) bereit:{' '}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" style={{ color: '#C9963A' }}>
            ec.europa.eu/consumers/odr
          </a>.
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor
          einer Verbraucherschlichtungsstelle teilzunehmen, es sei denn, dies ist
          gesetzlich vorgeschrieben.
        </p>

        <h2 style={S.h2}>Anwendbares Recht / Gerichtsstand</h2>
        <p style={S.p}>
          Für Streitigkeiten aus diesem Impressum und der Nutzung des Dienstes
          amtsklar.at gilt schweizerisches Recht, vorbehaltlich zwingender
          Verbraucherschutzvorschriften des Aufenthaltslandes des Nutzers.
          Gerichtsstand für Nutzer, die keine Verbraucher sind, ist [ORT], Schweiz.
        </p>
      </div>
    </div>
  )
}
