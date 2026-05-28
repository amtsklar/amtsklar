import { Link } from 'react-router-dom';

export default function Datenschutz() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8F9FB',
      fontFamily: "'Inter', -apple-system, sans-serif",
      color: '#1a1a2e',
    }}>
      {/* Header */}
      <header style={{
        background: '#1a1a2e',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#EDF2FA', letterSpacing: '-0.5px' }}>
            Amts<span style={{ color: '#C9963A' }}>Klar</span>
          </span>
        </Link>
        <Link to="/" style={{ color: '#C9963A', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          ← Zurück zur Startseite
        </Link>
      </header>

      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px', color: '#1a1a2e' }}>
          Datenschutzerklärung
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '40px', fontSize: '14px' }}>
          Stand: Mai 2026 · Gemäß EU-DSGVO und Schweizer DSG
        </p>

        <section style={sectionStyle}>
          <h2 style={h2Style}>1. Verantwortlicher</h2>
          <p style={pStyle}>
            Verantwortlicher im Sinne der DSGVO und des Schweizer DSG:<br /><br />
            Philipp Hofer<br />
            Fischerweg 7<br />
            9434 Au<br />
            Schweiz<br /><br />
            E-Mail: <a href="mailto:info@amtsklar.at" style={linkGoldStyle}>info@amtsklar.at</a>
          </p>
          <p style={{ ...pStyle, marginTop: '12px', padding: '12px', background: '#FEF3C7', borderRadius: '8px', fontSize: '13px' }}>
            <strong>Hinweis:</strong> Der Betreiber hat seinen Sitz in der Schweiz. Das Angebot richtet
            sich an Nutzer in Österreich und der EU. Es gilt daher sowohl die EU-Datenschutz-Grundverordnung
            (DSGVO) als auch das Schweizer Datenschutzgesetz (DSG).
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>2. Welche Daten wir verarbeiten</h2>
          <p style={pStyle}><strong>a) Beim Besuch der Website</strong></p>
          <p style={{ ...pStyle, marginBottom: '16px' }}>
            Beim Aufruf unserer Website werden automatisch folgende Daten erfasst:
            IP-Adresse (anonymisiert), Datum und Uhrzeit des Zugriffs, aufgerufene Seite,
            verwendeter Browser und Betriebssystem. Diese Daten werden ausschließlich zur
            technischen Bereitstellung der Website verarbeitet (Art. 6 Abs. 1 lit. f DSGVO).
          </p>
          <p style={pStyle}><strong>b) Bei der KI-Analyse</strong></p>
          <p style={{ ...pStyle, marginBottom: '16px' }}>
            Dokumente (Text, PDF, Foto), die Sie zur Analyse hochladen, werden zur Verarbeitung
            an die Anthropic API (USA) übermittelt. Die Dokumente werden <strong>nicht dauerhaft
            gespeichert</strong> — weder auf unseren Servern noch bei Anthropic. Die Verarbeitung
            erfolgt ausschließlich zur Erbringung des Dienstes (Art. 6 Abs. 1 lit. b DSGVO).
          </p>
          <p style={pStyle}><strong>c) Bei der Zahlung</strong></p>
          <p style={pStyle}>
            Zahlungen werden über Paddle (Paddle.com Market Ltd., UK) abgewickelt. Dabei werden
            Name, E-Mail-Adresse und Zahlungsdaten an Paddle übermittelt. AmtsKlar speichert
            keine Kreditkartendaten. Paddle agiert als Merchant of Record. Ihre E-Mail-Adresse
            wird zur Verifizierung Ihres Zugangs gespeichert (Art. 6 Abs. 1 lit. b DSGVO).
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>3. Drittanbieter & Datenübermittlung</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#F3F4F6' }}>
                <th style={thStyle}>Anbieter</th>
                <th style={thStyle}>Zweck</th>
                <th style={thStyle}>Sitz</th>
                <th style={thStyle}>Rechtsgrundlage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}>Anthropic</td>
                <td style={tdStyle}>KI-Analyse</td>
                <td style={tdStyle}>USA</td>
                <td style={tdStyle}>Vertrag (Art. 6 I b)</td>
              </tr>
              <tr style={{ background: '#F9FAFB' }}>
                <td style={tdStyle}>Paddle</td>
                <td style={tdStyle}>Zahlungsabwicklung</td>
                <td style={tdStyle}>UK</td>
                <td style={tdStyle}>Vertrag (Art. 6 I b)</td>
              </tr>
              <tr>
                <td style={tdStyle}>Cloudflare</td>
                <td style={tdStyle}>Hosting & CDN</td>
                <td style={tdStyle}>USA</td>
                <td style={tdStyle}>Berechtigtes Interesse (Art. 6 I f)</td>
              </tr>
            </tbody>
          </table>
          <p style={{ ...pStyle, marginTop: '12px', fontSize: '13px', color: '#6b7280' }}>
            Für Übermittlungen in Drittstaaten (USA) stützen wir uns auf Standardvertragsklauseln
            der EU-Kommission (Art. 46 Abs. 2 lit. c DSGVO).
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>4. Cookies & lokale Speicherung</h2>
          <p style={pStyle}>
            AmtsKlar verwendet <strong>keine Tracking-Cookies</strong> und kein Analytics.
            Lediglich technisch notwendige Daten (Anzahl genutzter Analysen, Zahlungsstatus)
            werden im <strong>LocalStorage Ihres Browsers</strong> gespeichert. Diese Daten
            verlassen Ihr Gerät nicht und werden nicht an uns übermittelt.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>5. Ihre Rechte</h2>
          <p style={pStyle}>
            Als betroffene Person haben Sie folgende Rechte gegenüber dem Verantwortlichen:
          </p>
          <ul style={{ ...pStyle, paddingLeft: '20px', marginTop: '12px' }}>
            <li style={{ marginBottom: '6px' }}><strong>Auskunft</strong> (Art. 15 DSGVO): Welche Daten wir über Sie gespeichert haben</li>
            <li style={{ marginBottom: '6px' }}><strong>Berichtigung</strong> (Art. 16 DSGVO): Korrektur falscher Daten</li>
            <li style={{ marginBottom: '6px' }}><strong>Löschung</strong> (Art. 17 DSGVO): Löschung Ihrer Daten</li>
            <li style={{ marginBottom: '6px' }}><strong>Einschränkung</strong> (Art. 18 DSGVO): Einschränkung der Verarbeitung</li>
            <li style={{ marginBottom: '6px' }}><strong>Widerspruch</strong> (Art. 21 DSGVO): Widerspruch gegen die Verarbeitung</li>
            <li style={{ marginBottom: '6px' }}><strong>Datenübertragbarkeit</strong> (Art. 20 DSGVO): Erhalt Ihrer Daten in maschinenlesbarem Format</li>
          </ul>
          <p style={{ ...pStyle, marginTop: '12px' }}>
            Zur Ausübung Ihrer Rechte wenden Sie sich an:{' '}
            <a href="mailto:info@amtsklar.at" style={linkGoldStyle}>info@amtsklar.at</a>
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>6. Beschwerderecht</h2>
          <p style={pStyle}>
            Sie haben das Recht, sich bei der zuständigen Datenschutzbehörde zu beschweren.
            Für Nutzer in Österreich ist dies die:{' '}
            <strong>Österreichische Datenschutzbehörde</strong>, Barichgasse 40–42, 1030 Wien,
            dsb@dsb.gv.at. Für Nutzer in der Schweiz: Eidgenössischer Datenschutz- und
            Öffentlichkeitsbeauftragter (EDÖB), Feldeggweg 1, 3003 Bern.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>7. Datensicherheit</h2>
          <p style={pStyle}>
            Die Übertragung aller Daten erfolgt verschlüsselt via HTTPS/TLS. Wir treffen
            technische und organisatorische Maßnahmen zum Schutz Ihrer Daten gemäß Art. 32 DSGVO.
          </p>
        </section>

        <div style={{
          marginTop: '48px',
          paddingTop: '24px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: '24px',
          flexWrap: 'wrap',
        }}>
          <Link to="/impressum" style={footerLinkStyle}>Impressum</Link>
          <Link to="/agb" style={footerLinkStyle}>AGB</Link>
          <Link to="/" style={footerLinkStyle}>Startseite</Link>
        </div>
      </main>
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  marginBottom: '24px',
  padding: '24px',
  background: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
};
const h2Style: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  marginBottom: '12px',
  color: '#1a1a2e',
};
const pStyle: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '1.7',
  color: '#4b5563',
  margin: 0,
};
const thStyle: React.CSSProperties = {
  padding: '8px 12px',
  textAlign: 'left',
  fontWeight: 600,
  color: '#374151',
  borderBottom: '1px solid #e5e7eb',
};
const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  color: '#4b5563',
  borderBottom: '1px solid #f3f4f6',
};
const linkGoldStyle: React.CSSProperties = {
  color: '#C9963A',
  textDecoration: 'none',
  fontWeight: 500,
};
const footerLinkStyle: React.CSSProperties = {
  color: '#6b7280',
  textDecoration: 'none',
  fontSize: '14px',
};
