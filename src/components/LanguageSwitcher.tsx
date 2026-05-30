/**
 * AmtsKlar — Österreichische Behördenbriefe sofort verstehen
 * Copyright © 2025-2026 STAR:HORIZON LTD
 * Alle Rechte vorbehalten. All rights reserved.
 *
 * Unauthorized copying, modification, distribution or use of this
 * software, via any medium, is strictly prohibited.
 * Proprietary and confidential.
 *
 * www.amtsklar.at | info@amtsklar.at
 */

import { useState, useRef, useEffect } from 'react'
import { useLang, type LangCode } from '../i18n/LangContext'

export type { LangCode }

const LANGUAGES: { code: LangCode; label: string; flag: string }[] = [
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

export function LanguageSwitcher() {
  const { lang, setLang } = useLang()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = LANGUAGES.find(l => l.code === lang)!

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={`Sprache wählen: ${current.label}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        style={{
          display:'flex', alignItems:'center', gap:6,
          padding:'6px 10px', borderRadius:8,
          background:'transparent', border:'1px solid #C5D8ED',
          color:'#2A5080', fontSize:13, fontWeight:500,
          cursor:'pointer', transition:'border-color 0.15s',
        }}
        onMouseOver={e => (e.currentTarget.style.borderColor = '#C9963A')}
        onMouseOut={e => (e.currentTarget.style.borderColor = '#C5D8ED')}
      >
        <span style={{ fontSize:16 }}>{current.flag}</span>
        <span>{current.label}</span>
        <span style={{ fontSize:9, opacity:0.6, marginLeft:2 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 6px)', right:0,
          background:'#FFFFFF', border:'1px solid #C5D8ED',
          borderRadius:10, overflow:'hidden',
          boxShadow:'0 8px 24px rgba(15,36,64,0.12)',
          zIndex:200, minWidth:165,
        }}>
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false) }}
              role="option"
              aria-selected={l.code === lang}
              style={{
                display:'flex', alignItems:'center', gap:10,
                width:'100%', padding:'9px 14px',
                background: l.code === lang ? 'rgba(201,150,58,0.08)' : 'transparent',
                border:'none', borderBottom:'1px solid #F0F6FC',
                color: l.code === lang ? '#C9963A' : '#2A5080',
                fontSize:13, fontWeight: l.code === lang ? 600 : 400,
                cursor:'pointer', textAlign:'left',
              }}
              onMouseOver={e => { if (l.code !== lang) e.currentTarget.style.background = '#F5F8FC' }}
              onMouseOut={e => { if (l.code !== lang) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize:16 }}>{l.flag}</span>
              <span>{l.label}</span>
              {l.code === lang && <span style={{ marginLeft:'auto', fontSize:11 }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
