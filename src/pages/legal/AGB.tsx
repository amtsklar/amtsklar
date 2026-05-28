import { Link } from 'react-router-dom';

export default function AGB() {
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
          Allgemeine Geschäftsbedingungen
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '40px', fontSize: '14px' }}>
          Stand: Mai 2026
        </p>

        <section style={sectionStyle}>
          <h2 style={h2Style}>1. Anbieter & Geltungsbereich</h2>
          <p style={pStyle}>
            Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung des Online-Dienstes
            <strong> AmtsKlar</strong> (amtsklar.at), betrieben von:
          </p>
          <p style={{ ...pStyle, marginTop: '12px', paddingLeft: '16px', borderLeft: '3px solid #C9963A' }}>
            Philipp Hofer<br />
            Fischerweg 7, 9434 Au, Schweiz<br />
            E-Mail: <a href="mailto:info@amtsklar.at" style={linkGoldStyle}>info@amtsklar.at</a>
          </p>
          <p style={{ ...pStyle, marginTop: '12px' }}>
            Es gilt Schweizer Recht. Für Verbraucher mit Wohnsitz in der EU (insbesondere
            Österreich) bleiben zwingende Verbraucherschutzbestimmungen ihres Heimatlandes
            unberührt.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>2. Leistungsbeschreibung</h2>
          <p style={pStyle}>
            AmtsKlar bietet eine KI-gestützte Analyse österreichischer Behördenbriefe,
            Bescheide und Amtsschreiben. Nutzer können Dokumente (Text, PDF, Foto) hochladen
            und erhalten eine verständliche Erläuterung des Inhalts.
          </p>
          <p style={{ ...pStyle, marginTop: '12px', padding: '12px', background: '#FEF2F2', borderRadius: '8px', borderLeft: '3px solid #EF4444' }}>
            <strong>Wichtiger Hinweis:</strong> Die Analysen von AmtsKlar stellen
            <strong> keine Rechtsberatung</strong> dar und ersetzen diese nicht. Bei
            rechtlichen Fragen oder Fristen wenden Sie sich an einen zugelassenen
            Rechtsanwalt oder eine anerkannte Rechtsberatungsstelle.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>3. Nutzung & Tarife</h2>
          <p style={pStyle}><strong>Kostenlose Nutzung:</strong></p>
          <p style={{ ...pStyle, marginBottom: '12px' }}>
            Jeder Nutzer erhält eine begrenzte Anzahl kostenloser Analysen pro Gerät.
            Danach ist eine kostenpflichtige Freischaltung erforderlich.
          </p>
          <p style={pStyle}><strong>Kostenpflichtige Tarife:</strong></p>
          <p style={pStyle}>
            Die aktuellen Preise und Leistungsumfänge sind auf der Website unter dem
            Bereich „Tarife" einsehbar. Alle Preise verstehen sich inklusive der
            gesetzlich anfallenden Steuern.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>4. Zahlungsabwicklung</h2>
          <p style={pStyle}>
            Zahlungen werden ausschließlich über <strong>Paddle</strong> (Paddle.com Market Ltd.)
            abgewickelt. Paddle fungiert als Merchant of Record — das bedeutet, Paddle ist
            rechtlich der Verkäufer und stellt die Rechnung aus. Es gelten ergänzend die
            Nutzungsbedingungen von Paddle. AmtsKlar hat keinen Zugriff auf Ihre Zahlungsdaten.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>5. Widerrufsrecht (EU-Verbraucher)</h2>
          <p style={pStyle}>
            Verbrauchern mit Wohnsitz in der EU steht grundsätzlich ein gesetzliches
            Widerrufsrecht von <strong>14 Tagen</strong> zu. Da es sich bei AmtsKlar um
            einen digitalen Dienst handelt, erlischt das Widerrufsrecht mit Beginn der
            Leistungserbringung, sofern der Verbraucher ausdrücklich zugestimmt hat und
            zur Kenntnis genommen hat, dass er dadurch sein Widerrufsrecht verliert.
          </p>
          <p style={{ ...pStyle, marginTop: '12px' }}>
            Bei Fragen zum Widerruf wenden Sie sich an:{' '}
            <a href="mailto:info@amtsklar.at" style={linkGoldStyle}>info@amtsklar.at</a>
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>6. Verfügbarkeit & Haftung</h2>
          <p style={pStyle}>
            Wir bemühen uns um eine möglichst hohe Verfügbarkeit des Dienstes. Ein
            Rechtsanspruch auf ununterbrochene Verfügbarkeit besteht nicht. Der Betreiber
            haftet nicht für:
          </p>
          <ul style={{ ...pStyle, paddingLeft: '20px', marginTop: '8px' }}>
            <li style={{ marginBottom: '6px' }}>Fehler oder Unvollständigkeiten in KI-generierten Analysen</li>
            <li style={{ marginBottom: '6px' }}>Entscheidungen, die auf Basis der Analysen getroffen werden</li>
            <li style={{ marginBottom: '6px' }}>Technische Ausfälle von Drittanbietern (Anthropic, Cloudflare, Paddle)</li>
            <li style={{ marginBottom: '6px' }}>Schäden durch unsachgemäße Nutzung des Dienstes</li>
          </ul>
          <p style={{ ...pStyle, marginTop: '12px' }}>
            Die Haftung ist im gesetzlich zulässigen Rahmen auf Vorsatz und grobe
            Fahrlässigkeit beschränkt.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>7. Nutzerpflichten</h2>
          <p style={pStyle}>Der Nutzer verpflichtet sich:</p>
          <ul style={{ ...pStyle, paddingLeft: '20px', marginTop: '8px' }}>
            <li style={{ marginBottom: '6px' }}>Den Dienst nur für legale Zwecke zu verwenden</li>
            <li style={{ marginBottom: '6px' }}>Keine Dokumente hochzuladen, die Dritte in ihren Rechten verletzen</li>
            <li style={{ marginBottom: '6px' }}>Den Dienst nicht automatisiert oder missbräuchlich zu nutzen</li>
            <li style={{ marginBottom: '6px' }}>Keine Versuche zu unternehmen, die technische Infrastruktur zu manipulieren</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>8. Änderungen der AGB</h2>
          <p style={pStyle}>
            Wir behalten uns vor, diese AGB jederzeit zu ändern. Über wesentliche Änderungen
            informieren wir per E-Mail (sofern eine Adresse vorliegt) oder durch einen
            deutlichen Hinweis auf der Website. Die fortgesetzte Nutzung nach Inkrafttreten
            der Änderungen gilt als Zustimmung.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>9. Anwendbares Recht & Gerichtsstand</h2>
          <p style={pStyle}>
            Es gilt Schweizer Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand für
            Streitigkeiten mit Unternehmern ist Au (Kanton St. Gallen), Schweiz. Für
            Verbraucher mit Wohnsitz in der EU gelten die zwingenden Gerichtsstandsregelungen
            des jeweiligen EU-Mitgliedstaates.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>10. Kontakt</h2>
          <p style={pStyle}>
            Bei Fragen zu diesen AGB wenden Sie sich an:{' '}
            <a href="mailto:info@amtsklar.at" style={linkGoldStyle}>info@amtsklar.at</a>
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
          <Link to="/datenschutz" style={footerLinkStyle}>Datenschutzerklärung</Link>
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
