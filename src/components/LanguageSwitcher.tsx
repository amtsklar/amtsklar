import { useState, useRef, useEffect } from 'react';
import { useLang, langs } from '../i18n';

export function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = langs.find(l => l.code === lang)!;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 12px', borderRadius: '8px',
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
          color: '#EDF2FA', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
        onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
      >
        <span style={{ fontSize: '18px' }}>{current.flag}</span>
        <span>{current.label}</span>
        <span style={{ fontSize: '10px', opacity: 0.7 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: '#1e2035', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '12px', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          zIndex: 1000, minWidth: '160px',
        }}>
          {langs.map(l => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '10px 14px',
                background: l.code === lang ? 'rgba(201,150,58,0.15)' : 'transparent',
                border: 'none', color: l.code === lang ? '#C9963A' : '#cbd5e1',
                fontSize: '14px', fontWeight: l.code === lang ? 600 : 400,
                cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseOver={e => { if (l.code !== lang) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseOut={e => { if (l.code !== lang) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: '18px' }}>{l.flag}</span>
              <span>{l.label}</span>
              {l.code === lang && <span style={{ marginLeft: 'auto', fontSize: '12px' }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
