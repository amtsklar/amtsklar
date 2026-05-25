import { useState } from 'react'
import { Link } from 'react-router-dom'

const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D4A84B"/><stop offset="100%" stopColor="#A8731E"/>
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="9" fill="url(#g)"/>
      <text x="18" y="26" fontFamily="Georgia,serif" fontSize="21" fontWeight="bold" fill="white" textAnchor="middle">§</text>
    </svg>
    <div>
      <div style={{ fontFamily: 'Libre Baskerville,serif', fontSize: 20, fontWeight: 700, lineHeight: 1 }}>
        <span style={{ color: '#EDF2FA', fontWeight: 400 }}>Amts</span>
        <span style={{ color: '#C9963A', fontWeight: 700 }}>Klar</span>
      </div>
      <div style={{ fontSize: 9, color: '#4A6A87', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
        Österreich · Behördenbriefe sofort verstehen
      </div>
    </div>
  </div>
)

const features = [
  { icon: '⚡', title: 'Sofortige Analyse', desc: 'Brief einfügen → in Sekunden verstehen was er bedeutet' },
  { icon: '⚖️', title: '45 Rechtsbereiche', desc: 'Finanzamt, AMS, Gericht, Mietrecht, Fremdenrecht und mehr' },
  { icon: '🗓', title: 'Fristen & Deadlines', desc: 'Welche Frist gilt und was passiert wenn du sie verpasst' },
  { icon: '🚨', title: 'Pflichtaktion', desc: 'Eine klare Handlungsempfehlung: was genau jetzt zu tun ist' },
  { icon: '🔗', title: 'Live RIS-Prüfung', desc: 'Gesetze direkt auf ris.bka.gv.at prüfen — immer aktuell' },
  { icon: '⛔', title: 'Konsequenzen', desc: 'Was passiert wenn du nichts tust — Schritt für Schritt' },
]

const faqs = [
  { q: 'Für welche Briefe funktioniert AmtsKlar?', a: 'Alle österreichischen Behördenschreiben: Finanzamt, AMS, ÖGK, Gericht, Magistrat, BH, Mietrecht, Fremdenrecht, Straf-, Zivil- und Verwaltungsrecht — 45 Rechtsbereiche.' },
  { q: 'Ist das eine Rechtsberatung?', a: 'Nein. AmtsKlar informiert und erklärt — ersetzt keine Rechtsberatung. Für wichtige Entscheidungen immer einen Anwalt oder die Arbeiterkammer konsultieren.' },
  { q: 'Wie aktuell sind die Gesetze?', a: 'Die KI kennt das österreichische Recht auf aktuellem Stand. Jeden zitierten Paragraphen kannst du direkt auf dem offiziellen RIS (ris.bka.gv.at) prüfen.' },
  { q: 'Kann ich jederzeit kündigen?', a: 'Ja, jederzeit per E-Mail oder über das Kundenportal. Keine Mindestlaufzeit, keine Kündigungsfrist.' },
]

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div style={{ background: '#0C1825', minHeight: '100vh' }}>

      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #1D3350', position: 'sticky', top: 0, background: '#0C1825', zIndex: 50 }}>
        <Logo />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="#preise" style={{ fontSize: 14, color: '#6E8EAD', textDecoration: 'none' }}>Preise</a>
          <Link to="/analyse" style={{ background: 'linear-gradient(135deg,#B8832A,#D4A84B)', color: '#0C1825', padding: '8px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            Jetzt testen →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ textAlign: 'center', padding: '80px 24px 60px', maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(201,150,58,0.1)', border: '1px solid rgba(201,150,58,0.25)', borderRadius: 20, padding: '6px 16px', fontSize: 13, color: '#C9963A', marginBottom: 24, fontWeight: 500 }}>
          🇦🇹 Speziell für Österreich · 45 Rechtsbereiche
        </div>
        <h1 style={{ fontFamily: 'Libre Baskerville,serif', fontSize: 'clamp(32px,6vw,52px)', fontWeight: 700, lineHeight: 1.15, marginBottom: 20, color: '#EDF2FA' }}>
          Brief vom Amt erhalten?<br />
          <span style={{ color: '#C9963A' }}>Jetzt sofort verstehen.</span>
        </h1>
        <p style={{ fontSize: 18, color: '#6E8EAD', lineHeight: 1.7, marginBottom: 36, maxWidth: 520, margin: '0 auto 36px' }}>
          Einfügen — analysieren — verstehen. Was bedeutet der Brief? Welche Frist gilt? Was musst du jetzt tun?
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/analyse" style={{ background: 'linear-gradient(135deg,#B8832A,#D4A84B)', color: '#0C1825', padding: '16px 32px', borderRadius: 12, fontSize: 17, fontWeight: 700, textDecoration: 'none' }}>
            Brief kostenlos analysieren →
          </Link>
          <a href="#preise" style={{ border: '1.5px solid #1D3350', color: '#6E8EAD', padding: '16px 24px', borderRadius: 12, fontSize: 15, textDecoration: 'none' }}>
            Preise ansehen
          </a>
        </div>
        <p style={{ marginTop: 16, fontSize: 13, color: '#3A5570' }}>
          1 kostenlose Analyse · Danach ab €2,99/Monat · Jederzeit kündbar
        </p>
      </section>

      {/* FEATURES */}
      <section style={{ maxWidth: 900, margin: '0 auto 80px', padding: '0 24px' }}>
        <h2 style={{ textAlign: 'center', fontFamily: 'serif', fontSize: 30, fontWeight: 700, marginBottom: 40, color: '#EDF2FA' }}>Alles was du brauchst</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
          {features.map((f, i) => (
            <div key={i} style={{ background: '#112236', border: '1px solid #1D3350', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6, color: '#EDF2FA' }}>{f.title}</div>
              <div style={{ fontSize: 13, color: '#6E8EAD', lineHeight: 1.55 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="preise" style={{ maxWidth: 440, margin: '0 auto 80px', padding: '0 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'serif', fontSize: 30, fontWeight: 700, marginBottom: 8, color: '#EDF2FA' }}>Einfache Preise</h2>
        <p style={{ color: '#6E8EAD', marginBottom: 32, fontSize: 15 }}>1 kostenlose Analyse zum Testen</p>
        <div style={{ background: '#112236', border: '2px solid rgba(201,150,58,0.4)', borderRadius: 16, padding: '32px 28px' }}>
          <div style={{ fontFamily: 'serif', fontSize: 42, fontWeight: 700, color: '#EDF2FA', lineHeight: 1 }}>€2,99</div>
          <div style={{ color: '#6E8EAD', fontSize: 14, marginBottom: 24 }}>pro Monat · jederzeit kündbar</div>
          {['Unbegrenzte Analysen','Alle 45 Rechtsbereiche','Live RIS-Gesetzescheck','Fristen & Handlungsempfehlungen','Konsequenzen bei Nichttätigwerden','Kostenlose Beratungsstellen'].map((f,i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, textAlign: 'left', fontSize: 14, color: '#C8D8EC' }}>
              <span style={{ color: '#C9963A', fontWeight: 700 }}>✓</span>{f}
            </div>
          ))}
          <Link to="/analyse" style={{ display: 'block', marginTop: 24, background: 'linear-gradient(135deg,#B8832A,#D4A84B)', color: '#0C1825', padding: 14, borderRadius: 10, fontSize: 16, fontWeight: 700, textDecoration: 'none' }}>
            Jetzt kostenlos testen →
          </Link>
          <div style={{ fontSize: 12, color: '#3A5570', marginTop: 12 }}>Erste Analyse kostenlos · Keine Kreditkarte nötig</div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 640, margin: '0 auto 80px', padding: '0 24px' }}>
        <h2 style={{ fontFamily: 'serif', fontSize: 28, fontWeight: 700, marginBottom: 24, color: '#EDF2FA', textAlign: 'center' }}>Häufige Fragen</h2>
        {faqs.map((faq, i) => (
          <div key={i} style={{ borderBottom: '1px solid #1D3350', padding: '16px 0' }}>
            <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', border: 'none', color: '#EDF2FA', fontSize: 15, fontWeight: 600, cursor: 'pointer', textAlign: 'left', gap: 12 }}>
              {faq.q}<span style={{ color: '#C9963A', flexShrink: 0 }}>{openFaq === i ? '−' : '+'}</span>
            </button>
            {openFaq === i && <p style={{ marginTop: 10, fontSize: 14, color: '#6E8EAD', lineHeight: 1.65 }}>{faq.a}</p>}
          </div>
        ))}
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #1D3350', padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 13, color: '#3A5570' }}>© 2025 AmtsKlar · Behördenbriefe sofort verstehen</div>
        <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
          {['Impressum','Datenschutz','AGB'].map(l => (
            <Link key={l} to={`/${l.toLowerCase()}`} style={{ color: '#3A5570', textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </footer>
    </div>
  )
}
