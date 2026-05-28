import { Link } from 'react-router-dom'

const S = {
  page: { background: '#EEF4FB', minHeight: '100vh' },
  header: { padding: '14px 20px', borderBottom: '1px solid #C5D8ED', background: '#FFFFFF', boxShadow: '0 1px 12px rgba(15,36,64,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  inner: { maxWidth: 700, margin: '0 auto', padding: '40px 24px 80px' },
  h1: { fontFamily: 'Libre Baskerville,serif', fontSize: 30, fontWeight: 700 as const, marginBottom: 8, color: '#0F2440' },
  h2: { fontFamily: 'Libre Baskerville,serif', fontSize: 17, fontWeight: 700 as const, marginBottom: 10, marginTop: 24, color: '#0F2440' },
  p: { fontSize: 15, lineHeight: 1.8, color: '#2A5080', marginBottom: 12 },
  card: { background: '#FFFFFF', border: '1px solid #C5D8ED', borderRadius: 12, padding: '20px 24px', marginBottom: 16 },
  li: { fontSize: 15, lineHeight: 1.8, color: '#2A5080', marginBottom: 6 },
}

export default function Datenschutz() {
  return (
    <div style={S.page}>
      <div style={S.header}>
        <Link to="/" style={{ fontFamily: 'Libre Baskerville,serif', fontSize: 19, fontWeight: 700, textDecoration: 'none' }}>
          <span style={{ color: '#0F2440' }}>Amts</span><span style={{ color: '#C9963A' }}>Klar</span>
        </Link>
        <Link to="/" style={{ fontSize: 14, color: '#2A5080', textDecoration: 'none' }}>← Zurück</Link>
      </div>
      <div style={S.inner}>
        <h1 style={S.h1}>Datenschutzerklärung</h1>
        <p style={{ ...S.p, marginBottom: 28 }}>Gemäß DSGVO (EU) 2016/679 und dem österreichischen Datenschutzgesetz (DSG)</p>

        <div style={S.card}>
          <h2 style={{ ...S.h2, marginTop: 0 }}>1. Verantwortlicher</h2>
          <p style={S.p}>
            <strong>Philipp Hofer</strong><br />
            Fischerweg 7, 9434 Au, Schweiz<br />
            E-Mail: <a href="mailto:info@amtsklar.at" style={{ color: '#C9963A' }}>info@amtsklar.at</a>
          </p>
        </div>

        <div style={S.card}>
          <h2 style={{ ...S.h2, marginTop: 0 }}>2. Welche Daten wir verarbeiten</h2>
          <p style={S.p}><strong>a) Briefinhalte zur Analyse:</strong><br />
          Wenn Sie einen Brief analysieren, wird der Textinhalt bzw. das hochgeladene Bild/PDF an die Anthropic API übermittelt. Diese Daten werden ausschließlich zur Erstellung der Analyse verwendet und <strong>nicht dauerhaft gespeichert</strong>.</p>

          <p style={S.p}><strong>b) Nutzungsdaten im Browser:</strong><br />
          Wir speichern lokal in Ihrem Browser (localStorage und Cookies) einen anonymen Zähler für kostenlose Analysen sowie eine anonyme Browser-Kennung zur Missbrauchsprävention. Diese Daten verlassen Ihren Browser nicht und werden nicht an uns übermittelt.</p>

          <p style={S.p}><strong>c) Zahlungsdaten:</strong><br />
          Bei einem Abonnement werden Zahlungsdaten ausschließlich von Paddle.com Market Limited verarbeitet. Wir erhalten keine Kreditkartendaten.</p>

          <p style={S.p}><strong>d) Server-Logs:</strong><br />
          Cloudflare (unser Hosting-Anbieter) verarbeitet technische Zugriffsdaten (IP-Adresse, Zeitstempel, aufgerufene URL). Diese werden für max. 24 Stunden für die Missbrauchsprävention verwendet.</p>
        </div>

        <div style={S.card}>
          <h2 style={{ ...S.h2, marginTop: 0 }}>3. Rechtsgrundlagen</h2>
          <ul style={{ paddingLeft: 20 }}>
            <li style={S.li}><strong>Art. 6 Abs. 1 lit. b DSGVO</strong> — Vertragserfüllung (Analyse-Dienstleistung)</li>
            <li style={S.li}><strong>Art. 6 Abs. 1 lit. f DSGVO</strong> — Berechtigtes Interesse (Missbrauchsprävention)</li>
            <li style={S.li}><strong>Art. 6 Abs. 1 lit. c DSGVO</strong> — Rechtliche Verpflichtung (Buchführung)</li>
          </ul>
        </div>

        <div style={S.card}>
          <h2 style={{ ...S.h2, marginTop: 0 }}>4. Drittanbieter & Auftragsverarbeiter</h2>
          <p style={S.p}><strong>Anthropic, PBC</strong> (USA) — automatisierte Analyse. Grundlage: Standardvertragsklauseln (SCC). Brieftexte werden nicht für Modelltraining verwendet (API-Nutzungsbedingungen).</p>
          <p style={S.p}><strong>Cloudflare, Inc.</strong> (USA) — Hosting & CDN. Grundlage: Standardvertragsklauseln (SCC).</p>
          <p style={S.p}><strong>Paddle.com Market Limited</strong> (UK) — Zahlungsabwicklung. Grundlage: Angemessenheitsbeschluss (UK GDPR).</p>
        </div>

        <div style={S.card}>
          <h2 style={{ ...S.h2, marginTop: 0 }}>5. Ihre Rechte</h2>
          <p style={S.p}>Sie haben folgende Rechte gemäß DSGVO:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li style={S.li}><strong>Auskunftsrecht</strong> (Art. 15 DSGVO)</li>
            <li style={S.li}><strong>Berichtigungsrecht</strong> (Art. 16 DSGVO)</li>
            <li style={S.li}><strong>Recht auf Löschung</strong> (Art. 17 DSGVO)</li>
            <li style={S.li}><strong>Recht auf Einschränkung</strong> (Art. 18 DSGVO)</li>
            <li style={S.li}><strong>Widerspruchsrecht</strong> (Art. 21 DSGVO)</li>
            <li style={S.li}><strong>Beschwerderecht</strong> bei der österreichischen Datenschutzbehörde (dsb.gv.at)</li>
          </ul>
          <p style={{ ...S.p, marginTop: 12 }}>Anfragen richten Sie bitte an: <a href="mailto:info@amtsklar.at" style={{ color: '#C9963A' }}>info@amtsklar.at</a></p>
        </div>

        <div style={S.card}>
          <h2 style={{ ...S.h2, marginTop: 0 }}>6. Cookies & lokale Speicherung</h2>
          <p style={S.p}>AmtsKlar verwendet ausschließlich <strong>technisch notwendige</strong> Cookies und localStorage-Einträge. Diese sind für den Betrieb des Dienstes erforderlich und erfordern gemäß § 165 TKG 2021 keine gesonderte Einwilligung.</p>
          <p style={S.p}>Wir verwenden <strong>kein Google Analytics</strong>, <strong>keine Werbe-Cookies</strong> und <strong>kein Tracking</strong> durch Dritte.</p>
        </div>

        <p style={{ ...S.p, fontSize: 13, color: '#6A8AAA' }}>Stand: Mai 2025</p>
      </div>
    </div>
  )
}
