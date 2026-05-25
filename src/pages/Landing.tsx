import { useState } from 'react'
import { Link } from 'react-router-dom'

// ═══════════════════════════════════════════════════════════════════
// AmtsKlar — Landing Page
// 3 Preispakete: Verstehen / Handeln / Familie
// ═══════════════════════════════════════════════════════════════════

// ── Logo Komponente ───────────────────────────────────────────────
const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D4A84B"/>
          <stop offset="100%" stopColor="#A8731E"/>
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="9" fill="url(#logoGrad)"/>
      <text x="18" y="26" fontFamily="Georgia,serif" fontSize="21" fontWeight="bold" fill="white" textAnchor="middle">§</text>
    </svg>
    <div>
      <div style={{ fontFamily: 'Libre Baskerville,serif', fontSize: 20, fontWeight: 700, lineHeight: 1 }}>
        <span style={{ color: '#0F2440', fontWeight: 400 }}>Amts</span>
        <span style={{ color: '#C9963A', fontWeight: 700 }}>Klar</span>
      </div>
      <div style={{ fontSize: 9, color: '#4A6A90', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
        Österreich · Behördenbriefe sofort verstehen
      </div>
    </div>
  </div>
)

// ── Feature-Liste ─────────────────────────────────────────────────
const features = [
  { icon: '⚡', title: 'Sofortige Analyse', desc: 'Brief einfügen → in Sekunden verstehen was er bedeutet' },
  { icon: '⚖️', title: '45 Rechtsbereiche', desc: 'Finanzamt, AMS, Gericht, Mietrecht, Fremdenrecht und mehr' },
  { icon: '🗓', title: 'Fristen & Deadlines', desc: 'Welche Frist gilt und was passiert wenn du sie verpasst' },
  { icon: '🚨', title: 'Pflichtaktion', desc: 'Eine klare Handlungsempfehlung: was genau jetzt zu tun ist' },
  { icon: '✉️', title: 'KI schreibt den Brief', desc: 'Fertiger Antwortbrief zum Ausdrucken — nur noch unterschreiben' },
  { icon: '🔗', title: 'Live RIS-Prüfung', desc: 'Gesetze direkt auf ris.bka.gv.at prüfen — immer aktuell' },
]

// ── FAQ ───────────────────────────────────────────────────────────
const faqs = [
  {
    q: 'Für welche Briefe funktioniert AmtsKlar?',
    a: 'Alle österreichischen Behördenschreiben: Finanzamt, AMS, ÖGK, Gericht, Magistrat, BH, Mietrecht, Fremdenrecht, Straf-, Zivil- und Verwaltungsrecht — 45 Rechtsbereiche abgedeckt.'
  },
  {
    q: 'Was ist der Unterschied zwischen den Paketen?',
    a: 'Verstehen (€2,99) erklärt den Brief und zeigt die nächsten Schritte. Handeln (€4,99) schreibt zusätzlich den fertigen Antwortbrief den du nur noch ausdruckst und abschickst. Familie (€7,99) gilt für bis zu 5 Personen im selben Haushalt.'
  },
  {
    q: 'Schreibt AmtsKlar den Antwortbrief wirklich komplett?',
    a: 'Ja. Die KI generiert einen vollständigen, rechtlich korrekten Antwortbrief passend zu deinem Bescheid. Du musst nur noch deinen Namen, die Aktenzahl und deine Adresse einfügen — alles andere ist fertig. Verfügbar ab dem Handeln-Paket.'
  },
  {
    q: 'Ist das eine Rechtsberatung?',
    a: 'Nein. AmtsKlar informiert und erklärt — ersetzt keine Rechtsberatung durch einen zugelassenen Anwalt. Bei komplexen Fällen empfehlen wir immer zusätzlich die kostenlose Beratung der Arbeiterkammer.'
  },
  {
    q: 'Kann ich jederzeit kündigen?',
    a: 'Ja, jederzeit ohne Kündigungsfrist über das Paddle-Kundenportal oder per E-Mail. Keine Mindestlaufzeit.'
  },
]

// ── Haupt-Komponente ──────────────────────────────────────────────
export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [jaehrlich, setJaehrlich] = useState(false)

  // Preise: monatlich und jährlich (2 Monate gratis)
  const preise = {
    verstehen: { monat: 2.99, jahr: 2.49 },
    handeln:   { monat: 4.99, jahr: 4.16 },
    familie:   { monat: 7.99, jahr: 6.66 },
  }

  const preis = (plan: keyof typeof preise) =>
    jaehrlich ? preise[plan].jahr : preise[plan].monat

  // Gemeinsame Styles
  const S = {
    btn: {
      display: 'inline-block',
      background: 'linear-gradient(135deg,#B8832A,#D4A84B)',
      color: '#FFFFFF',
      padding: '16px 32px',
      borderRadius: 12,
      fontSize: 17,
      fontWeight: 700,
      textDecoration: 'none',
    } as React.CSSProperties,
    card: {
      background: '#FFFFFF',
      border: '1px solid #C5D8ED',
      borderRadius: 12,
      padding: 20,
    } as React.CSSProperties,
    check: {
      color: '#C9963A',
      fontWeight: 700,
      marginRight: 8,
      flexShrink: 0,
    } as React.CSSProperties,
    cross: {
      color: '#BDD0E0',
      fontWeight: 700,
      marginRight: 8,
      flexShrink: 0,
    } as React.CSSProperties,
  }

  return (
    <div style={{ background: '#EEF4FB', minHeight: '100vh' }}>

      {/* ── NAVIGATION ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderBottom: '1px solid #C5D8ED',
        position: 'sticky', top: 0, background: '#FFFFFF', zIndex: 50,
        boxShadow: '0 1px 12px rgba(15,36,64,0.08)'
      }}>
        <Logo />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="#preise" style={{ fontSize: 14, color: '#2A5080', textDecoration: 'none' }}>Preise</a>
          <Link to="/analyse" style={{ ...S.btn, padding: '8px 18px', fontSize: 14 }}>
            Jetzt testen →
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ textAlign: 'center', padding: '80px 24px 60px', maxWidth: 700, margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(201,150,58,0.12)', border: '1px solid rgba(201,150,58,0.25)',
          borderRadius: 20, padding: '6px 16px', fontSize: 13, color: '#C9963A',
          marginBottom: 24, fontWeight: 500
        }}>
          🇦🇹 Speziell für Österreich · 45 Rechtsbereiche
        </div>

        <h1 style={{
          fontFamily: 'Libre Baskerville,serif',
          fontSize: 'clamp(32px,6vw,52px)',
          fontWeight: 700, lineHeight: 1.15, marginBottom: 20, color: '#0F2440'
        }}>
          Brief vom Amt erhalten?<br />
          <span style={{ color: '#C9963A' }}>Jetzt sofort verstehen.</span>
        </h1>

        <p style={{ fontSize: 18, color: '#2A5080', lineHeight: 1.7, maxWidth: 540, margin: '0 auto 36px' }}>
          Einfügen — analysieren — fertig. Was bedeutet der Brief? Welche Frist gilt?
          Die KI erklärt es und schreibt den Antwortbrief.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/analyse" style={S.btn}>Brief kostenlos analysieren →</Link>
          <a href="#preise" style={{
            border: '1.5px solid #C5D8ED', color: '#2A5080',
            padding: '16px 24px', borderRadius: 12, fontSize: 15, textDecoration: 'none'
          }}>
            Alle Pakete ansehen
          </a>
        </div>

        <p style={{ marginTop: 16, fontSize: 13, color: '#6A8AAA' }}>
          1 kostenlose Analyse · Danach ab €2,49/Monat · Jederzeit kündbar
        </p>
      </section>

      {/* ── DEMO-VORSCHAU ── */}
      <section style={{ maxWidth: 640, margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #C5D8ED', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(15,36,64,0.08)' }}>
          {/* Browser-Bar */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #C5D8ED', display: 'flex', gap: 6, alignItems: 'center', background: '#F8FBFF' }}>
            {['#E05252','#D4943A','#4CAF82'].map((c,i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }}/>
            ))}
            <span style={{ fontSize: 12, color: '#6A8AAA', marginLeft: 8 }}>amtsklar.at/analyse</span>
          </div>
          {/* Inhalt */}
          <div style={{ padding: 20 }}>
            {/* Pflichtaktion */}
            <div style={{ background: 'rgba(224,82,82,0.08)', border: '1px solid rgba(224,82,82,0.2)', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20 }}>🚨</span>
                <div>
                  <div style={{ fontSize: 10, color: '#4A6A90', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
                    Nächste Pflichtaktion
                  </div>
                  <div style={{ fontFamily: 'serif', fontSize: 17, fontWeight: 700, color: '#0F2440' }}>
                    Einspruch schriftlich einbringen
                  </div>
                  <div style={{ fontSize: 12, color: '#E05252', marginTop: 4 }}>
                    🗓 Innerhalb 2 Wochen ab Zustellung
                  </div>
                </div>
              </div>
            </div>
            {/* Erklärung */}
            <div style={{ background: '#F5F8FC', borderRadius: 10, padding: '12px 16px', marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: '#4A6A90', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
                Was bedeutet dieser Brief?
              </div>
              <div style={{ fontSize: 14, color: '#1A3A5C', lineHeight: 1.65 }}>
                Sie haben eine Strafverfügung vom Magistrat Wien erhalten. Es wird eine Geldstrafe von €180 gefordert. Sie haben 2 Wochen Zeit um Einspruch zu erheben — das kostet nichts und ist einfach.
              </div>
            </div>
            {/* Brief-Preview (Handeln-Feature) */}
            <div style={{ background: 'rgba(201,150,58,0.06)', border: '1px solid rgba(201,150,58,0.2)', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span>✉️</span>
                <div style={{ fontSize: 10, color: '#C9963A', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                  Fertiger Antwortbrief — Handeln & Familie Paket
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#2A5080', lineHeight: 1.6, fontStyle: 'italic' }}>
                "Sehr geehrte Damen und Herren, bezugnehmend auf Ihre Strafverfügung vom [DATUM] zu GZ [AKTENZAHL] erhebe ich fristgerecht EINSPRUCH und beantrage die Durchführung einer mündlichen Verhandlung..."
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ maxWidth: 940, margin: '0 auto 80px', padding: '0 24px' }}>
        <h2 style={{ textAlign: 'center', fontFamily: 'serif', fontSize: 30, fontWeight: 700, marginBottom: 12, color: '#0F2440' }}>
          Alles was du brauchst
        </h2>
        <p style={{ textAlign: 'center', color: '#2A5080', fontSize: 16, marginBottom: 40 }}>
          Von der Erklärung bis zum fertigen Antwortbrief
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
          {features.map((f, i) => (
            <div key={i} style={S.card}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6, color: '#0F2440' }}>{f.title}</div>
              <div style={{ fontSize: 13, color: '#2A5080', lineHeight: 1.55 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PREISE ── */}
      <section id="preise" style={{ maxWidth: 960, margin: '0 auto 80px', padding: '0 24px' }}>
        <h2 style={{ textAlign: 'center', fontFamily: 'serif', fontSize: 30, fontWeight: 700, marginBottom: 8, color: '#0F2440' }}>
          Wähle dein Paket
        </h2>
        <p style={{ textAlign: 'center', color: '#2A5080', marginBottom: 28, fontSize: 15 }}>
          1 kostenlose Analyse zum Testen — keine Kreditkarte nötig
        </p>

        {/* Jährlich/Monatlich Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 36 }}>
          <span style={{ fontSize: 14, color: jaehrlich ? '#6A8AAA' : '#0F2440', fontWeight: jaehrlich ? 400 : 600 }}>
            Monatlich
          </span>
          <button
            onClick={() => setJaehrlich(!jaehrlich)}
            style={{
              width: 48, height: 26, borderRadius: 13,
              background: jaehrlich ? '#C9963A' : '#C5D8ED',
              border: 'none', cursor: 'pointer', position: 'relative',
              transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: '50%', background: '#FFFFFF',
              position: 'absolute', top: 3,
              left: jaehrlich ? 25 : 3,
              transition: 'left 0.2s',
            }}/>
          </button>
          <span style={{ fontSize: 14, color: jaehrlich ? '#0F2440' : '#6A8AAA', fontWeight: jaehrlich ? 600 : 400 }}>
            Jährlich
          </span>
          {jaehrlich && (
            <span style={{
              fontSize: 12, fontWeight: 600,
              background: 'rgba(201,150,58,0.15)', color: '#C9963A',
              border: '1px solid rgba(201,150,58,0.3)',
              borderRadius: 20, padding: '2px 10px'
            }}>
              2 Monate gratis
            </span>
          )}
        </div>

        {/* 3 Preiskarten */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20, alignItems: 'start' }}>

          {/* ── VERSTEHEN ── */}
          <div style={{
            background: '#FFFFFF', border: '1.5px solid #C5D8ED',
            borderRadius: 16, padding: '28px 24px'
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#6A8AAA', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
              Verstehen
            </div>
            <div style={{ fontFamily: 'serif', fontSize: 38, fontWeight: 700, color: '#0F2440', lineHeight: 1 }}>
              €{preis('verstehen').toFixed(2).replace('.',',')}
            </div>
            <div style={{ fontSize: 13, color: '#6A8AAA', marginBottom: 24 }}>
              pro Monat{jaehrlich ? ', jährlich abgerechnet' : ''}
            </div>
            {[
              { ok: true,  text: 'Unbegrenzte Analysen' },
              { ok: true,  text: '45 Rechtsbereiche' },
              { ok: true,  text: 'Fristen & Handlungsempfehlungen' },
              { ok: true,  text: 'Konsequenzen bei Nichttätigwerden' },
              { ok: true,  text: 'Live RIS-Gesetzescheck' },
              { ok: false, text: 'KI schreibt Antwortbrief' },
              { ok: false, text: 'Mustervorlagen zum Download' },
              { ok: false, text: 'Mehrere Personen (Familie)' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 10, fontSize: 14 }}>
                <span style={f.ok ? S.check : S.cross}>{f.ok ? '✓' : '–'}</span>
                <span style={{ color: f.ok ? '#1A3A5C' : '#9BBAD4' }}>{f.text}</span>
              </div>
            ))}
            <Link to="/analyse" style={{
              display: 'block', marginTop: 20, textAlign: 'center',
              padding: '13px', borderRadius: 10, fontSize: 15, fontWeight: 600,
              textDecoration: 'none', border: '1.5px solid #C5D8ED', color: '#2A5080',
              background: '#F5F8FC'
            }}>
              Kostenlos testen
            </Link>
          </div>

          {/* ── HANDELN (empfohlen) ── */}
          <div style={{
            background: '#FFFFFF',
            border: '2px solid #C9963A',
            borderRadius: 16, padding: '28px 24px',
            boxShadow: '0 8px 32px rgba(201,150,58,0.15)',
            position: 'relative'
          }}>
            {/* Empfohlen-Badge */}
            <div style={{
              position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg,#B8832A,#D4A84B)',
              color: '#FFFFFF', fontSize: 12, fontWeight: 700,
              padding: '4px 16px', borderRadius: 20, whiteSpace: 'nowrap'
            }}>
              ⭐ Meistgewählt
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#C9963A', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
              Handeln
            </div>
            <div style={{ fontFamily: 'serif', fontSize: 38, fontWeight: 700, color: '#0F2440', lineHeight: 1 }}>
              €{preis('handeln').toFixed(2).replace('.',',')}
            </div>
            <div style={{ fontSize: 13, color: '#6A8AAA', marginBottom: 24 }}>
              pro Monat{jaehrlich ? ', jährlich abgerechnet' : ''}
            </div>
            {[
              { ok: true,  text: 'Unbegrenzte Analysen' },
              { ok: true,  text: '45 Rechtsbereiche' },
              { ok: true,  text: 'Fristen & Handlungsempfehlungen' },
              { ok: true,  text: 'Konsequenzen bei Nichttätigwerden' },
              { ok: true,  text: 'Live RIS-Gesetzescheck' },
              { ok: true,  text: 'KI schreibt Antwortbrief ✨' },
              { ok: true,  text: 'Mustervorlagen zum Download' },
              { ok: false, text: 'Mehrere Personen (Familie)' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 10, fontSize: 14 }}>
                <span style={f.ok ? S.check : S.cross}>{f.ok ? '✓' : '–'}</span>
                <span style={{ color: f.ok ? '#1A3A5C' : '#9BBAD4', fontWeight: f.text.includes('✨') ? 600 : 400 }}>
                  {f.text}
                </span>
              </div>
            ))}
            <Link to="/analyse" style={{
              display: 'block', marginTop: 20, textAlign: 'center',
              padding: '13px', borderRadius: 10, fontSize: 15, fontWeight: 700,
              textDecoration: 'none',
              background: 'linear-gradient(135deg,#B8832A,#D4A84B)',
              color: '#FFFFFF',
            }}>
              Handeln wählen →
            </Link>
          </div>

          {/* ── FAMILIE ── */}
          <div style={{
            background: '#FFFFFF', border: '1.5px solid #C5D8ED',
            borderRadius: 16, padding: '28px 24px'
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#6A8AAA', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
              Familie
            </div>
            <div style={{ fontFamily: 'serif', fontSize: 38, fontWeight: 700, color: '#0F2440', lineHeight: 1 }}>
              €{preis('familie').toFixed(2).replace('.',',')}
            </div>
            <div style={{ fontSize: 13, color: '#6A8AAA', marginBottom: 24 }}>
              pro Monat{jaehrlich ? ', jährlich abgerechnet' : ''}
            </div>
            {[
              { ok: true, text: 'Unbegrenzte Analysen' },
              { ok: true, text: '45 Rechtsbereiche' },
              { ok: true, text: 'Fristen & Handlungsempfehlungen' },
              { ok: true, text: 'Konsequenzen bei Nichttätigwerden' },
              { ok: true, text: 'Live RIS-Gesetzescheck' },
              { ok: true, text: 'KI schreibt Antwortbrief ✨' },
              { ok: true, text: 'Mustervorlagen zum Download' },
              { ok: true, text: 'Bis zu 5 Personen (Familie)' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 10, fontSize: 14 }}>
                <span style={f.ok ? S.check : S.cross}>{f.ok ? '✓' : '–'}</span>
                <span style={{ color: f.ok ? '#1A3A5C' : '#9BBAD4', fontWeight: f.text.includes('✨') ? 600 : 400 }}>
                  {f.text}
                </span>
              </div>
            ))}
            <Link to="/analyse" style={{
              display: 'block', marginTop: 20, textAlign: 'center',
              padding: '13px', borderRadius: 10, fontSize: 15, fontWeight: 600,
              textDecoration: 'none', border: '1.5px solid #C5D8ED', color: '#2A5080',
              background: '#F5F8FC'
            }}>
              Familie wählen
            </Link>
          </div>

        </div>

        {/* Garantie-Hinweis */}
        <p style={{ textAlign: 'center', fontSize: 13, color: '#6A8AAA', marginTop: 24 }}>
          Alle Pakete · Jederzeit kündbar · Keine Mindestlaufzeit · Abwicklung über Paddle
        </p>
      </section>

      {/* ── FAQ ── */}
      <section style={{ maxWidth: 660, margin: '0 auto 80px', padding: '0 24px' }}>
        <h2 style={{ fontFamily: 'serif', fontSize: 28, fontWeight: 700, marginBottom: 24, color: '#0F2440', textAlign: 'center' }}>
          Häufige Fragen
        </h2>
        {faqs.map((faq, i) => (
          <div key={i} style={{ borderBottom: '1px solid #C5D8ED', padding: '16px 0' }}>
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                width: '100%', background: 'none', border: 'none',
                color: '#0F2440', fontSize: 15, fontWeight: 600,
                cursor: 'pointer', textAlign: 'left', gap: 12
              }}
            >
              {faq.q}
              <span style={{ color: '#C9963A', flexShrink: 0, fontSize: 20 }}>
                {openFaq === i ? '−' : '+'}
              </span>
            </button>
            {openFaq === i && (
              <p style={{ marginTop: 10, fontSize: 14, color: '#2A5080', lineHeight: 1.7 }}>
                {faq.a}
              </p>
            )}
          </div>
        ))}
      </section>

      {/* ── CTA ── */}
      <section style={{ textAlign: 'center', padding: '60px 24px 80px', borderTop: '1px solid #C5D8ED' }}>
        <h2 style={{ fontFamily: 'serif', fontSize: 28, fontWeight: 700, marginBottom: 12, color: '#0F2440' }}>
          Brief erhalten? Jetzt analysieren.
        </h2>
        <p style={{ color: '#2A5080', marginBottom: 28, fontSize: 15 }}>
          Erste Analyse kostenlos. Keine Kreditkarte nötig.
        </p>
        <Link to="/analyse" style={S.btn}>Kostenlos starten →</Link>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: '1px solid #C5D8ED', padding: '20px 24px',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: 12,
        background: '#FFFFFF'
      }}>
        <div style={{ fontSize: 13, color: '#6A8AAA' }}>
          © 2025 AmtsKlar · Behördenbriefe sofort verstehen
        </div>
        <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
          {[
            { label: 'Impressum', path: '/impressum' },
            { label: 'Datenschutz', path: '/datenschutz' },
            { label: 'AGB', path: '/agb' },
          ].map(l => (
            <Link key={l.label} to={l.path} style={{ color: '#6A8AAA', textDecoration: 'none' }}>
              {l.label}
            </Link>
          ))}
        </div>
      </footer>

    </div>
  )
}
