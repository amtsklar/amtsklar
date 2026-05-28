import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

// Style constants outside component — created once, not on every render
const S = {
  wrap:    { minHeight:'100vh', background:'#F8F9FB' } as const,
  header:  { background:'#1a1a2e', padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', height:'64px', position:'sticky' as const, top:0, zIndex:100 },
  logo:    { fontSize:'22px', fontWeight:700, color:'#EDF2FA', letterSpacing:'-0.5px', background:'none', border:'none', cursor:'pointer', padding:0 } as const,
  logoGold:{ color:'#C9963A' } as const,
  hero:    { background:'linear-gradient(135deg,#1a1a2e 0%,#2d2d4e 100%)', padding:'80px 24px', textAlign:'center' as const },
  badge:   { display:'inline-block', background:'rgba(201,150,58,0.15)', border:'1px solid rgba(201,150,58,0.4)', borderRadius:'20px', padding:'6px 16px', marginBottom:'24px' } as const,
  h1:      { fontSize:'clamp(26px,5vw,46px)', fontWeight:800, color:'#EDF2FA', lineHeight:1.15, marginBottom:'18px' } as const,
  sub:     { fontSize:'18px', color:'#94a3b8', lineHeight:1.65, marginBottom:'36px', maxWidth:'580px', margin:'0 auto 36px' } as const,
  ctaBtn:  { background:'#C9963A', color:'#fff', border:'none', borderRadius:'12px', padding:'15px 40px', fontWeight:700, fontSize:'17px', cursor:'pointer', boxShadow:'0 4px 20px rgba(201,150,58,0.35)' } as const,
  ctaSub:  { color:'#64748b', fontSize:'13px', marginTop:'10px' } as const,
  grid:    { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))', gap:'18px' } as const,
  card:    { background:'#fff', borderRadius:'14px', padding:'26px', border:'1px solid #e5e7eb', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' } as const,
  cardIcon:{ fontSize:'30px', marginBottom:'10px' } as const,
  cardH:   { fontSize:'15px', fontWeight:700, marginBottom:'6px', color:'#1a1a2e' } as const,
  cardT:   { fontSize:'13px', color:'#6b7280', lineHeight:1.6 } as const,
  stepNum: { width:'46px', height:'46px', background:'#C9963A', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', fontWeight:700, fontSize:'18px', color:'#fff' } as const,
  stepH:   { color:'#EDF2FA', fontWeight:600, marginBottom:'6px', fontSize:'15px' } as const,
  stepT:   { color:'#64748b', fontSize:'13px' } as const,
  footLink:{ color:'#64748b', textDecoration:'none', fontSize:'13px' } as const,
};

export default function Landing() {
  const { t } = useLang();
  const navigate = useNavigate();

  return (
    <div style={S.wrap}>
      {/* Header */}
      <header style={S.header}>
        <button style={S.logo} onClick={() => navigate('/')}>
          Amts<span style={S.logoGold}>Klar</span>
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <LanguageSwitcher />
          <button
            onClick={() => navigate('/analyse')}
            style={{ background:'#C9963A', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 18px', fontWeight:600, fontSize:'14px', cursor:'pointer' }}
          >
            {t.hero_cta}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section style={S.hero}>
        <div style={{ maxWidth:'660px', margin:'0 auto' }}>
          <div style={S.badge}>
            <span style={{ color:'#C9963A', fontSize:'13px', fontWeight:600 }}>🇦🇹 Österreich · KI-Analyse · 12 Sprachen</span>
          </div>
          <h1 style={S.h1}>{t.hero_title}</h1>
          <p style={S.sub}>{t.hero_sub}</p>
          <button
            onClick={() => navigate('/analyse')}
            style={S.ctaBtn}
            onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={e => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {t.hero_cta}
          </button>
          <p style={S.ctaSub}>{t.hero_free}</p>
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth:'960px', margin:'0 auto', padding:'64px 24px' }}>
        <div style={S.grid}>
          {([
            { icon:'⚖️', title:t.f1_title, text:t.f1_text },
            { icon:'📄', title:t.f2_title, text:t.f2_text },
            { icon:'🌍', title:t.f3_title, text:t.f3_text },
            { icon:'🔒', title:t.f4_title, text:t.f4_text },
          ] as const).map((f, i) => (
            <div key={i} style={S.card}>
              <div style={S.cardIcon}>{f.icon}</div>
              <h3 style={S.cardH}>{f.title}</h3>
              <p style={S.cardT}>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background:'#1a1a2e', padding:'64px 24px', textAlign:'center' }}>
        <div style={{ maxWidth:'720px', margin:'0 auto' }}>
          <h2 style={{ fontSize:'28px', fontWeight:700, color:'#EDF2FA', marginBottom:'48px' }}>{t.how_title}</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'32px' }}>
            {([
              { n:'1', title:t.s1, text:t.s1t },
              { n:'2', title:t.s2, text:t.s2t },
              { n:'3', title:t.s3, text:t.s3t },
            ] as const).map((s, i) => (
              <div key={i}>
                <div style={S.stepNum}>{s.n}</div>
                <h3 style={S.stepH}>{s.title}</h3>
                <p style={S.stepT}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section style={{ padding:'64px 24px', textAlign:'center' }}>
        <button
          onClick={() => navigate('/analyse')}
          style={S.ctaBtn}
        >
          {t.cta} →
        </button>
        <p style={S.ctaSub}>{t.hero_free}</p>
      </section>

      {/* Footer */}
      <footer style={{ background:'#1a1a2e', padding:'20px 24px', textAlign:'center' }}>
        <div style={{ display:'flex', justifyContent:'center', gap:'20px', marginBottom:'10px', flexWrap:'wrap' }}>
          <a href="/impressum"   style={S.footLink}>Impressum</a>
          <a href="/datenschutz" style={S.footLink}>Datenschutz</a>
          <a href="/agb"         style={S.footLink}>AGB</a>
        </div>
        <p style={{ color:'#374151', fontSize:'12px' }}>
          © {new Date().getFullYear()} AmtsKlar · Philipp Hofer · {t.footer_rights}
        </p>
      </footer>
    </div>
  );
}
