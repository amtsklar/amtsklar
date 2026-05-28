import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../i18n/LangContext'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

// ═══════════════════════════════════════════════════════════════════
// AmtsKlar — Landing Page
// 3 Preispakete: Verstehen / Handeln / Familie
// ═══════════════════════════════════════════════════════════════════

// ── Logo Komponente ───────────────────────────────────────────────
const Logo = () => {
  const { t } = useLang()
  return (
  <div
    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
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
      <div style={{ fontSize: 9, color: '#4A6A90', textTransform: 'uppercase', letterSpacing: '0.8px' }} className="logo-sub">
        {t.logo_sub}
      </div>
    </div>
  </div>
  )
}


// ── Haupt-Komponente ──────────────────────────────────────────────
export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const { t } = useLang()

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const [jaehrlich, setJaehrlich] = useState(false)

  // Preise: monatlich und jährlich (2 Monate gratis)
  const preise = {
    verstehen: { monat: 2.99, jahr: 2.49 },
    handeln:   { monat: 4.99, jahr: 4.19 },
    familie:   { monat: 7.99, jahr: 6.79 },
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

      {/* ── SCROLL TO TOP BUTTON ── */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            position: 'fixed',
            right: 20,
            bottom: 80,
            zIndex: 999,
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#B8832A,#D4A84B)',
            border: 'none',
            color: '#FFFFFF',
            fontSize: 22,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(184,131,42,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.3s ease',
          }}
          title="Nach oben"
        >
          ↑
        </button>
      )}

      {/* ── NAVIGATION ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid #C5D8ED',
        position: 'sticky', top: 0, background: '#FFFFFF', zIndex: 50,
        boxShadow: '0 1px 12px rgba(15,36,64,0.08)'
      }}>
        <Logo />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <LanguageSwitcher />
          <a href="#preise" onClick={e => { e.preventDefault(); document.getElementById('preise')?.scrollIntoView({ behavior: 'smooth' }) }}
            className="hide-mobile"
            style={{ fontSize: 14, color: '#2A5080', textDecoration: 'none', cursor: 'pointer' }}>
            {t.nav_prices}
          </a>
          <Link to="/analyse" style={{
            ...S.btn, padding: '8px 14px', fontSize: 13,
            whiteSpace: 'nowrap', flexShrink: 0
          }}>
            {t.nav_test}
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
          🇦🇹 {t.badge.replace('🇦🇹 ', '')}
        </div>

        <h1 style={{
          fontFamily: 'Libre Baskerville,serif',
          fontSize: 'clamp(32px,6vw,52px)',
          fontWeight: 700, lineHeight: 1.15, marginBottom: 20, color: '#0F2440'
        }}>
          {t.h1a}<br />
          <span style={{ color: '#C9963A' }}>{t.h1b}</span>
        </h1>

        <p style={{ fontSize: 18, color: '#2A5080', lineHeight: 1.7, maxWidth: 540, margin: '0 auto 36px' }}>
          {t.hero_sub}
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/analyse" style={S.btn}>{t.hero_btn1}</Link>
          <a href="#preise" onClick={e => { e.preventDefault(); document.getElementById('preise')?.scrollIntoView({ behavior: 'smooth' }) }} style={{
            border: '1.5px solid #C5D8ED', color: '#2A5080',
            padding: '16px 24px', borderRadius: 12, fontSize: 15, textDecoration: 'none'
          }}>
            {t.hero_btn2}
          </a>
        </div>

        <p style={{ marginTop: 16, fontSize: 13, color: '#6A8AAA' }}>
          {t.hero_free}
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
                    {t.demo_pflicht}
                  </div>
                  <div style={{ fontFamily: 'serif', fontSize: 17, fontWeight: 700, color: '#0F2440' }}>
                    {t.demo_action}
                  </div>
                  <div style={{ fontSize: 12, color: '#E05252', marginTop: 4 }}>
                    {t.demo_date}
                  </div>
                </div>
              </div>
            </div>
            {/* Erklärung */}
            <div style={{ background: '#F5F8FC', borderRadius: 10, padding: '12px 16px', marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: '#4A6A90', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
                {t.demo_meaning_label}
              </div>
              <div style={{ fontSize: 14, color: '#1A3A5C', lineHeight: 1.65 }}>
                {t.demo_meaning_text}
              </div>
            </div>
            {/* Brief-Preview (Handeln-Feature) */}
            <div style={{ background: 'rgba(201,150,58,0.06)', border: '1px solid rgba(201,150,58,0.2)', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span>✉️</span>
                <div style={{ fontSize: 10, color: '#C9963A', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                  {t.demo_letter_label}
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#2A5080', lineHeight: 1.6, fontStyle: 'italic' }}>
                {t.demo_letter_text}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ maxWidth: 960, margin: '0 auto 80px', padding: '0 24px' }}>

        <h2 style={{ textAlign: 'center', fontFamily: 'serif', fontSize: 30, fontWeight: 700, marginBottom: 8, color: '#0F2440' }}>
          {t.testi_title}
        </h2>
        <p style={{ textAlign: 'center', color: '#2A5080', fontSize: 15, marginBottom: 12 }}>
          {t.testi_sub}
        </p>

        {/* Sterne-Bewertung gesamt */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(201,150,58,0.1)', border: '1px solid rgba(201,150,58,0.25)',
            borderRadius: 24, padding: '8px 20px' }}>
            <span style={{ color: '#C9963A', fontSize: 18, letterSpacing: 2 }}>★★★★★</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F2440' }}>4,9 / 5</span>
            <span style={{ fontSize: 13, color: '#6A8AAA' }}>· {t.beta}</span>
          </div>
        </div>

        {/* 6 Testimonials in 2 Reihen à 3 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>

          {[
            {
              initial: 'M', color1: '#4A90C4', color2: '#2A5080',
              name: 'Martin K.', ort: 'Waidhofen a.d. Ybbs · Finanzamtsbescheid',
              text: '„Ich habe einen Bescheid vom Finanzamt bekommen und keine Ahnung gehabt was ich tun soll. AmtsKlar hat mir in einer Minute erklärt dass ich noch 4 Wochen Zeit habe und wie ich Einspruch erhebe. Den Antwortbrief habe ich einfach ausgedruckt."',
            },
            {
              initial: 'S', color1: '#4CAF82', color2: '#2A8A5A',
              name: 'Sandra M.', ort: 'Feldbach · AMS-Bescheid',
              text: '„Das AMS hat meinen Antrag abgelehnt und ich wusste nicht ob ich dagegen vorgehen kann. Ich habe einfach ein Foto vom Brief gemacht, reingeladen — und innerhalb von Sekunden hatte ich alles erklärt. Sehr empfehlenswert!"',
            },
            {
              initial: 'A', color1: '#C9963A', color2: '#8B6020',
              name: 'Andrei P.', ort: 'Vöcklabruck · Aufenthaltsbescheid',
              text: '„Als Nicht-Muttersprachler sind mir Behördenbriefe ein Albtraum gewesen. AmtsKlar erklärt alles auf einfachem Deutsch — ich verstehe jetzt genau was zu tun ist. Das Familien-Paket nutze ich für mich und meine Frau."',
            },
            {
              initial: 'B', color1: '#7B5EA7', color2: '#4A3070',
              name: 'Barbara H.', ort: 'Saalfelden · Mietkündigung',
              text: '„Mein Vermieter hat mir gekündigt und ich war total überfordert. AmtsKlar hat mir erklärt dass die Kündigung Formfehler hatte und mir einen Einspruch geschrieben. Der Anwalt hätte mich 300 Euro gekostet — hier zahle ich 4,99 im Monat."',
            },
            {
              initial: 'T', color1: '#E07850', color2: '#A04020',
              name: 'Thomas R.', ort: 'Bludenz · Strafverfügung',
              text: '„Parkstrafe über 210 Euro — einfach das Foto vom Strafzettel hochgeladen und sofort gewusst wie ich Einspruch erhebe. Hat 2 Minuten gedauert. Die Strafe wurde auf 70 Euro reduziert. Beste Investition!"',
            },
            {
              initial: 'E', color1: '#3A9AAA', color2: '#1A6070',
              name: 'Eva S.', ort: 'Spittal an der Drau · Pflegegeld',
              text: '„Meine Mutter hat Pflegestufe 2 bekommen aber sie braucht eindeutig mehr Unterstützung. AmtsKlar hat mir erklärt wie ich Klage beim Arbeits- und Sozialgericht einbringe und den Brief gleich mitgeschrieben. Danke!"',
            },
          ].map((t, i) => (
            <div key={i} style={{ background: '#FFFFFF', border: '1px solid #C5D8ED', borderRadius: 16, padding: '24px 20px' }}>
              <div style={{ color: '#C9963A', fontSize: 16, letterSpacing: 2, marginBottom: 14 }}>★★★★★</div>
              <p style={{ fontSize: 14, color: '#1A3A5C', lineHeight: 1.7, marginBottom: 18, fontStyle: 'italic' }}>
                {t.text}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: `linear-gradient(135deg,${t.color1},${t.color2})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: '#FFFFFF', flexShrink: 0,
                }}>{t.initial}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0F2440' }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: '#6A8AAA' }}>{t.ort}</div>
                </div>
              </div>
            </div>
          ))}

        </div>

        {/* Foto-Upload Highlight */}
        <div style={{
          marginTop: 32,
          background: 'linear-gradient(135deg,rgba(201,150,58,0.08),rgba(15,36,64,0.04))',
          border: '1px solid rgba(201,150,58,0.2)',
          borderRadius: 16, padding: '20px 24px',
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: 32 }}>📸</div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#0F2440', marginBottom: 4 }}>
              {t.photo_title}
            </div>
            <div style={{ fontSize: 13, color: '#2A5080', lineHeight: 1.6 }}>
              {t.photo_desc}
            </div>
          </div>
          <Link to="/analyse" style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg,#B8832A,#D4A84B)',
            color: '#FFFFFF', textDecoration: 'none',
            padding: '12px 20px', borderRadius: 10,
            fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap',
          }}>
            {t.photo_btn}
          </Link>
        </div>

      </section>

      {/* ── FEATURES ── */}
      <section style={{ maxWidth: 940, margin: '0 auto 80px', padding: '0 24px' }}>
        <h2 style={{ textAlign: 'center', fontFamily: 'serif', fontSize: 30, fontWeight: 700, marginBottom: 12, color: '#0F2440' }}>
          {t.feat_title}
        </h2>
        <p style={{ textAlign: 'center', color: '#2A5080', fontSize: 16, marginBottom: 40 }}>
          {t.feat_sub}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
          {t.features.map((f, i) => (
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
          {t.price_title}
        </h2>
        <p style={{ textAlign: 'center', color: '#2A5080', marginBottom: 28, fontSize: 15 }}>
          {t.price_sub}
        </p>

        {/* Jährlich/Monatlich Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 36 }}>
          <span style={{ fontSize: 14, color: jaehrlich ? '#6A8AAA' : '#0F2440', fontWeight: jaehrlich ? 400 : 600 }}>
            {t.monthly}
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
            {t.yearly}
          </span>
          {jaehrlich && (
            <span style={{
              fontSize: 12, fontWeight: 600,
              background: 'rgba(201,150,58,0.15)', color: '#C9963A',
              border: '1px solid rgba(201,150,58,0.3)',
              borderRadius: 20, padding: '2px 10px'
            }}>
              {t.months_free}
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
              {jaehrlich ? t.per_month_y : t.per_month}
            </div>
            {t.plan_v.map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 10, fontSize: 14 }}>
                <span style={S.check}>✓</span>
                <span style={{ color: '#1A3A5C' }}>{text}</span>
              </div>
            ))}
            <Link to="/analyse" style={{
              display: 'block', marginTop: 20, textAlign: 'center',
              padding: '13px', borderRadius: 10, fontSize: 15, fontWeight: 600,
              textDecoration: 'none', border: '1.5px solid #C5D8ED', color: '#2A5080',
              background: '#F5F8FC'
            }}>
              {t.free_test}
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
              {jaehrlich ? t.per_month_y : t.per_month}
            </div>
            {t.plan_h.map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 10, fontSize: 14 }}>
                <span style={S.check}>✓</span>
                <span style={{ color: '#1A3A5C' }}>{text}</span>
              </div>
            ))}
            <Link to="/analyse" style={{
              display: 'block', marginTop: 20, textAlign: 'center',
              padding: '13px', borderRadius: 10, fontSize: 15, fontWeight: 700,
              textDecoration: 'none',
              background: 'linear-gradient(135deg,#B8832A,#D4A84B)',
              color: '#FFFFFF',
            }}>
              {t.choose_handeln}
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
              {jaehrlich ? t.per_month_y : t.per_month}
            </div>
            {t.plan_f.map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 10, fontSize: 14 }}>
                <span style={S.check}>✓</span>
                <span style={{ color: '#1A3A5C' }}>{text}</span>
              </div>
            ))}
            <Link to="/analyse" style={{
              display: 'block', marginTop: 20, textAlign: 'center',
              padding: '13px', borderRadius: 10, fontSize: 15, fontWeight: 600,
              textDecoration: 'none', border: '1.5px solid #C5D8ED', color: '#2A5080',
              background: '#F5F8FC'
            }}>
              {t.choose_familie}
            </Link>
          </div>

        </div>

        {/* Garantie-Hinweis */}
        <p style={{ textAlign: 'center', fontSize: 13, color: '#6A8AAA', marginTop: 24 }}>
          {t.footer_info}
        </p>
      </section>

      {/* ── FAQ ── */}
      <section style={{ maxWidth: 660, margin: '0 auto 80px', padding: '0 24px' }}>
        <h2 style={{ fontFamily: 'serif', fontSize: 28, fontWeight: 700, marginBottom: 24, color: '#0F2440', textAlign: 'center' }}>
          {t.faq_title}
        </h2>
        {t.faqs.map((faq, i) => (
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
          © {new Date().getFullYear()} AmtsKlar · {t.logo_sub}
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
