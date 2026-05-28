import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('AmtsKlar Error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: '#EEF4FB', minHeight: '100vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }}>
          <div style={{
            background: '#FFFFFF', border: '1.5px solid #C5D8ED',
            borderRadius: 16, padding: '40px 32px', maxWidth: 480,
            textAlign: 'center', boxShadow: '0 4px 24px rgba(15,36,64,0.08)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <div style={{
              fontFamily: 'Libre Baskerville,Georgia,serif',
              fontSize: 22, fontWeight: 700, color: '#0F2440', marginBottom: 12,
            }}>
              Etwas ist schiefgelaufen
            </div>
            <div style={{ fontSize: 15, color: '#2A5080', lineHeight: 1.7, marginBottom: 28 }}>
              Bitte laden Sie die Seite neu. Falls das Problem anhält, kontaktieren Sie{' '}
              <a href="mailto:info@amtsklar.at" style={{ color: '#C9963A' }}>info@amtsklar.at</a>
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'linear-gradient(135deg,#B8832A,#D4A84B)',
                color: '#FFFFFF', border: 'none', borderRadius: 10,
                padding: '12px 28px', fontSize: 15, fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Seite neu laden
            </button>
            <div style={{ marginTop: 12 }}>
              <a href="/" style={{ fontSize: 13, color: '#6A8AAA', textDecoration: 'none' }}>
                Zur Startseite
              </a>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
