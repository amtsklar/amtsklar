import { Link } from 'react-router-dom'
export default function Datenschutz() {
  return <div style={{ background: '#0C1825', minHeight: '100vh', color: '#EDF2FA', padding: '40px 24px' }}><Link to="/" style={{ color: '#6E8EAD', textDecoration: 'none' }}>← Zurück</Link><h1 style={{ fontFamily: 'serif', fontSize: 28, marginTop: 24, marginBottom: 16 }}>Datenschutz</h1><p style={{ color: '#C8D8EC', lineHeight: 1.7 }}>Verantwortlicher: Philipp Hofer, Fischerweg 7, 9430 Au, Schweiz.<br/><br/>Wir verarbeiten nur die Daten die für den Betrieb zwingend erforderlich sind. Der Brieftext wird ausschließlich für die Dauer der Analyse an Anthropic übermittelt und nicht gespeichert. Zahlungsdaten werden von Paddle verarbeitet. Keine Tracking-Cookies.</p></div>
}
