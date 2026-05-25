import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

// ── Typen ──────────────────────────────────────────────────────────────────
interface AnalyseResult {
  brieftyp: string
  behoerde: string
  dringlichkeit: 'hoch' | 'mittel' | 'niedrig'
  einfache_erklaerung: string
  frist: { hat_frist: boolean; frist_text: string; frist_hinweis?: string }
  handlungsempfehlung: { aktion: string; bis_wann: string; wie: string; prioritaet: string }
  was_tun: string[]
  rechtsmittel: { name: string; frist: string; wohin: string; beschreibung: string }[]
  rechtsgrundlage: string[]
  wichtige_hinweise: string[]
  konsequenzen: { frist_verpasst: string; naechste_schritte_behoerde: string[]; langfristige_folgen: string }
  beratungsstellen: string[]
}

// ── Konstanten ─────────────────────────────────────────────────────────────
const URGENCY = {
  hoch:    { color: '#E05252', bg: 'rgba(224,82,82,0.1)',  border: 'rgba(224,82,82,0.3)',  label: 'Dringend',     icon: '⚠️' },
  mittel:  { color: '#D4943A', bg: 'rgba(212,148,58,0.1)', border: 'rgba(212,148,58,0.3)', label: 'Mittelfristig',icon: '⏰' },
  niedrig: { color: '#4CAF82', bg: 'rgba(76,175,130,0.1)', border: 'rgba(76,175,130,0.3)', label: 'Keine Eile',   icon: '✓'  },
}

const FREE_LIMIT = 1
const SK = { count: 'ak_count', paid: 'ak_paid', email: 'ak_email' }

function getRISUrl(law: string) {
  const abbr = law.replace(/§+[\d\s\w,().-]*/g, '').trim().split(/\s+/)[0]
  const known: Record<string, string> = {
    BAO:'10003940',EStG:'10004570',UStG:'10004873',ASVG:'10008147',
    AlVG:'10008227',AVG:'10005768',VStG:'10005770',StGB:'10002296',
    ZPO:'10001699',ABGB:'10001622',MRG:'10004895',EheG:'10002814',
    ArbVG:'10008068',AngG:'10003655',
  }
  if (known[abbr]) return `https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=${known[abbr]}`
  return `https://www.ris.bka.gv.at/Ergebnis.wxe?Abfrage=Bundesnormen&Titel=${encodeURIComponent(abbr)}&Ladtyp=Titel`
}

// ── Logo ───────────────────────────────────────────────────────────────────
const Logo = () => (
  <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
      <defs>
        <linearGradient id="lg2" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D4A84B"/><stop offset="100%" stopColor="#A8731E"/>
        </linearGradient>
      </defs>
      <rect width="34" height="34" rx="8" fill="url(#lg2)"/>
      <text x="17" y="24" fontFamily="Georgia,serif" fontSize="19" fontWeight="bold" fill="white" textAnchor="middle">§</text>
    </svg>
    <div>
      <div style={{ fontFamily: 'Libre Baskerville,Georgia,serif', fontSize: 19, fontWeight: 700, lineHeight: 1 }}>
        <span style={{ color: '#EDF2FA', fontWeight: 400 }}>Amts</span>
        <span style={{ color: '#C9963A', fontWeight: 700 }}>Klar</span>
      </div>
      <div style={{ fontSize: 9, color: '#4A6A87', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
        Österreich · Behördenbriefe sofort verstehen
      </div>
    </div>
  </Link>
)

// ── Hauptkomponente ────────────────────────────────────────────────────────
export default function Analyse() {
  const [briefText, setBriefText]     = useState('')
  const [result, setResult]           = useState<AnalyseResult | null>(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [screen, setScreen]           = useState<'input' | 'result'>('input')
  const [count, setCount]             = useState(0)
  const [isPaid, setIsPaid]           = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [email, setEmail]             = useState('')
  const [verifying, setVerifying]     = useState(false)
  const [paddleReady, setPaddleReady] = useState(false)

  useEffect(() => {
    setCount(parseInt(localStorage.getItem(SK.count) || '0'))
    setIsPaid(localStorage.getItem(SK.paid) === 'true')
    setEmail(localStorage.getItem(SK.email) || '')
    // Paddle.js laden
    const s = document.createElement('script')
    s.src = 'https://cdn.paddle.com/paddle/v2/paddle.js'
    s.onload = () => {
      const token = import.meta.env.VITE_PADDLE_CLIENT_TOKEN
      if (token && (window as any).Paddle) {
        ;(window as any).Paddle.Initialize({ token })
        setPaddleReady(true)
      }
    }
    document.head.appendChild(s)
    // Nach Paddle-Zahlung
    if (new URLSearchParams(window.location.search).get('success')) {
      localStorage.setItem(SK.paid, 'true')
      setIsPaid(true)
      window.history.replaceState({}, '', '/analyse')
    }
    return () => { if (document.head.contains(s)) document.head.removeChild(s) }
  }, [])

  const openCheckout = () => {
    if (paddleReady && (window as any).Paddle) {
      ;(window as any).Paddle.Checkout.open({
        items: [{ priceId: import.meta.env.VITE_PADDLE_PRICE_ID, quantity: 1 }],
        customer: email ? { email } : undefined,
        successUrl: `${window.location.origin}/analyse?success=1`,
      })
    } else {
      window.open('https://amtsklar.at/#preise', '_blank')
    }
  }

  const verifySubscription = async () => {
    if (!email.includes('@')) { setError('Bitte gültige E-Mail eingeben'); return }
    setVerifying(true); setError(null)
    try {
      const res = await fetch('/api/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const data = await res.json()
      if (data.active) {
        localStorage.setItem(SK.paid, 'true')
        localStorage.setItem(SK.email, email)
        setIsPaid(true); setShowPaywall(false)
      } else {
        setError('Kein aktives Abo für diese E-Mail gefunden.')
      }
    } catch { setError('Prüfung fehlgeschlagen.') }
    finally { setVerifying(false) }
  }

  const analyse = async () => {
    const trimmed = briefText.trim()
    if (trimmed.length < 30) { setError('Bitte vollständigen Brieftext einfügen (mind. 30 Zeichen).'); return }
    if (!isPaid && count >= FREE_LIMIT) { setShowPaywall(true); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/analyse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ briefText: trimmed }) })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Fehler')
      setResult(data.result); setScreen('result')
      const n = count + 1; setCount(n); localStorage.setItem(SK.count, String(n))
    } catch (e: any) {
      setError(e.message || 'Analyse fehlgeschlagen. Bitte erneut versuchen.')
    } finally { setLoading(false) }
  }

  const reset = () => { setScreen('input'); setResult(null); setBriefText(''); setError(null) }

  const urg = result ? (URGENCY[result.dringlichkeit] || URGENCY.mittel) : URGENCY.mittel

  // ── Styles ──────────────────────────────────────────────────────────────
  const S = {
    app:    { background: '#0C1825', minHeight: '100vh', display: 'flex', flexDirection: 'column' as const },
    header: { padding: '14px 20px', borderBottom: '1px solid #1D3350', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky' as const, top: 0, background: '#0C1825', zIndex: 10 },
    scroll: { flex: 1, overflowY: 'auto' as const, padding: '24px 20px 48px' },
    inner:  { maxWidth: 640, margin: '0 auto', width: '100%' },
    card:   { background: '#112236', border: '1px solid #1D3350', borderRadius: 14, padding: 18, marginBottom: 12 },
    label:  { fontSize: 10, fontWeight: 600 as const, textTransform: 'uppercase' as const, letterSpacing: '1.2px', color: '#4A6A87', marginBottom: 8 },
    btn:    { width: '100%', padding: 15, background: 'linear-gradient(135deg,#B8832A,#D4A84B)', color: '#0C1825', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700 as const, cursor: 'pointer' as const },
    btnOut: { width: '100%', padding: 13, background: 'transparent', color: '#6E8EAD', border: '1.5px solid #1D3350', borderRadius: 12, fontSize: 15, fontWeight: 500 as const, cursor: 'pointer' as const, marginTop: 12 },
    ta:     { width: '100%', background: '#112236', border: '1.5px solid #1D3350', borderRadius: 14, padding: 16, color: '#EDF2FA', fontFamily: 'inherit', fontSize: 14, lineHeight: 1.65, resize: 'vertical' as const, minHeight: 220, outline: 'none' },
  }

  return (
    <div style={S.app}>

      {/* PAYWALL */}
      {showPaywall && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#112236', border: '1.5px solid rgba(201,150,58,0.4)', borderRadius: 16, padding: '32px 28px', maxWidth: 420, width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: 'serif', fontSize: 36, color: '#C9963A', marginBottom: 12 }}>§</div>
              <div style={{ fontFamily: 'serif', fontSize: 22, fontWeight: 700, color: '#EDF2FA', marginBottom: 8 }}>Weiter mit AmtsKlar</div>
              <div style={{ fontSize: 14, color: '#6E8EAD', lineHeight: 1.6 }}>Deine kostenlose Analyse ist aufgebraucht.<br/>Unbegrenzte Analysen für €2,99/Monat.</div>
            </div>
            <button onClick={openCheckout} style={{ ...S.btn, marginBottom: 16 }}>Jetzt abonnieren — €2,99/Monat →</button>
            <div style={{ borderTop: '1px solid #1D3350', paddingTop: 16 }}>
              <div style={{ fontSize: 12, color: '#4A6A87', marginBottom: 8, textAlign: 'center' }}>Bereits Abonnent? E-Mail eingeben:</div>
              <input type="email" value={email} placeholder="deine@email.com" onChange={e => setEmail(e.target.value)}
                style={{ ...S.ta, minHeight: 'auto', padding: '10px 14px', marginBottom: 8, borderRadius: 8 }} />
              <button onClick={verifySubscription} disabled={verifying}
                style={{ ...S.btn, background: 'transparent', border: '1.5px solid #1D3350', color: '#6E8EAD', padding: 11 }}>
                {verifying ? 'Prüfe...' : 'Zugang prüfen'}
              </button>
              {error && <div style={{ fontSize: 12, color: '#E08080', marginTop: 8, textAlign: 'center' }}>{error}</div>}
            </div>
            <button onClick={() => setShowPaywall(false)} style={{ ...S.btnOut, fontSize: 13 }}>Schließen</button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={S.header}>
        <Logo />
        <span style={{ fontSize: 12, color: isPaid ? '#4CAF82' : '#6E8EAD',
          background: isPaid ? 'rgba(76,175,130,0.1)' : 'transparent',
          border: isPaid ? '1px solid rgba(76,175,130,0.3)' : 'none',
          borderRadius: 6, padding: isPaid ? '3px 10px' : 0 }}>
          {isPaid ? '✓ Aktiv' : `${Math.max(0, FREE_LIMIT - count)} gratis`}
        </span>
      </div>

      <div style={S.scroll}>
        <div style={S.inner}>

          {/* INPUT */}
          {screen === 'input' && !loading && (
            <div className="fade-in">
              <h1 style={{ fontFamily: 'Libre Baskerville,serif', fontSize: 28, fontWeight: 700, lineHeight: 1.2, color: '#EDF2FA', marginBottom: 8 }}>Brief<br/>erhalten?</h1>
              <p style={{ fontSize: 15, color: '#6E8EAD', lineHeight: 1.6, marginBottom: 24 }}>Einfügen, analysieren — sofort verstehen was er bedeutet, welche Frist gilt und was zu tun ist.</p>
              <textarea style={S.ta} placeholder={'Brieftext hier einfügen…\n\nz.B. Strafverfügung, Finanzamtsbescheid, AMS-Schreiben, Inkasso, Mietkündigung…'}
                value={briefText} onChange={e => setBriefText(e.target.value)} rows={11}/>
              <div style={{ textAlign: 'right', fontSize: 12, color: '#3A5570', marginTop: 4, marginBottom: 16 }}>{briefText.length} Zeichen</div>
              {error && <div style={{ background: 'rgba(224,82,82,0.08)', border: '1px solid rgba(224,82,82,0.25)', borderRadius: 10, padding: '12px 16px', color: '#E08080', fontSize: 14, marginBottom: 14 }}>⚠️ {error}</div>}
              <button style={S.btn} onClick={analyse} disabled={briefText.trim().length < 30}>Brief analysieren →</button>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 28, paddingTop: 24, borderTop: '1px solid #1D3350' }}>
                {[['📋','Einfügen','Text kopieren'],['⚖️','Analysieren','Österr. Gesetze'],['✅','Verstehen','Klare Schritte']].map(([i,t,d]) => (
                  <div key={t} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{i}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#C4D4E8', marginBottom: 3 }}>{t}</div>
                    <div style={{ fontSize: 11, color: '#4A6A87', lineHeight: 1.4 }}>{d}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #192B42', borderRadius: 12, padding: '14px 16px', marginTop: 28, fontSize: 11, color: '#3A5570', lineHeight: 1.65, textAlign: 'center' }}>
                AmtsKlar informiert und erklärt — <strong style={{ color: '#4A7A9A' }}>ersetzt keine Rechtsberatung.</strong>
              </div>
            </div>
          )}

          {/* LOADING */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 24, textAlign: 'center' }}>
              <div style={{ width: 50, height: 50, border: '3px solid #1D3350', borderTop: '3px solid #C9963A', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }}/>
              <div>
                <div style={{ fontFamily: 'Libre Baskerville,serif', fontSize: 20, color: '#EDF2FA' }}>Analysiere Ihren Brief…</div>
                <div style={{ fontSize: 13, color: '#4A6A87', marginTop: 8 }}>Prüfe österreichische Gesetze & Fristen</div>
              </div>
            </div>
          )}

          {/* RESULT */}
          {screen === 'result' && result && !loading && (
            <div className="fade-in">
              {/* Brieftyp + Dringlichkeit */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(201,150,58,0.1)', border: '1px solid rgba(201,150,58,0.28)', borderRadius: 8, padding: '5px 12px', fontSize: 13, color: '#C9963A', fontWeight: 500, marginBottom: 6 }}>📄 {result.brieftyp}</div>
                  <div style={{ fontSize: 12, color: '#4A6A87' }}>Von: {result.behoerde}</div>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600, background: urg.bg, border: `1px solid ${urg.border}`, color: urg.color }}>{urg.icon} {urg.label}</div>
              </div>

              {/* Pflichtaktion */}
              {result.handlungsempfehlung && (
                <div style={{ borderRadius: 14, padding: 20, marginBottom: 14, border: `2px solid ${urg.border}`, background: urg.bg }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
                    <span style={{ fontSize: 24, flexShrink: 0 }}>{result.handlungsempfehlung.prioritaet === 'kritisch' ? '🚨' : result.handlungsempfehlung.prioritaet === 'hoch' ? '⚡' : '📌'}</span>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#8BA3C7', marginBottom: 5 }}>Ihre nächste Pflichtaktion</div>
                      <div style={{ fontFamily: 'Libre Baskerville,serif', fontSize: 20, fontWeight: 700, color: '#EDF2FA', lineHeight: 1.25 }}>{result.handlungsempfehlung.aktion}</div>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {result.handlungsempfehlung.bis_wann && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#C8D8EC' }}><span>🗓</span><span><strong>Wann:</strong> {result.handlungsempfehlung.bis_wann}</span></div>}
                    {result.handlungsempfehlung.wie && <div style={{ fontSize: 14, lineHeight: 1.65, color: '#C8D8EC', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>{result.handlungsempfehlung.wie}</div>}
                  </div>
                </div>
              )}

              {/* Erklärung */}
              <div style={S.card}><div style={S.label}>Was bedeutet dieser Brief?</div><div style={{ fontSize: 16, lineHeight: 1.75, color: '#C8D8EC', fontWeight: 300 }}>{result.einfache_erklaerung}</div></div>

              {/* Frist */}
              {result.frist?.hat_frist && (
                <div style={{ ...S.card, background: urg.bg, border: `1.5px solid ${urg.border}` }}>
                  <div style={{ ...S.label, color: urg.color }}>⏰ Frist beachten</div>
                  <div style={{ fontFamily: 'serif', fontSize: 21, fontWeight: 700, color: urg.color, marginBottom: 6 }}>{result.frist.frist_text}</div>
                  {result.frist.frist_hinweis && <div style={{ fontSize: 13, color: '#D0DCEF', lineHeight: 1.55 }}>{result.frist.frist_hinweis}</div>}
                </div>
              )}

              {/* Was tun */}
              {result.was_tun?.length > 0 && (
                <div style={S.card}>
                  <div style={S.label}>Was jetzt tun?</div>
                  {result.was_tun.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ width: 26, height: 26, background: 'linear-gradient(135deg,#B8832A,#D4A84B)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#0C1825', flexShrink: 0, marginTop: 2 }}>{i + 1}</div>
                      <div style={{ fontSize: 14, lineHeight: 1.65, color: '#C8D8EC' }}>{s.replace(/^Schritt\s*\d+[.:]\s*/i, '')}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rechtsmittel */}
              {result.rechtsmittel?.length > 0 && (
                <div style={S.card}>
                  <div style={S.label}>Rechtsmittel & Einspruch</div>
                  {result.rechtsmittel.map((rm, i) => (
                    <div key={i} style={{ border: '1px solid #1D3350', borderRadius: 10, padding: 14, marginBottom: 10 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: '#EDF2FA', marginBottom: 4 }}>{rm.name}</div>
                      <div style={{ fontSize: 12, color: '#C9963A', marginBottom: 6, fontWeight: 500 }}>Frist: {rm.frist} · Wohin: {rm.wohin}</div>
                      <div style={{ fontSize: 13, color: '#6E8EAD', lineHeight: 1.5 }}>{rm.beschreibung}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Wichtige Hinweise */}
              {result.wichtige_hinweise?.length > 0 && (
                <div style={S.card}>
                  <div style={S.label}>⚠️ Wichtige Hinweise</div>
                  {result.wichtige_hinweise.map((h, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9963A', flexShrink: 0, marginTop: 7 }}/>
                      <div style={{ fontSize: 14, color: '#C8D8EC', lineHeight: 1.6 }}>{h}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Konsequenzen */}
              {result.konsequenzen && (
                <div style={{ ...S.card, background: 'rgba(180,30,30,0.07)', border: '1.5px solid rgba(200,50,50,0.3)' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, fontFamily: 'serif', fontSize: 17, fontWeight: 700, color: '#E05252' }}>
                    <span>⛔</span> Was passiert wenn Sie NICHTS tun?
                  </div>
                  {result.konsequenzen.frist_verpasst && (
                    <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid rgba(200,50,50,0.15)' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(200,100,100,0.8)', marginBottom: 6 }}>Sofort bei Fristversäumnis</div>
                      <div style={{ fontSize: 14, lineHeight: 1.65, color: '#D4B8B8' }}>{result.konsequenzen.frist_verpasst}</div>
                    </div>
                  )}
                  {result.konsequenzen.naechste_schritte_behoerde?.length > 0 && (
                    <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid rgba(200,50,50,0.15)' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(200,100,100,0.8)', marginBottom: 8 }}>Nächste Schritte der Behörde</div>
                      {result.konsequenzen.naechste_schritte_behoerde.map((s, i) => (
                        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                          <div style={{ width: 26, height: 26, background: 'linear-gradient(135deg,#8B2020,#C03030)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>{i + 1}</div>
                          <div style={{ fontSize: 14, color: '#D4B8B8', lineHeight: 1.65 }}>{s}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {result.konsequenzen.langfristige_folgen && (
                    <div style={{ background: 'rgba(200,50,50,0.06)', borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#E05252', marginBottom: 6 }}>Langfristige Folgen</div>
                      <div style={{ fontSize: 14, lineHeight: 1.65, color: '#D4B8B8' }}>{result.konsequenzen.langfristige_folgen}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Rechtsgrundlage */}
              {result.rechtsgrundlage?.length > 0 && (
                <div style={S.card}>
                  <div style={S.label}>Rechtsgrundlage</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {result.rechtsgrundlage.map((r, i) => (
                      <a key={i} href={getRISUrl(r)} target="_blank" rel="noopener noreferrer"
                        style={{ background: 'rgba(29,51,80,0.7)', border: '1px solid #253D58', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: '#6E8EAD', fontFamily: 'monospace', textDecoration: 'none' }}>
                        {r} ↗
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Beratungsstellen */}
              {result.beratungsstellen?.length > 0 && (
                <div style={S.card}>
                  <div style={S.label}>Kostenlose Beratungsstellen</div>
                  {result.beratungsstellen.map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9, fontSize: 14, color: '#C8D8EC' }}>
                      <span>🏛️</span><span>{b}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #192B42', borderRadius: 12, padding: '14px 16px', marginTop: 20, marginBottom: 4, fontSize: 11, color: '#3A5570', lineHeight: 1.65, textAlign: 'center' }}>
                ⚖️ <strong style={{ color: '#4A7A9A' }}>Rechtlicher Hinweis:</strong> AmtsKlar dient zur Information. Ersetzt keine Rechtsberatung durch einen zugelassenen Anwalt.{' '}
                Quelle Gesetze: <a href="https://www.ris.bka.gv.at" target="_blank" rel="noopener noreferrer" style={{ color: '#4A7A9A' }}>RIS.bka.gv.at</a> (CC BY 4.0)
              </div>
              <button style={S.btnOut} onClick={reset}>← Neuen Brief analysieren</button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
