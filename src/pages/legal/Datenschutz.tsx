import { Link } from 'react-router-dom'

// ═══════════════════════════════════════════════════════════════════
// DATENSCHUTZERKLÄRUNG — DSGVO & Schweizer DSG konform
// Bitte ersetze [DEIN_VORNAME_NACHNAME], [ADRESSE], [EMAIL] etc.
// ═══════════════════════════════════════════════════════════════════

const S = {
  page: { background: '#EEF4FB', minHeight: '100vh', color: '#0F2440', fontFamily: 'DM Sans,sans-serif' },
  header: { padding: '14px 20px', borderBottom: '1px solid #C5D8ED', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  body: { maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' },
  h1: { fontFamily: 'Libre Baskerville,serif', fontSize: 32, fontWeight: 700, color: '#0F2440', marginBottom: 8 } as React.CSSProperties,
  h2: { fontFamily: 'Libre Baskerville,serif', fontSize: 20, fontWeight: 700, color: '#0F2440', marginTop: 40, marginBottom: 12, paddingTop: 24, borderTop: '1px solid #C5D8ED' } as React.CSSProperties,
  h3: { fontSize: 15, fontWeight: 600, color: '#C9963A', marginTop: 20, marginBottom: 8 } as React.CSSProperties,
  p: { fontSize: 15, color: '#1A3A5C', lineHeight: 1.75, marginBottom: 12 } as React.CSSProperties,
  ul: { paddingLeft: 20, marginBottom: 16 } as React.CSSProperties,
  li: { fontSize: 15, color: '#1A3A5C', lineHeight: 1.75, marginBottom: 6 } as React.CSSProperties,
  box: { background: '#FFFFFF', border: '1px solid #C5D8ED', borderRadius: 10, padding: '16px 20px', marginBottom: 16 } as React.CSSProperties,
  note: { background: 'rgba(201,150,58,0.08)', border: '1px solid rgba(201,150,58,0.2)', borderRadius: 10, padding: '14px 18px', fontSize: 14, color: '#C9963A', lineHeight: 1.65, marginBottom: 28 } as React.CSSProperties,
  updated: { fontSize: 13, color: '#4A6A90', marginBottom: 32 } as React.CSSProperties,
  a: { color: '#C9963A' } as React.CSSProperties,
}

export default function Datenschutz() {
  return (
    <div style={S.page}>
      <div style={S.header}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <svg width="32" height="32" viewBox="0 0 32 32"><defs><linearGradient id="g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#D4A84B"/><stop offset="100%" stopColor="#A8731E"/></linearGradient></defs><rect width="32" height="32" rx="8" fill="url(#g)"/><text x="16" y="22" fontFamily="Georgia,serif" fontSize="18" fontWeight="bold" fill="white" textAnchor="middle">§</text></svg>
          <span style={{ fontFamily: 'Libre Baskerville,serif', fontSize: 18 }}>
            <span style={{ color: '#0F2440', fontWeight: 400 }}>Amts</span>
            <span style={{ color: '#C9963A', fontWeight: 700 }}>Klar</span>
          </span>
        </Link>
        <Link to="/" style={{ fontSize: 14, color: '#2A5080', textDecoration: 'none' }}>← Zurück</Link>
      </div>

      <div style={S.body}>
        <h1 style={S.h1}>Datenschutzerklärung</h1>
        <p style={S.updated}>Stand: Juni 2025 · Gilt für amtsklar.at</p>

        <div style={S.note}>
          ⚠️ Vor Veröffentlichung: Ersetze alle markierten Felder [IN ECKIGEN KLAMMERN] mit deinen echten Daten.
        </div>

        {/* 1. Verantwortlicher */}
        <h2 style={S.h2}>1. Verantwortlicher</h2>
        <p style={S.p}>
          Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) und
          des Schweizer Datenschutzgesetzes (DSG) ist:
        </p>
        <div style={S.box}>
          <p style={{ ...S.p, marginBottom: 0 }}>
            <strong style={{ color: '#0F2440' }}>[DEIN_VORNAME_NACHNAME]</strong><br />
            [STRASSE UND HAUSNUMMER]<br />
            [PLZ] [ORT]<br />
            Schweiz<br /><br />
            E-Mail: <a href="mailto:[DEINE_EMAIL@DOMAIN.COM]" style={S.a}>[DEINE_EMAIL@DOMAIN.COM]</a>
          </p>
        </div>
        <p style={S.p}>
          Da sich der Verantwortliche in der Schweiz befindet und Dienstleistungen an
          Personen in der EU erbringt, gilt gemäß Art. 3 Abs. 2 DSGVO das europäische
          Datenschutzrecht. Die Schweiz verfügt über ein von der EU anerkanntes
          angemessenes Datenschutzniveau (Angemessenheitsbeschluss der Europäischen
          Kommission).
        </p>

        {/* 2. Überblick */}
        <h2 style={S.h2}>2. Überblick der Datenverarbeitung</h2>
        <p style={S.p}>
          AmtsKlar ist ein Informationsdienst zur KI-gestützten Erklärung
          österreichischer Behördenschreiben. Wir verarbeiten nur die Daten,
          die für den Betrieb des Dienstes zwingend erforderlich sind.
          Wir verkaufen keine personenbezogenen Daten an Dritte und erstellen
          keine Nutzerprofile für Werbezwecke.
        </p>

        {/* 3. Welche Daten */}
        <h2 style={S.h2}>3. Welche Daten wir verarbeiten</h2>

        <h3 style={S.h3}>3.1 Brieftext (KI-Analyse)</h3>
        <p style={S.p}>
          Wenn du einen Behördenbrief analysierst, wird der eingegebene Text
          zur Verarbeitung an die KI-Schnittstelle von Anthropic PBC übermittelt.
        </p>
        <ul style={S.ul}>
          <li style={S.li}><strong style={{ color: '#0F2440' }}>Art der Daten:</strong> Der von dir eingegebene Brieftext (ggf. personenbezogen)</li>
          <li style={S.li}><strong style={{ color: '#0F2440' }}>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) sowie Art. 6 Abs. 1 lit. a DSGVO (Einwilligung durch aktive Nutzung)</li>
          <li style={S.li}><strong style={{ color: '#0F2440' }}>Speicherung:</strong> Der Brieftext wird von AmtsKlar weder gespeichert noch protokolliert. Er wird ausschließlich für die Dauer der Analyse an Anthropic übermittelt.</li>
          <li style={S.li}><strong style={{ color: '#0F2440' }}>Hinweis:</strong> Entferne vor der Analyse sensible persönliche Daten (z.B. Sozialversicherungsnummer, Bankdaten) soweit möglich.</li>
        </ul>

        <h3 style={S.h3}>3.2 E-Mail-Adresse (Abonnement-Verifizierung)</h3>
        <p style={S.p}>
          Wenn du dein bestehendes Abonnement durch Eingabe deiner E-Mail-Adresse
          verifizierst, wird diese Adresse genutzt, um über die Paddle-API zu prüfen,
          ob ein aktives Abonnement vorliegt.
        </p>
        <ul style={S.ul}>
          <li style={S.li}><strong style={{ color: '#0F2440' }}>Art der Daten:</strong> E-Mail-Adresse</li>
          <li style={S.li}><strong style={{ color: '#0F2440' }}>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</li>
          <li style={S.li}><strong style={{ color: '#0F2440' }}>Speicherung:</strong> Lokal in deinem Browser (localStorage) zur Vermeidung wiederholter Eingabe. Keine Speicherung auf unseren Servern.</li>
        </ul>

        <h3 style={S.h3}>3.3 Nutzungszähler (Gratis-Limit)</h3>
        <p style={S.p}>
          Um das kostenlose Analyse-Kontingent (1 Analyse) zu verwalten, speichern
          wir lokal in deinem Browser (localStorage), wie viele Analysen du bereits
          durchgeführt hast.
        </p>
        <ul style={S.ul}>
          <li style={S.li}><strong style={{ color: '#0F2440' }}>Art der Daten:</strong> Numerischer Zähler (keine personenbezogenen Daten)</li>
          <li style={S.li}><strong style={{ color: '#0F2440' }}>Speicherort:</strong> Ausschließlich lokal in deinem Browser</li>
          <li style={S.li}><strong style={{ color: '#0F2440' }}>Löschung:</strong> Durch Löschen der Browser-Daten jederzeit möglich</li>
        </ul>

        <h3 style={S.h3}>3.4 Zahlungsdaten</h3>
        <p style={S.p}>
          Alle Zahlungs- und Abrechnungsdaten (Kreditkartendaten, Rechnungsadresse,
          Zahlungshistorie) werden ausschließlich von Paddle.com Europe Limited
          verarbeitet. AmtsKlar hat keinen Zugriff auf diese Daten und speichert
          sie nicht. Paddle ist als Merchant of Record selbst datenschutzrechtlich
          verantwortlich für die Zahlungsabwicklung. Informationen zur
          Datenschutzerklärung von Paddle:{' '}
          <a href="https://www.paddle.com/legal/privacy" target="_blank" rel="noopener noreferrer" style={S.a}>
            paddle.com/legal/privacy
          </a>.
        </p>

        <h3 style={S.h3}>3.5 Technische Verbindungsdaten (Server-Logs)</h3>
        <p style={S.p}>
          Beim Aufruf unserer Website werden durch Cloudflare automatisch technische
          Verbindungsdaten erfasst (IP-Adresse, Browsertyp, aufgerufene Seiten,
          Datum und Uhrzeit des Zugriffs). Diese Daten dienen ausschließlich dem
          sicheren Betrieb der Infrastruktur.
        </p>
        <ul style={S.ul}>
          <li style={S.li}><strong style={{ color: '#0F2440' }}>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an Betriebssicherheit)</li>
          <li style={S.li}><strong style={{ color: '#0F2440' }}>Speicherdauer:</strong> Gemäß Cloudflare-Policy, maximal 30 Tage</li>
        </ul>

        {/* 4. Drittanbieter */}
        <h2 style={S.h2}>4. Eingesetzte Drittanbieter</h2>

        <div style={S.box}>
          <h3 style={{ ...S.h3, marginTop: 0 }}>Anthropic PBC (KI-Analyse)</h3>
          <p style={{ ...S.p, marginBottom: 0 }}>
            <strong style={{ color: '#0F2440' }}>Zweck:</strong> Verarbeitung des Brieftexts zur KI-gestützten Analyse<br />
            <strong style={{ color: '#0F2440' }}>Sitz:</strong> 548 Market St, San Francisco, CA 94104, USA<br />
            <strong style={{ color: '#0F2440' }}>Datenschutz:</strong> <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" style={S.a}>anthropic.com/privacy</a><br />
            <strong style={{ color: '#0F2440' }}>Drittlandtransfer:</strong> Datenverarbeitung in den USA. Grundlage für den Transfer: Standardvertragsklauseln gemäß Art. 46 Abs. 2 lit. c DSGVO. Anthropic verpflichtet sich zur Einhaltung dieser Klauseln im Rahmen seiner API-Nutzungsbedingungen.<br />
            <strong style={{ color: '#0F2440' }}>Speicherung durch Anthropic:</strong> Laut Anthropic API-Nutzungsbedingungen werden API-Eingaben nicht für das Training von Modellen verwendet und nicht dauerhaft gespeichert (gültig ab API-Version 2023-06-01). Wir empfehlen, die aktuellen Anthropic-Datenschutzbestimmungen zu prüfen.
          </p>
        </div>

        <div style={S.box}>
          <h3 style={{ ...S.h3, marginTop: 0 }}>Paddle.com Europe Limited (Zahlungsabwicklung)</h3>
          <p style={{ ...S.p, marginBottom: 0 }}>
            <strong style={{ color: '#0F2440' }}>Zweck:</strong> Abonnementverwaltung, Zahlungsabwicklung, Rechnungsstellung<br />
            <strong style={{ color: '#0F2440' }}>Sitz:</strong> 15 Hollowell Road, Milton Malsor, Northampton, England, NN7 3AB<br />
            <strong style={{ color: '#0F2440' }}>Handelsregister:</strong> England und Wales, Nr. 10212606<br />
            <strong style={{ color: '#0F2440' }}>Datenschutz:</strong> <a href="https://www.paddle.com/legal/privacy" target="_blank" rel="noopener noreferrer" style={S.a}>paddle.com/legal/privacy</a><br />
            <strong style={{ color: '#0F2440' }}>Hinweis:</strong> Paddle ist Merchant of Record und eigenständig datenschutzrechtlich verantwortlich für Zahlungsdaten. AmtsKlar hat keinen Zugriff auf Zahlungsdaten.
          </p>
        </div>

        <div style={S.box}>
          <h3 style={{ ...S.h3, marginTop: 0 }}>Cloudflare, Inc. (Hosting & CDN)</h3>
          <p style={{ ...S.p, marginBottom: 0 }}>
            <strong style={{ color: '#0F2440' }}>Zweck:</strong> Hosting der Website, Content Delivery Network, DDoS-Schutz, SSL<br />
            <strong style={{ color: '#0F2440' }}>Sitz:</strong> 101 Townsend St, San Francisco, CA 94107, USA<br />
            <strong style={{ color: '#0F2440' }}>Datenschutz:</strong> <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" style={S.a}>cloudflare.com/privacypolicy</a><br />
            <strong style={{ color: '#0F2440' }}>Drittlandtransfer:</strong> Cloudflare verarbeitet Daten auch in der EU (Cloudflare verfügt über EU-Rechenzentren). Für US-Transfers: EU-US Data Privacy Framework (Angemessenheitsbeschluss 2023) sowie Standardvertragsklauseln.
          </p>
        </div>

        {/* 5. Keine Cookies */}
        <h2 style={S.h2}>5. Cookies und Tracking</h2>
        <p style={S.p}>
          AmtsKlar setzt <strong style={{ color: '#0F2440' }}>keine</strong> Werbe- oder
          Tracking-Cookies ein. Es wird kein Web-Analyse-Dienst (wie Google Analytics)
          verwendet. Wir setzen ausschließlich technisch notwendige Browser-Speicher
          (localStorage) ein, um den Nutzungszähler und die Abonnementstatus-Information
          lokal in deinem Browser zu speichern. Diese lokalen Speicher erfordern keine
          Einwilligung gemäß Art. 5 Abs. 3 ePrivacy-Richtlinie, da sie technisch
          notwendig für den Betrieb des Dienstes sind.
        </p>
        <p style={S.p}>
          Cloudflare kann zur Erkennung von Bot-Traffic technisch notwendige Cookies
          setzen. Diese dienen ausschließlich der Sicherheit und erfordern keine
          separate Einwilligung.
        </p>

        {/* 6. Speicherdauer */}
        <h2 style={S.h2}>6. Speicherdauer</h2>
        <p style={S.p}>
          Personenbezogene Daten werden nur so lange gespeichert, wie dies für den
          jeweiligen Verarbeitungszweck erforderlich ist:
        </p>
        <ul style={S.ul}>
          <li style={S.li}><strong style={{ color: '#0F2440' }}>Brieftext:</strong> Nicht gespeichert — wird ausschließlich für die Dauer der Analyse verarbeitet</li>
          <li style={S.li}><strong style={{ color: '#0F2440' }}>E-Mail-Adresse:</strong> Lokal im Browser bis zur manuellen Löschung; auf Anfrage sofortige Löschung</li>
          <li style={S.li}><strong style={{ color: '#0F2440' }}>Zahlungsdaten:</strong> Gemäß den Datenschutzbestimmungen von Paddle, gesetzliche Aufbewahrungsfristen (7 Jahre für Buchungsbelege)</li>
          <li style={S.li}><strong style={{ color: '#0F2440' }}>Server-Logs:</strong> Maximal 30 Tage (Cloudflare)</li>
        </ul>

        {/* 7. Rechte */}
        <h2 style={S.h2}>7. Deine Rechte</h2>
        <p style={S.p}>
          Als betroffene Person stehen dir folgende Rechte zu (Art. 15–22 DSGVO):
        </p>
        <ul style={S.ul}>
          <li style={S.li}><strong style={{ color: '#0F2440' }}>Auskunftsrecht (Art. 15 DSGVO):</strong> Recht auf Auskunft über verarbeitete personenbezogene Daten</li>
          <li style={S.li}><strong style={{ color: '#0F2440' }}>Berichtigungsrecht (Art. 16 DSGVO):</strong> Recht auf Berichtigung unrichtiger Daten</li>
          <li style={S.li}><strong style={{ color: '#0F2440' }}>Recht auf Löschung (Art. 17 DSGVO):</strong> Recht auf Löschung deiner Daten, soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen</li>
          <li style={S.li}><strong style={{ color: '#0F2440' }}>Recht auf Einschränkung (Art. 18 DSGVO):</strong> Recht auf Einschränkung der Verarbeitung</li>
          <li style={S.li}><strong style={{ color: '#0F2440' }}>Widerspruchsrecht (Art. 21 DSGVO):</strong> Recht auf Widerspruch gegen die Verarbeitung</li>
          <li style={S.li}><strong style={{ color: '#0F2440' }}>Recht auf Datenübertragbarkeit (Art. 20 DSGVO):</strong> Recht auf Erhalt deiner Daten in einem strukturierten Format</li>
          <li style={S.li}><strong style={{ color: '#0F2440' }}>Recht auf Widerruf einer Einwilligung (Art. 7 Abs. 3 DSGVO):</strong> Jederzeit mit Wirkung für die Zukunft</li>
        </ul>
        <p style={S.p}>
          Zur Ausübung deiner Rechte wende dich per E-Mail an:{' '}
          <a href="mailto:[DEINE_EMAIL@DOMAIN.COM]" style={S.a}>[DEINE_EMAIL@DOMAIN.COM]</a>.
          Wir bearbeiten Anfragen innerhalb von 30 Tagen.
        </p>

        {/* 8. Beschwerderecht */}
        <h2 style={S.h2}>8. Beschwerderecht bei Aufsichtsbehörden</h2>
        <p style={S.p}>
          Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.
          Als österreichischer Nutzer kannst du dich an die österreichische
          Datenschutzbehörde wenden:
        </p>
        <div style={S.box}>
          <p style={{ ...S.p, marginBottom: 0 }}>
            <strong style={{ color: '#0F2440' }}>Österreichische Datenschutzbehörde</strong><br />
            Barichgasse 40–42, 1030 Wien<br />
            Tel: +43 1 52 152-0<br />
            E-Mail: <a href="mailto:dsb@dsb.gv.at" style={S.a}>dsb@dsb.gv.at</a><br />
            Web: <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer" style={S.a}>dsb.gv.at</a>
          </p>
        </div>
        <p style={S.p}>
          Als Schweizer Nutzer kannst du dich an den Eidgenössischen Datenschutz-
          und Öffentlichkeitsbeauftragten (EDÖB) wenden:{' '}
          <a href="https://www.edoeb.admin.ch" target="_blank" rel="noopener noreferrer" style={S.a}>edoeb.admin.ch</a>.
        </p>

        {/* 9. Minderjährige */}
        <h2 style={S.h2}>9. Minderjährige</h2>
        <p style={S.p}>
          Das Angebot von AmtsKlar richtet sich nicht an Kinder unter 16 Jahren.
          Wir erheben wissentlich keine personenbezogenen Daten von Minderjährigen.
          Soweit uns bekannt wird, dass ein Kind unter 16 Jahren personenbezogene
          Daten übermittelt hat, werden diese unverzüglich gelöscht.
        </p>

        {/* 10. Änderungen */}
        <h2 style={S.h2}>10. Änderungen dieser Datenschutzerklärung</h2>
        <p style={S.p}>
          Wir behalten uns vor, diese Datenschutzerklärung bei Änderungen des
          Dienstes oder der Rechtslage anzupassen. Die jeweils aktuelle Fassung
          ist unter amtsklar.at/datenschutz abrufbar. Das Datum der letzten
          Änderung ist oben angegeben. Bei wesentlichen Änderungen werden
          registrierte Nutzer per E-Mail informiert.
        </p>
      </div>
    </div>
  )
}
