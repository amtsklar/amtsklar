import { Link } from 'react-router-dom';

export default function Impressum() {
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
        <Link to="/" style={{
          color: '#C9963A',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: 500,
        }}>
          ← Zurück zur Startseite
        </Link>
      </header>

      {/* Content */}
      <main style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '48px 24px',
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 700,
          marginBottom: '8px',
          color: '#1a1a2e',
        }}>
          Impressum
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '40px', fontSize: '14px' }}>
          Angaben gemäß § 5 ECG (Österreich) und Art. 3 UWG (Schweiz)
        </p>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Betreiber</h2>
          <p style={pStyle}>
            Philipp Hofer<br />
            Fischerweg 7<br />
            9434 Au<br />
            Schweiz
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Kontakt</h2>
          <p style={pStyle}>
            E-Mail:{' '}
            <a
              href="mailto:info@amtsklar.at"
              style={{ color: '#C9963A', textDecoration: 'none', fontWeight: 500 }}
            >
              info@amtsklar.at
            </a>
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Hinweis zur Website</h2>
          <p style={pStyle}>
            AmtsKlar ist ein Online-Dienst zur Erläuterung österreichischer Behördenbriefe
            und Bescheide mithilfe von Künstlicher Intelligenz. Die Inhalte dienen ausschließlich
            der allgemeinen Information und stellen keine Rechtsberatung dar.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Haftungsausschluss</h2>
          <p style={pStyle}>
            Die durch AmtsKlar bereitgestellten KI-Analysen ersetzen keine professionelle
            Rechtsberatung. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte
            wird keine Gewähr übernommen. Bei rechtlichen Fragen empfehlen wir die Konsultation
            eines zugelassenen Rechtsanwalts oder einer Rechtsberatungsstelle.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Urheberrecht</h2>
          <p style={pStyle}>
            Die auf dieser Website veröffentlichten Inhalte und Werke unterliegen dem
            österreichischen und schweizerischen Urheberrecht. Vervielfältigung, Bearbeitung,
            Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechts
            bedürfen der schriftlichen Zustimmung des Betreibers.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Streitbeilegung</h2>
          <p style={pStyle}>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
            bereit:{' '}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#C9963A', textDecoration: 'none' }}
            >
              https://ec.europa.eu/consumers/odr
            </a>
            . Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren
            vor einer Verbraucherschlichtungsstelle teilzunehmen.
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
          <Link to="/datenschutz" style={linkStyle}>Datenschutzerklärung</Link>
          <Link to="/agb" style={linkStyle}>AGB</Link>
          <Link to="/" style={linkStyle}>Startseite</Link>
        </div>
      </main>
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  marginBottom: '32px',
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

const linkStyle: React.CSSProperties = {
  color: '#6b7280',
  textDecoration: 'none',
  fontSize: '14px',
};
