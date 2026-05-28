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

export default function AGB() {
  return (
    <div style={S.page}>
      <div style={S.header}>
        <Link to="/" style={{ fontFamily: 'Libre Baskerville,serif', fontSize: 19, fontWeight: 700, textDecoration: 'none' }}>
          <span style={{ color: '#0F2440' }}>Amts</span><span style={{ color: '#C9963A' }}>Klar</span>
        </Link>
        <Link to="/" style={{ fontSize: 14, color: '#2A5080', textDecoration: 'none' }}>← Zurück</Link>
      </div>
      <div style={S.inner}>
        <h1 style={S.h1}>Allgemeine Geschäftsbedingungen</h1>
        <p style={{ ...S.p, marginBottom: 28 }}>Stand: Mai 2025</p>

        <div style={S.card}>
          <h2 style={{ ...S.h2, marginTop: 0 }}>§ 1 Anbieter & Geltungsbereich</h2>
          <p style={S.p}>Diese AGB gelten für die Nutzung des Online-Dienstes AmtsKlar, betrieben von Philipp Hofer, Fischerweg 7, 9434 Au, Schweiz (nachfolgend „Anbieter").</p>
          <p style={S.p}>AmtsKlar richtet sich an Verbraucher und Unternehmer mit Wohnsitz oder Sitz im deutschsprachigen Raum (Österreich, Deutschland, Schweiz).</p>
        </div>

        <div style={S.card}>
          <h2 style={{ ...S.h2, marginTop: 0 }}>§ 2 Leistungsbeschreibung</h2>
          <p style={S.p}>AmtsKlar ist ein KI-gestützter Informationsdienst zur Erklärung österreichischer Behördenschreiben. Der Dienst:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li style={S.li}>Analysiert und erklärt Behördenbriefe in verständlicher Sprache</li>
            <li style={S.li}>Gibt Hinweise auf relevante Fristen und mögliche Handlungsoptionen</li>
            <li style={S.li}>Erstellt im Handeln- und Familie-Paket Muster-Antwortbriefe</li>
            <li style={S.li}>Stellt Mustervorlagen zum Download bereit (Handeln & Familie)</li>
          </ul>
          <p style={{ ...S.p, marginTop: 12 }}><strong>AmtsKlar ist kein Rechtsdienstleister</strong> und erbringt keine Rechtsberatung im Sinne des österreichischen RAO. Die Ergebnisse sind unverbindliche Informationen.</p>
        </div>

        <div style={S.card}>
          <h2 style={{ ...S.h2, marginTop: 0 }}>§ 3 Kostenlose Nutzung & Abonnement</h2>
          <p style={S.p}><strong>Kostenlose Testanalyse:</strong> Jeder Nutzer erhält 1 kostenlose Analyse ohne Registrierung.</p>
          <p style={S.p}><strong>Abonnement:</strong> Für unbegrenzte Analysen ist ein Abonnement erforderlich. Die Abonnements werden über Paddle.com Market Limited abgewickelt, welche als Merchant of Record fungiert.</p>
          <p style={S.p}><strong>Preise:</strong> Die aktuellen Preise sind auf der Website ersichtlich. Alle Preise verstehen sich inkl. der gesetzlichen MwSt.</p>
          <p style={S.p}><strong>Laufzeit & Kündigung:</strong> Abonnements können jederzeit zum Ende des jeweiligen Abrechnungszeitraums gekündigt werden. Die Kündigung erfolgt über das Kundenportal oder per E-Mail an info@amtsklar.at.</p>
        </div>

        <div style={S.card}>
          <h2 style={{ ...S.h2, marginTop: 0 }}>§ 4 Widerrufsrecht</h2>
          <p style={S.p}>Verbraucher haben das Recht, diesen Vertrag binnen 14 Tagen ohne Angabe von Gründen zu widerrufen. Die Widerrufsfrist beträgt 14 Tage ab dem Tag des Vertragsabschlusses.</p>
          <p style={S.p}>Durch die Inanspruchnahme der Leistung vor Ablauf der Widerrufsfrist stimmt der Verbraucher zu, dass das Widerrufsrecht nach vollständiger Vertragserfüllung erlischt.</p>
          <p style={S.p}>Widerruf per E-Mail an: <a href="mailto:info@amtsklar.at" style={{ color: '#C9963A' }}>info@amtsklar.at</a></p>
        </div>

        <div style={S.card}>
          <h2 style={{ ...S.h2, marginTop: 0 }}>§ 5 Haftungsbeschränkung</h2>
          <p style={S.p}>Der Anbieter haftet nicht für:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li style={S.li}>Entscheidungen, die auf Basis der AmtsKlar-Analysen getroffen werden</li>
            <li style={S.li}>Verpasste Fristen oder fehlerhafte Rechtseinschätzungen</li>
            <li style={S.li}>Schäden durch falsche oder unvollständige Eingaben des Nutzers</li>
            <li style={S.li}>Vorübergehende Nichtverfügbarkeit des Dienstes</li>
          </ul>
          <p style={{ ...S.p, marginTop: 12 }}>Die Haftung für grobe Fahrlässigkeit und Vorsatz bleibt unberührt.</p>
        </div>

        <div style={S.card}>
          <h2 style={{ ...S.h2, marginTop: 0 }}>§ 6 Nutzungspflichten</h2>
          <p style={S.p}>Der Nutzer verpflichtet sich:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li style={S.li}>Den Dienst ausschließlich für legale Zwecke zu nutzen</li>
            <li style={S.li}>Keine automatisierten Abfragen durchzuführen</li>
            <li style={S.li}>Die kostenlose Testanalyse nicht durch technische Mittel zu umgehen</li>
            <li style={S.li}>Keine personenbezogenen Daten Dritter ohne deren Einwilligung einzugeben</li>
          </ul>
        </div>

        <div style={S.card}>
          <h2 style={{ ...S.h2, marginTop: 0 }}>§ 7 Anwendbares Recht & Gerichtsstand</h2>
          <p style={S.p}>Es gilt schweizerisches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand ist St. Gallen, Schweiz, sofern der Nutzer Kaufmann oder juristische Person ist. Für Verbraucher gilt der gesetzliche Gerichtsstand.</p>
          <p style={S.p}>Für österreichische Verbraucher bleiben die zwingenden Bestimmungen des österreichischen Konsumentenschutzgesetzes (KSchG) unberührt.</p>
        </div>

        <div style={S.card}>
          <h2 style={{ ...S.h2, marginTop: 0 }}>§ 8 Änderungen der AGB</h2>
          <p style={S.p}>Der Anbieter behält sich vor, diese AGB mit angemessener Ankündigungsfrist (mindestens 30 Tage) zu ändern. Änderungen werden per E-Mail oder durch Hinweis auf der Website bekannt gegeben.</p>
        </div>
      </div>
    </div>
  )
}
