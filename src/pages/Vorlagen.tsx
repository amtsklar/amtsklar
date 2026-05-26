import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

type Plan = 'none' | 'verstehen' | 'handeln' | 'familie'

const vorlagen = [
  {
    datei: '01_Einspruch_Strafverfuegung.docx',
    icon: '🚨',
    titel: 'Einspruch gegen Strafverfügung',
    beschreibung: 'Für Strafverfügungen vom Magistrat, der BH oder Polizei — z.B. Parkstrafen, Geschwindigkeitsüberschreitungen, Verwaltungsübertretungen.',
    wann: 'Wenn du mit der Strafe nicht einverstanden bist oder den Vorwurf bestreitest. Ein Einspruch kostet nichts und führt zur Überprüfung.',
    frist: '2 Wochen ab Zustellung',
    fristFarbe: '#E05252',
    gesetz: '§ 49 VStG',
  },
  {
    datei: '02_Beschwerde_Finanzamt.docx',
    icon: '💰',
    titel: 'Beschwerde gegen Finanzamtsbescheid',
    beschreibung: 'Für Bescheide des Finanzamts betreffend Einkommensteuer, Umsatzsteuer, Nachzahlungen oder Rückforderungen.',
    wann: 'Wenn du mit der Berechnung oder dem Ergebnis nicht einverstanden bist. Auch bei SVS-Bescheiden für Selbstständige verwendbar.',
    frist: '1 Monat ab Zustellung',
    fristFarbe: '#E05252',
    gesetz: '§ 243 BAO',
  },
  {
    datei: '03_Widerspruch_AMS.docx',
    icon: '📋',
    titel: 'Beschwerde gegen AMS-Bescheid',
    beschreibung: 'Für Bescheide des AMS betreffend Sperrfristen, Leistungseinstellungen oder Rückforderungen von Arbeitslosengeld.',
    wann: 'Wenn du einen triftigen Grund für dein Verhalten hattest oder den Vorwurf bestreitest. Die AK hilft hier kostenlos!',
    frist: '4 Wochen ab Zustellung',
    fristFarbe: '#D4943A',
    gesetz: '§ 11 AlVG',
  },
  {
    datei: '04_Antwort_Inkasso.docx',
    icon: '📬',
    titel: 'Antwort auf Inkasso-Schreiben',
    beschreibung: 'Für Mahnschreiben von Inkassobüros. Enthält zwei Varianten: Forderung bestreiten ODER Ratenzahlung beantragen.',
    wann: 'Immer — egal ob du die Forderung anerkennst oder nicht. Wichtig: Inkassobüros dürfen NICHT pfänden, das können nur Gerichte!',
    frist: 'Keine gesetzliche Frist — rasch antworten empfohlen',
    fristFarbe: '#4CAF82',
    gesetz: 'Schuldnerberatung kostenlos',
  },
  {
    datei: '05_Einspruch_Miete.docx',
    icon: '🏠',
    titel: 'Einspruch gegen Mietkündigung',
    beschreibung: 'Für Kündigungsschreiben des Vermieters oder der Hausverwaltung. Prüft Formfehler, wichtige Gründe und soziale Härte.',
    wann: 'Wenn du die Kündigung anfechten möchtest — wegen Formfehlern, fehlendem wichtigem Grund oder sozialer Härte. Mietervereinigung hilft kostenlos!',
    frist: '4 Wochen — Klage beim Bezirksgericht',
    fristFarbe: '#D4943A',
    gesetz: '§ 33 MRG',
  },
]

const Logo = () => (
  <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
      <defs>
        <linearGradient id="vg" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D4A84B"/><stop offset="100%" stopColor="#A8731E"/>
        </linearGradient>
      </defs>
      <rect width="34" height="34" rx="8" fill="url(#vg)"/>
      <text x="17" y="24" fontFamily="Georgia,serif" fontSize="19" fontWeight="bold" fill="white" textAnchor="middle">§</text>
    </svg>
    <div>
      <div style={{ fontFamily: 'Libre Baskerville,serif', fontSize: 19, fontWeight: 700, lineHeight: 1 }}>
        <span style={{ color: '#0F2440', fontWeight: 400 }}>Amts</span>
        <span style={{ color: '#C9963A', fontWeight: 700 }}>Klar</span>
      </div>
      <div style={{ fontSize: 9, color: '#4A6A90', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
        Österreich · Behördenbriefe sofort verstehen
      </div>
    </div>
  </Link>
)

export default function Vorlagen() {
  const [isPaid, setIsPaid] = useState(false)
  const [plan, setPlan] = useState<Plan>('none')

  useEffect(() => {
    const savedPaid = localStorage.getItem('ak_paid') === 'true'
    const savedPlan = (localStorage.getItem('ak_plan') || 'none') as Plan
    setIsPaid(savedPaid)
    setPlan(savedPlan)
  }, [])

  // Darf der User downloaden? Nur Handeln & Familie
  const canDownload = isPaid && (plan === 'handeln' || plan === 'familie')

  return (
    <div style={{ background: '#EEF4FB', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid #C5D8ED',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#FFFFFF', boxShadow: '0 1px 12px rgba(15,36,64,0.08)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <Logo />
        <Link to="/" style={{ fontSize: 14, color: '#2A5080', textDecoration: 'none' }}>← Zurück</Link>
      </div>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Titel */}
        <h1 style={{ fontFamily: 'Libre Baskerville,serif', fontSize: 32, fontWeight: 700, color: '#0F2440', marginBottom: 8 }}>
          Mustervorlagen
        </h1>
        <p style={{ fontSize: 16, color: '#2A5080', lineHeight: 1.7, marginBottom: 24 }}>
          Professionelle österreichische Rechtsbriefe — fertig zum Ausfüllen, ausdrucken und per Einschreiben senden.
        </p>

        {/* Hinweis Platzhalter */}
        <div style={{ background: 'rgba(201,150,58,0.08)', border: '1px solid rgba(201,150,58,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14, color: '#8B6020' }}>
          ✏️ Platzhalter <strong>[IN ECKIGEN KLAMMERN]</strong> durch Ihre echten Daten ersetzen. Bevorzugt per <strong>Einschreiben mit Rückschein</strong> versenden und Kopie aufbewahren.
        </div>

        {/* Paywall Banner wenn kein Zugang */}
        {!canDownload && (
          <div style={{
            background: '#FFFFFF', border: '2px solid rgba(201,150,58,0.4)',
            borderRadius: 14, padding: '24px', marginBottom: 32,
            display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
            boxShadow: '0 4px 20px rgba(201,150,58,0.1)',
          }}>
            <div style={{ fontSize: 40 }}>🔒</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Libre Baskerville,serif', fontSize: 18, fontWeight: 700, color: '#0F2440', marginBottom: 6 }}>
                Download nur für Handeln & Familie
              </div>
              <div style={{ fontSize: 14, color: '#2A5080', lineHeight: 1.6 }}>
                {isPaid && plan === 'verstehen'
                  ? 'Mit deinem Verstehen-Paket kannst du die Vorlagen ansehen, aber nicht herunterladen. Upgrade auf Handeln um alle Vorlagen zu downloaden.'
                  : 'Die Mustervorlagen sind ab dem Handeln-Paket verfügbar. Du kannst die Vorlagen hier ansehen — für den Download wähle Handeln oder Familie.'
                }
              </div>
            </div>
            <Link to="/#preise" style={{
              background: 'linear-gradient(135deg,#B8832A,#D4A84B)',
              color: '#FFFFFF', padding: '12px 24px', borderRadius: 10,
              fontSize: 14, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
            }}>
              {isPaid ? 'Auf Handeln upgraden →' : 'Paket wählen →'}
            </Link>
          </div>
        )}

        {/* Vorlagen Liste */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {vorlagen.map((v, i) => (
            <div key={i} style={{
              background: '#FFFFFF', border: '1px solid #C5D8ED',
              borderRadius: 16, padding: '24px',
              opacity: canDownload ? 1 : 0.92,
            }}>
              {/* Kopfzeile */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flex: 1 }}>
                  <div style={{ fontSize: 32, flexShrink: 0 }}>{v.icon}</div>
                  <div>
                    <div style={{ fontFamily: 'Libre Baskerville,serif', fontSize: 17, fontWeight: 700, color: '#0F2440', marginBottom: 4 }}>
                      {v.titel}
                    </div>
                    <div style={{ fontSize: 12, color: v.fristFarbe, fontWeight: 600 }}>
                      ⏰ {v.frist} · {v.gesetz}
                    </div>
                  </div>
                </div>

                {/* Download Button oder Lock */}
                {canDownload ? (
                  <a
                    href={`/vorlagen/${v.datei}`}
                    download={v.datei}
                    style={{
                      background: 'linear-gradient(135deg,#B8832A,#D4A84B)',
                      color: '#FFFFFF', padding: '10px 20px', borderRadius: 10,
                      fontSize: 14, fontWeight: 700, textDecoration: 'none',
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}
                  >
                    ⬇️ .docx herunterladen
                  </a>
                ) : (
                  <div style={{
                    background: '#F5F8FC', border: '1px solid #C5D8ED',
                    borderRadius: 10, padding: '10px 20px',
                    fontSize: 14, color: '#9BBAD4', whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    🔒 Handeln & Familie
                  </div>
                )}
              </div>

              {/* Beschreibung */}
              <div style={{ fontSize: 14, color: '#1A3A5C', lineHeight: 1.7, marginBottom: 12 }}>
                {v.beschreibung}
              </div>

              {/* Empfehlung */}
              <div style={{
                background: 'rgba(76,175,130,0.06)', border: '1px solid rgba(76,175,130,0.2)',
                borderRadius: 8, padding: '10px 14px',
                fontSize: 13, color: '#1A6A50', lineHeight: 1.6,
              }}>
                💡 <strong>Wann verwenden?</strong> {v.wann}
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div style={{
          background: '#F5F8FC', border: '1px solid #C5D8ED',
          borderRadius: 12, padding: '16px 20px', marginTop: 32,
          fontSize: 13, color: '#6A8AAA', lineHeight: 1.7,
        }}>
          ⚖️ <strong style={{ color: '#2A5080' }}>Rechtlicher Hinweis:</strong> Diese Mustervorlagen dienen als Orientierungshilfe und ersetzen keine individuelle Rechtsberatung. Bei wichtigen Angelegenheiten: Rechtsanwalt oder Arbeiterkammer (kostenlos für Mitglieder) konsultieren.
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link to="/analyse" style={{
            background: 'linear-gradient(135deg,#B8832A,#D4A84B)',
            color: '#FFFFFF', padding: '14px 32px', borderRadius: 12,
            fontSize: 16, fontWeight: 700, textDecoration: 'none',
          }}>
            Brief jetzt analysieren →
          </Link>
        </div>

      </div>
    </div>
  )
}
