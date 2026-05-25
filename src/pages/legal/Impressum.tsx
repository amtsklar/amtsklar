import { Link } from 'react-router-dom'
const S = { page: { background: '#0C1825', minHeight: '100vh', color: '#EDF2FA', padding: '40px 24px' }, a: { color: '#C9963A' } as React.CSSProperties }
export default function Impressum() {
  return <div style={S.page}><Link to="/" style={{ color: '#6E8EAD', textDecoration: 'none' }}>← Zurück</Link><h1 style={{ fontFamily: 'serif', fontSize: 28, marginTop: 24, marginBottom: 16 }}>Impressum</h1><p style={{ color: '#C8D8EC', lineHeight: 1.7 }}>Philipp Hofer<br/>Fischerweg 7<br/>9430 Au, Schweiz<br/><br/>E-Mail: <a href="mailto:info@amtsklar.at" style={S.a}>info@amtsklar.at</a><br/><br/>Zahlungsabwicklung: Paddle.com Europe Limited als Merchant of Record.<br/><br/>AmtsKlar ist kein Rechtsdienstleistungsunternehmen und bietet keine Rechtsberatung an.</p></div>
}
