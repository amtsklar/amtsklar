import { Link } from 'react-router-dom'

// ═══════════════════════════════════════════════════════════════════
// ALLGEMEINE GESCHÄFTSBEDINGUNGEN (AGB)
// Österreichisches Konsumentenschutzrecht (KSchG), KFG, FAGG
// Bitte ersetze alle Felder [IN ECKIGEN KLAMMERN]
// ═══════════════════════════════════════════════════════════════════

const S = {
  page: { background: '#182638', minHeight: '100vh', color: '#EDF2FA', fontFamily: 'DM Sans,sans-serif' },
  header: { padding: '14px 20px', borderBottom: '1px solid #2A4A6A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  body: { maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' },
  h1: { fontFamily: 'Libre Baskerville,serif', fontSize: 32, fontWeight: 700, color: '#EDF2FA', marginBottom: 8 } as React.CSSProperties,
  h2: { fontFamily: 'Libre Baskerville,serif', fontSize: 20, fontWeight: 700, color: '#EDF2FA', marginTop: 40, marginBottom: 12, paddingTop: 24, borderTop: '1px solid #2A4A6A' } as React.CSSProperties,
  h3: { fontSize: 15, fontWeight: 600, color: '#C9963A', marginTop: 20, marginBottom: 8 } as React.CSSProperties,
  p: { fontSize: 15, color: '#C8D8EC', lineHeight: 1.75, marginBottom: 12 } as React.CSSProperties,
  ul: { paddingLeft: 20, marginBottom: 16 } as React.CSSProperties,
  li: { fontSize: 15, color: '#C8D8EC', lineHeight: 1.75, marginBottom: 6 } as React.CSSProperties,
  box: { background: '#1E3248', border: '1px solid #2A4A6A', borderRadius: 10, padding: '16px 20px', marginBottom: 16 } as React.CSSProperties,
  warn: { background: 'rgba(224,82,82,0.08)', border: '1px solid rgba(224,82,82,0.25)', borderRadius: 10, padding: '14px 18px', fontSize: 14, color: '#E08080', lineHeight: 1.65, marginBottom: 20 } as React.CSSProperties,
  note: { background: 'rgba(201,150,58,0.08)', border: '1px solid rgba(201,150,58,0.2)', borderRadius: 10, padding: '14px 18px', fontSize: 14, color: '#C9963A', lineHeight: 1.65, marginBottom: 28 } as React.CSSProperties,
  updated: { fontSize: 13, color: '#6A8AAA', marginBottom: 32 } as React.CSSProperties,
  a: { color: '#C9963A' } as React.CSSProperties,
}

export default function AGB() {
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
        <h1 style={S.h1}>Allgemeine Geschäftsbedingungen</h1>
        <p style={S.updated}>Stand: Juni 2025 · Gilt für amtsklar.at</p>

        <div style={S.note}>
          ⚠️ Vor Veröffentlichung: Ersetze alle markierten Felder [IN ECKIGEN KLAMMERN] mit deinen echten Daten.
        </div>

        {/* § 1 */}
        <h2 style={S.h2}>§ 1 Anbieter und Geltungsbereich</h2>
        <p style={S.p}>
          Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung des
          Informationsdienstes AmtsKlar, betrieben unter amtsklar.at von:
        </p>
        <div style={S.box}>
          <p style={{ ...S.p, marginBottom: 0 }}>
            <strong style={{ color: '#EDF2FA' }}>[DEIN_VORNAME_NACHNAME]</strong><br />
            [STRASSE UND HAUSNUMMER]<br />
            [PLZ] [ORT], Schweiz<br />
            E-Mail: <a href="mailto:[DEINE_EMAIL@DOMAIN.COM]" style={S.a}>[DEINE_EMAIL@DOMAIN.COM]</a><br />
            (nachfolgend „Anbieter")
          </p>
        </div>
        <p style={S.p}>
          Die AGB gelten für alle Nutzer des Dienstes amtsklar.at,
          unabhängig davon, ob sie den Dienst kostenlos oder gegen Entgelt nutzen.
          Abweichende Bedingungen des Nutzers werden nicht anerkannt, sofern der
          Anbieter ihnen nicht ausdrücklich schriftlich zugestimmt hat.
        </p>

        {/* § 2 */}
        <h2 style={S.h2}>§ 2 Beschreibung des Dienstes</h2>

        <h3 style={S.h3}>2.1 Leistungsgegenstand</h3>
        <p style={S.p}>
          AmtsKlar ist ein KI-gestützter Informationsdienst, der Nutzern ermöglicht,
          österreichische Behördenschreiben (wie Steuerbescheide, Strafverfügungen,
          AMS-Schreiben, Gerichtsbriefe etc.) in verständliche Sprache übersetzen zu
          lassen. Der Dienst liefert allgemeine Informationen zu:
        </p>
        <ul style={S.ul}>
          <li style={S.li}>der Art und dem Inhalt des eingereichten Behördenschreibens</li>
          <li style={S.li}>relevanten Fristen und Handlungsoptionen</li>
          <li style={S.li}>anwendbaren Rechtsgrundlagen des österreichischen Rechts</li>
          <li style={S.li}>möglichen Rechtsmitteln und kostenlosen Beratungsangeboten</li>
        </ul>

        <h3 style={S.h3}>2.2 Ausdrücklich kein Rechtsdienstleistungsangebot</h3>
        <div style={S.warn}>
          ⚠️ AmtsKlar ist <strong>kein Rechtsdienstleistungsunternehmen</strong> und
          bietet <strong>keine Rechtsberatung</strong> an. Die Analyse-Ergebnisse sind
          allgemeine Informationen und stellen keine individuell auf den Nutzer
          zugeschnittene rechtliche Empfehlung dar. Durch die Nutzung von AmtsKlar
          entsteht kein Mandats-, Beratungs- oder sonstiges rechtliches Verhältnis
          zwischen Anbieter und Nutzer. Für rechtlich verbindliche Auskünfte ist
          ein zugelassener Rechtsanwalt oder eine anerkannte Beratungseinrichtung
          (z.B. Arbeiterkammer) zu konsultieren.
        </div>

        <h3 style={S.h3}>2.3 KI-Technologie und Fehlerrisiko</h3>
        <p style={S.p}>
          Die Analysen werden mittels KI-Sprachmodell-Technologie (Anthropic Claude)
          generiert. KI-Systeme können inhaltliche Fehler, Unvollständigkeiten oder
          veraltete Informationen liefern. Der Anbieter übernimmt keine Garantie
          für die Richtigkeit, Vollständigkeit oder Aktualität der generierten Inhalte.
          Nutzer sind gehalten, wichtige Informationen vor rechtlich erheblichen
          Handlungen durch eine Fachkraft zu überprüfen.
        </p>

        <h3 style={S.h3}>2.4 Verfügbarkeit</h3>
        <p style={S.p}>
          Der Anbieter bemüht sich um eine hohe Verfügbarkeit des Dienstes, übernimmt
          jedoch keine Garantie für ununterbrochene Verfügbarkeit. Wartungsarbeiten,
          technische Störungen oder Abhängigkeiten von Drittdiensten (Anthropic API,
          Cloudflare) können temporäre Unterbrechungen verursachen.
        </p>

        {/* § 3 */}
        <h2 style={S.h2}>§ 3 Vertragsschluss und Zahlungsabwicklung</h2>

        <h3 style={S.h3}>3.1 Merchant of Record</h3>
        <p style={S.p}>
          Die gesamte Zahlungsabwicklung, Rechnungsstellung, Abonnementverwaltung
          und der damit verbundene Kaufvertrag über das kostenpflichtige Abonnement
          wird ausschließlich über <strong style={{ color: '#EDF2FA' }}>Paddle.com Europe Limited</strong>
          {' '}(Handelsregister England und Wales, Nr. 10212606) als Merchant of Record
          abgewickelt. Der rechtsgültige Kaufvertrag besteht zwischen dem Nutzer und
          Paddle, nicht direkt zwischen Nutzer und Anbieter.
        </p>

        <h3 style={S.h3}>3.2 Kostenloses Kontingent</h3>
        <p style={S.p}>
          Ohne Abonnement steht jedem Nutzer eine (1) kostenlose Analyse zur Verfügung.
          Der Anbieter behält sich vor, dieses kostenlose Kontingent jederzeit ohne
          Vorankündigung zu ändern oder einzustellen.
        </p>

        <h3 style={S.h3}>3.3 Kostenpflichtiges Abonnement</h3>
        <p style={S.p}>
          Das Monatsabonnement (derzeit €2,99 inkl. der jeweils gültigen gesetzlichen
          Mehrwertsteuer gemäß Paddle-Rechnungslegung) berechtigt zur unbegrenzten
          Nutzung des Analyse-Dienstes im Rahmen einer fairen Nutzung. Preisänderungen
          werden dem Nutzer mindestens 30 Tage vor Inkrafttreten mitgeteilt.
        </p>

        <h3 style={S.h3}>3.4 Abonnementverlängerung</h3>
        <p style={S.p}>
          Das Abonnement verlängert sich automatisch monatlich, sofern es nicht
          gemäß § 4 rechtzeitig gekündigt wird. Die Abrechnung erfolgt durch Paddle.
        </p>

        {/* § 4 */}
        <h2 style={S.h2}>§ 4 Kündigung und Widerrufsrecht</h2>

        <h3 style={S.h3}>4.1 Ordentliche Kündigung</h3>
        <p style={S.p}>
          Das Abonnement kann jederzeit ohne Einhaltung einer Kündigungsfrist über
          das Paddle-Kundenportal oder per E-Mail an den Anbieter gekündigt werden.
          Die Kündigung wird zum Ende der laufenden Abrechnungsperiode wirksam.
          Bereits bezahlte Beträge werden nicht anteilig erstattet.
        </p>

        <h3 style={S.h3}>4.2 Widerrufsrecht für Verbraucher (FAGG)</h3>
        <p style={S.p}>
          Als Verbraucher im Sinne des Österreichischen Fern- und Auswärtige-Geschäfte-Gesetzes
          (FAGG) steht dir grundsätzlich ein 14-tägiges Widerrufsrecht zu.
        </p>
        <div style={S.box}>
          <p style={{ ...S.p, marginBottom: 8, color: '#EDF2FA', fontWeight: 600 }}>
            Erlöschen des Widerrufsrechts bei sofortiger Nutzung
          </p>
          <p style={{ ...S.p, marginBottom: 0 }}>
            Wenn du ausdrücklich zustimmst, dass mit der Erbringung des Dienstes
            sofort begonnen wird, und du zur Kenntnis nimmst, dass du damit dein
            Widerrufsrecht verlierst, sobald der Vertrag vollständig erfüllt ist,
            erlischt das Widerrufsrecht. Da AmtsKlar ein sofort nutzbarer Digitaldienst
            ist, der unmittelbar nach Abonnementabschluss vollumfänglich zur Verfügung
            steht, stimme bitte dem sofortigen Beginn ausdrücklich zu. Dieser Hinweis
            erscheint im Paddle-Checkout-Prozess.
          </p>
        </div>
        <p style={S.p}>
          Möchtest du dein Widerrufsrecht ausüben, ohne die sofortige Nutzung
          zuzustimmen, wende dich binnen 14 Tagen ab Vertragsschluss an:{' '}
          <a href="mailto:[DEINE_EMAIL@DOMAIN.COM]" style={S.a}>[DEINE_EMAIL@DOMAIN.COM]</a>.
          Paddle verwaltet die Rückabwicklung in diesem Fall.
        </p>

        {/* § 5 */}
        <h2 style={S.h2}>§ 5 Nutzungsbedingungen und Pflichten des Nutzers</h2>

        <h3 style={S.h3}>5.1 Erlaubte Nutzung</h3>
        <p style={S.p}>
          Der Dienst darf ausschließlich für private, nicht-kommerzielle Zwecke
          genutzt werden. Die Nutzung für gewerbliche Rechtsberatung, automatisierte
          Massenabfragen oder den Weiterverkauf von Analyse-Ergebnissen ist
          ausdrücklich untersagt.
        </p>

        <h3 style={S.h3}>5.2 Eingaben des Nutzers</h3>
        <p style={S.p}>
          Der Nutzer ist dafür verantwortlich, welche Inhalte er in den Dienst
          eingibt. Verboten ist die Eingabe von:
        </p>
        <ul style={S.ul}>
          <li style={S.li}>Inhalten, die gegen geltendes Recht verstoßen</li>
          <li style={S.li}>personenbezogenen Daten Dritter ohne deren Einwilligung</li>
          <li style={S.li}>Inhalten, die geistiges Eigentum Dritter verletzen</li>
          <li style={S.li}>absichtlich falschen oder irreführenden Inhalten</li>
        </ul>
        <p style={S.p}>
          Der Nutzer wird empfohlen, unnötige persönliche Daten (z.B. Sozialversicherungs-
          nummer, Bankdaten, Passwortangaben) vor der Eingabe unkenntlich zu machen.
        </p>

        <h3 style={S.h3}>5.3 Faire Nutzung</h3>
        <p style={S.p}>
          Der Anbieter behält sich vor, Nutzern bei missbräuchlicher oder
          außergewöhnlich hoher Nutzung, die den Betrieb des Dienstes für andere
          Nutzer beeinträchtigt, den Zugang zu beschränken oder zu sperren.
        </p>

        {/* § 6 */}
        <h2 style={S.h2}>§ 6 Haftungsbeschränkung</h2>

        <h3 style={S.h3}>6.1 Haftungsausschluss für Analyseinhalt</h3>
        <p style={S.p}>
          Der Anbieter haftet nicht für Schäden, die dadurch entstehen, dass ein
          Nutzer auf Basis einer AmtsKlar-Analyse rechtliche oder sonstige
          Entscheidungen trifft, ohne die Informationen durch eine Fachkraft
          prüfen zu lassen. Die Nutzung des Dienstes erfolgt auf eigene Gefahr
          des Nutzers.
        </p>

        <h3 style={S.h3}>6.2 Haftung bei Vorsatz und grober Fahrlässigkeit</h3>
        <p style={S.p}>
          Von der vorstehenden Haftungsbeschränkung ausgenommen ist die Haftung
          für Schäden, die auf vorsätzlichem oder grob fahrlässigem Verhalten
          des Anbieters beruhen, sowie Schäden aus der Verletzung von Leben,
          Körper und Gesundheit.
        </p>

        <h3 style={S.h3}>6.3 Höchstbetrag der Haftung</h3>
        <p style={S.p}>
          Soweit die Haftung des Anbieters nicht ausgeschlossen ist, ist sie
          auf die vom Nutzer in den letzten 12 Monaten vor dem schadensbegründenden
          Ereignis tatsächlich bezahlten Abonnementgebühren begrenzt, maximal
          jedoch auf €100.
        </p>

        <h3 style={S.h3}>6.4 Keine Haftung für externe Links</h3>
        <p style={S.p}>
          Der Dienst enthält Links zu externen Websites (z.B. RIS.bka.gv.at).
          Für die Inhalte externer Seiten übernimmt der Anbieter keine Haftung.
        </p>

        {/* § 7 */}
        <h2 style={S.h2}>§ 7 Geistiges Eigentum</h2>
        <p style={S.p}>
          Die Software, das Design und sämtliche originären Inhalte von AmtsKlar
          (ausgenommen Gesetzestexte aus dem RIS) sind urheberrechtlich geschützt.
          Die Nutzung des Dienstes begründet keine Lizenz zur Vervielfältigung,
          Bearbeitung oder kommerziellen Verwertung dieser Inhalte.
        </p>
        <p style={S.p}>
          Gesetzestexte, die im Rahmen der Analyse zitiert werden, stammen aus dem
          Rechtsinformationssystem des Bundes (RIS, ris.bka.gv.at) und stehen
          unter der Creative Commons Attribution 4.0 International Lizenz (CC BY 4.0).
        </p>

        {/* § 8 */}
        <h2 style={S.h2}>§ 8 Änderungen des Dienstes und der AGB</h2>
        <p style={S.p}>
          Der Anbieter behält sich das Recht vor, diese AGB mit einer Ankündigungsfrist
          von 30 Tagen zu ändern. Änderungen werden auf amtsklar.at/agb
          veröffentlicht. Die Fortsetzung der Nutzung nach Ablauf der Ankündigungsfrist
          gilt als Zustimmung zu den geänderten AGB. Nutzer, die der Änderung nicht
          zustimmen, können das Abonnement vor Inkrafttreten der Änderung kündigen.
        </p>
        <p style={S.p}>
          Funktionale Änderungen und Verbesserungen des Dienstes können jederzeit
          ohne gesonderte Ankündigung vorgenommen werden, sofern sie keine
          wesentliche Verschlechterung der Kernleistung darstellen.
        </p>

        {/* § 9 */}
        <h2 style={S.h2}>§ 9 Datenschutz</h2>
        <p style={S.p}>
          Informationen zur Verarbeitung personenbezogener Daten sind in der
          separaten Datenschutzerklärung unter{' '}
          <Link to="/datenschutz" style={S.a}>amtsklar.at/datenschutz</Link>{' '}
          geregelt, die integraler Bestandteil dieser AGB ist.
        </p>

        {/* § 10 */}
        <h2 style={S.h2}>§ 10 Anwendbares Recht und Gerichtsstand</h2>

        <h3 style={S.h3}>10.1 Anwendbares Recht</h3>
        <p style={S.p}>
          Für diese AGB und alle Rechtsbeziehungen zwischen Anbieter und Nutzer
          gilt schweizerisches Recht unter Ausschluss des UN-Kaufrechts (CISG).
          Für österreichische Verbraucher bleiben die zwingenden
          Verbraucherschutzvorschriften des österreichischen Rechts (insbesondere
          KSchG, FAGG) unberührt.
        </p>

        <h3 style={S.h3}>10.2 Gerichtsstand</h3>
        <p style={S.p}>
          Für Streitigkeiten mit Unternehmern ist ausschließlicher Gerichtsstand
          [ORT], Schweiz. Für Streitigkeiten mit Verbrauchern mit Wohnsitz in
          Österreich gelten die zwingenden Gerichtsstandsvorschriften der
          Österreichischen Zivilprozessordnung (§ 14 KSchG: Gericht des Wohnsitzes
          des Verbrauchers).
        </p>

        <h3 style={S.h3}>10.3 Online-Streitbeilegung</h3>
        <p style={S.p}>
          Die EU-Kommission stellt eine Plattform zur Online-Streitbeilegung bereit:{' '}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" style={S.a}>
            ec.europa.eu/consumers/odr
          </a>.
          Wir sind weder bereit noch verpflichtet, an Streitbeilegungsverfahren vor
          einer Verbraucherschlichtungsstelle teilzunehmen, sofern keine gesetzliche
          Verpflichtung besteht.
        </p>

        {/* § 11 */}
        <h2 style={S.h2}>§ 11 Salvatorische Klausel</h2>
        <p style={S.p}>
          Sollten einzelne Bestimmungen dieser AGB ganz oder teilweise unwirksam
          oder undurchführbar sein oder werden, so berührt dies die Wirksamkeit
          der übrigen Bestimmungen nicht. An die Stelle der unwirksamen Bestimmung
          tritt diejenige wirksame Regelung, die dem wirtschaftlichen Zweck der
          unwirksamen Bestimmung am nächsten kommt.
        </p>

        {/* Kontakt */}
        <h2 style={S.h2}>Kontakt</h2>
        <p style={S.p}>
          Bei Fragen zu diesen AGB wende dich an:{' '}
          <a href="mailto:[DEINE_EMAIL@DOMAIN.COM]" style={S.a}>[DEINE_EMAIL@DOMAIN.COM]</a>
        </p>
      </div>
    </div>
  )
}
