import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem('ak_cookies')
    if (!accepted) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem('ak_cookies', 'accepted')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
      background: '#0F2440', borderTop: '2px solid rgba(201,150,58,0.4)',
      padding: '16px 24px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
    }}>
      <div style={{ flex: 1, minWidth: 260 }}>
        <div style={{ fontSize: 14, color: '#C8D8EC', lineHeight: 1.6 }}>
          🍪 AmtsKlar verwendet ausschließlich <strong style={{ color: '#EDF2FA' }}>technisch notwendige</strong> Cookies für den Betrieb des Dienstes. Keine Werbung, kein Tracking.{' '}
          <Link to="/datenschutz" style={{ color: '#C9963A', textDecoration: 'underline' }}>Datenschutzerklärung</Link>
        </div>
      </div>
      <button
        onClick={accept}
        style={{
          background: 'linear-gradient(135deg,#B8832A,#D4A84B)',
          color: '#0C1825', border: 'none', borderRadius: 10,
          padding: '10px 24px', fontSize: 14, fontWeight: 700,
          cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
        }}
      >
        Verstanden ✓
      </button>
    </div>
  )
}
