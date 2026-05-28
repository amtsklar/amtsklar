import { useState, useRef, useEffect } from 'react'

export type LangCode = 'de'|'en'|'tr'|'sr'|'hr'|'hu'|'sl'|'sk'|'ro'|'pl'|'ru'|'it'

export const LANGUAGES: { code: LangCode; label: string; flag: string }[] = [
  { code:'de', label:'Deutsch',     flag:'🇦🇹' },
  { code:'en', label:'English',     flag:'🇬🇧' },
  { code:'tr', label:'Türkçe',      flag:'🇹🇷' },
  { code:'sr', label:'Srpski',      flag:'🇷🇸' },
  { code:'hr', label:'Hrvatski',    flag:'🇭🇷' },
  { code:'hu', label:'Magyar',      flag:'🇭🇺' },
  { code:'sl', label:'Slovenščina', flag:'🇸🇮' },
  { code:'sk', label:'Slovenčina',  flag:'🇸🇰' },
  { code:'ro', label:'Română',      flag:'🇷🇴' },
  { code:'pl', label:'Polski',      flag:'🇵🇱' },
  { code:'ru', label:'Русский',     flag:'🇷🇺' },
  { code:'it', label:'Italiano',    flag:'🇮🇹' },
]

export function getLang(): LangCode {
  try {
    const v = localStorage.getItem('ak_lang') as LangCode
    return LANGUAGES.find(l => l.code === v) ? v : 'de'
  } catch { return 'de' }
}

export function setLangStored(lang: LangCode) {
  try { localStorage.setItem('ak_lang', lang) } catch {}
}

interface Props {
  lang: LangCode
  onChange: (l: LangCode) => void
}

export function LanguageSwitcher({ lang, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = LANGUAGES.find(l => l.code === lang)!

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 10px', borderRadius: 8,
          background: 'transparent',
          border: '1px solid #C5D8ED',
          color: '#2A5080', fontSize: 13, fontWeight: 500,
          cursor: 'pointer', transition: 'border-color 0.15s',
        }}
        onMouseOver={e => (e.currentTarget.style.borderColor = '#C9963A')}
        onMouseOut={e => (e.currentTarget.style.borderColor = '#C5D8ED')}
      >
        <span style={{ fontSize: 16 }}>{current.flag}</span>
        <span style={{ display: 'none', ['@media (min-width: 500px)' as any]: { display: 'inline' } }}>
          {current.label}
        </span>
        <span style={{ fontSize: 9, opacity: 0.6, marginLeft: 2 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: '#FFFFFF', border: '1px solid #C5D8ED',
          borderRadius: 10, overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(15,36,64,0.12)',
          zIndex: 200, minWidth: 160,
        }}>
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => { onChange(l.code); setLangStored(l.code); setOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '9px 14px',
                background: l.code === lang ? 'rgba(201,150,58,0.08)' : 'transparent',
                border: 'none',
                color: l.code === lang ? '#C9963A' : '#2A5080',
                fontSize: 13, fontWeight: l.code === lang ? 600 : 400,
                cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.1s',
                borderBottom: '1px solid #F0F6FC',
              }}
              onMouseOver={e => { if (l.code !== lang) e.currentTarget.style.background = '#F5F8FC' }}
              onMouseOut={e => { if (l.code !== lang) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize: 16 }}>{l.flag}</span>
              <span>{l.label}</span>
              {l.code === lang && <span style={{ marginLeft: 'auto', fontSize: 11 }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
