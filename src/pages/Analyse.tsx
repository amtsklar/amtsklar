import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

const PADDLE_PRICES = {
  monthly: {
    verstehen: 'pri_01ksft9sb5nbptry9pyyd6q54y',
    handeln:   'pri_01ksftcj51p1jsmjk2pr0jbcat',
    familie:   'pri_01ksftg5nw1a2nztra644zhd5a',
  },
  yearly: {
    verstehen: 'pri_01kspy294ejb2cye55ahj4ypj1',
    handeln:   'pri_01kspy5h321a355ngn0qhjn5m4',
    familie:   'pri_01kspy9q00s8k4v4hsw6j3trmr',
  },
};
const MAX_TEXT_CHARS = 3000;
const MAX_FILE_MB    = 10;
const FREE_LIMIT     = 1;
const SK_COUNT       = 'ak_n';
const SK_PAID        = 'ak_p';
const SK_EMAIL       = 'ak_e';

const getCount = () => parseInt(localStorage.getItem(SK_COUNT) || '0');
const incCount = () => localStorage.setItem(SK_COUNT, String(getCount() + 1));
const isPaid   = () => localStorage.getItem(SK_PAID) === '1';

// Styles as constants — never re-created on render
const S = {
  wrap:   { minHeight:'100vh', background:'#F8F9FB' } as const,
  header: { background:'#1a1a2e', padding:'0 20px', display:'flex', alignItems:'center', justifyContent:'space-between', height:'60px' } as const,
  logo:   { fontSize:'20px', fontWeight:700, color:'#EDF2FA', background:'none', border:'none', cursor:'pointer', padding:0 } as const,
  gold:   { color:'#C9963A' } as const,
  main:   { maxWidth:'660px', margin:'0 auto', padding:'36px 20px 60px' } as const,
  h1:     { fontSize:'24px', fontWeight:700, marginBottom:'22px', color:'#1a1a2e' } as const,
  tabs:   { display:'flex', gap:'8px', marginBottom:'14px' } as const,
  drop:   (active: boolean, loaded: boolean) => ({
    border: `2px dashed ${active ? '#C9963A' : loaded ? '#22c55e' : '#d1d5db'}`,
    borderRadius:'14px', padding:'44px 20px', textAlign:'center' as const,
    background: active ? 'rgba(201,150,58,0.04)' : loaded ? 'rgba(34,197,94,0.04)' : '#fff',
    cursor:'pointer', transition:'border-color 0.15s, background 0.15s', marginBottom:'12px',
  }),
  textarea: { width:'100%', minHeight:'190px', padding:'14px', borderRadius:'12px', border:'1px solid #e5e7eb', fontSize:'15px', lineHeight:1.6, resize:'vertical' as const, fontFamily:"'Inter',sans-serif", marginBottom:'12px', outline:'none' } as const,
  btn:    (disabled: boolean) => ({ width:'100%', padding:'13px', borderRadius:'11px', background: disabled ? '#d1d5db' : '#C9963A', color:'#fff', fontWeight:700, fontSize:'16px', border:'none', cursor: disabled ? 'not-allowed' as const : 'pointer' as const, transition:'background 0.15s' }),
  err:    { marginTop:'14px', padding:'14px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'11px', color:'#DC2626', fontSize:'14px' } as const,
  result: { padding:'22px', background:'#fff', borderRadius:'14px', border:'1px solid #e5e7eb', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' } as const,
  disc:   { marginTop:'10px', padding:'11px 14px', background:'#FEF3C7', borderRadius:'9px', fontSize:'13px', color:'#92400E' } as const,
  newBtn: { marginTop:'14px', padding:'9px 22px', borderRadius:'8px', border:'1px solid #e5e7eb', background:'#fff', fontWeight:600, fontSize:'14px', cursor:'pointer', color:'#374151' } as const,
  overlay:{ position:'fixed' as const, inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'20px' },
  modal:  { background:'#fff', borderRadius:'18px', padding:'32px', maxWidth:'460px', width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.25)' } as const,
};

type Mode = 'upload' | 'text';

export default function Analyse() {
  const { t, lang } = useLang();
  const navigate    = useNavigate();

  const [mode,      setMode]      = useState<Mode>('upload');
  const [text,      setText]      = useState('');
  const [imgData,   setImgData]   = useState<string | null>(null);
  const [imgType,   setImgType]   = useState('image/jpeg');
  const [fileName,  setFileName]  = useState('');
  const [dragOver,  setDragOver]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState('');
  const [error,     setError]     = useState('');
  const [showPay,   setShowPay]   = useState(false);
  const [yearly,    setYearly]    = useState(false);
  const [email,     setEmail]     = useState('');
  const [verifying, setVerifying] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setResult(''); setError(''); setText('');
    setImgData(null); setFileName(''); setMode('upload');
  }, []);

  // Load PDF.js on demand
  const loadPdfJs = useCallback((): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) { resolve((window as any).pdfjsLib); return; }
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      s.onload = () => {
        const lib = (window as any).pdfjsLib;
        lib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(lib);
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }, []);

  const processFile = useCallback(async (file: File) => {
    setError(''); setResult('');

    if (file.size > MAX_FILE_MB * 1024 * 1024) { setError(t.err_size); return; }

    const isPdf  = file.type === 'application/pdf';
    const isImg  = file.type.startsWith('image/');
    if (!isPdf && !isImg) { setError(t.err_type); return; }

    setFileName(file.name);

    if (isPdf) {
      try {
        const lib = await loadPdfJs();
        const buf = await file.arrayBuffer();
        const doc = await lib.getDocument({ data: buf }).promise;

        // Try text extraction first
        let extracted = '';
        for (let i = 1; i <= Math.min(doc.numPages, 8); i++) {
          const page    = await doc.getPage(i);
          const content = await page.getTextContent();
          extracted += content.items.map((item: any) => item.str).join(' ') + '\n';
        }

        if (extracted.trim().length > 30) {
          // Text PDF — send as text (cheap, no vision tokens)
          setText(extracted.trim().slice(0, MAX_TEXT_CHARS));
          setImgData(null);
          setMode('text');
        } else {
          // Scanned PDF — render page 1 as image
          const page     = await doc.getPage(1);
          const viewport = page.getViewport({ scale: 1.2 }); // lower scale = fewer tokens
          const canvas   = document.createElement('canvas');
          canvas.width   = viewport.width;
          canvas.height  = viewport.height;
          await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
          setImgData(canvas.toDataURL('image/jpeg', 0.72).split(',')[1]);
          setImgType('image/jpeg');
          setMode('upload');
        }
      } catch {
        setError(t.err_pdf);
      }
    } else {
      // Image — compress to JPEG 72% to reduce vision token cost
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Cap at 1200px wide to reduce tokens
          const maxW   = 1200;
          const ratio  = Math.min(1, maxW / img.width);
          const canvas = document.createElement('canvas');
          canvas.width  = Math.round(img.width  * ratio);
          canvas.height = Math.round(img.height * ratio);
          canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
          setImgData(canvas.toDataURL('image/jpeg', 0.72).split(',')[1]);
          setImgType('image/jpeg');
          setMode('upload');
          setText('');
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }, [t, loadPdfJs]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
    e.target.value = ''; // allow re-upload of same file
  }, [processFile]);

  const handleAnalyse = useCallback(async () => {
    if (!isPaid() && getCount() >= FREE_LIMIT) { setShowPay(true); return; }

    const hasContent = imgData || text.trim().length > 10;
    if (!hasContent) { setError(t.err_empty); return; }

    setLoading(true); setError(''); setResult('');

    try {
      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text:      text ? text.trim().slice(0, MAX_TEXT_CHARS) : null,
          imageData: imgData || null,
          imageType: imgType,
          language:  lang,
        }),
      });

      if (!res.ok) throw new Error(t.err_api);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      incCount();
      setResult(data.result);
    } catch (e: any) {
      setError(e.message || t.err_api);
    } finally {
      setLoading(false);
    }
  }, [imgData, text, imgType, lang, t]);

  const handleVerify = useCallback(async () => {
    if (!email.trim().includes('@')) return;
    setVerifying(true); setError('');
    try {
      const res  = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.active) {
        localStorage.setItem(SK_PAID, '1');
        localStorage.setItem(SK_EMAIL, email.trim());
        setShowPay(false);
      } else {
        setError('Kein aktives Abo für diese E-Mail.');
      }
    } catch {
      setError('Verbindungsfehler — bitte erneut versuchen.');
    } finally {
      setVerifying(false);
    }
  }, [email]);

  const openPaddle = useCallback((priceId: string) => {
    const P = (window as any).Paddle;
    if (P) {
      P.Checkout.open({ items:[{ priceId, quantity:1 }], settings:{ theme:'light' } });
    }
  }, []);

  const tabStyle = (active: boolean) => ({
    padding:'8px 18px', borderRadius:'8px', fontWeight:600, fontSize:'14px',
    background: active ? '#1a1a2e' : '#fff',
    color: active ? '#fff' : '#6b7280',
    border: `1px solid ${active ? '#1a1a2e' : '#e5e7eb'}`,
    cursor:'pointer' as const,
  });

  const canAnalyse = loading || (!imgData && text.trim().length < 10);

  return (
    <div style={S.wrap}>
      {/* Paddle */}
      <script src="https://cdn.paddle.com/paddle/v2/paddle.js" async />

      {/* Header */}
      <header style={S.header}>
        <button style={S.logo} onClick={() => navigate('/')}>
          Amts<span style={S.gold}>Klar</span>
        </button>
        <LanguageSwitcher />
      </header>

      <main style={S.main}>
        <h1 style={S.h1}>{t.page_title}</h1>

        {!result && (
          <>
            {/* Mode tabs */}
            <div style={S.tabs}>
              <button style={tabStyle(mode === 'upload')} onClick={() => setMode('upload')}>{t.tab_file}</button>
              <button style={tabStyle(mode === 'text')}   onClick={() => setMode('text')}>{t.tab_text}</button>
            </div>

            {/* Upload area */}
            {mode === 'upload' ? (
              <div
                style={S.drop(dragOver, !!imgData)}
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept=".pdf,image/*" style={{ display:'none' }} onChange={handleFileInput} />
                {imgData ? (
                  <>
                    <div style={{ fontSize:'36px', marginBottom:'6px' }}>✅</div>
                    <p style={{ fontWeight:600, color:'#15803d', fontSize:'15px' }}>{fileName}</p>
                    <p style={{ color:'#6b7280', fontSize:'12px', marginTop:'4px' }}>{t.file_loaded}</p>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize:'36px', marginBottom:'10px' }}>📄</div>
                    <p style={{ fontWeight:600, color:'#374151', marginBottom:'4px' }}>{t.drop_title}</p>
                    <p style={{ color:'#9ca3af', fontSize:'13px' }}>{t.drop_sub} <span style={{ textDecoration:'underline' }}>{t.drop_click}</span></p>
                    <p style={{ color:'#d1d5db', fontSize:'12px', marginTop:'8px' }}>{t.drop_hint}</p>
                  </>
                )}
              </div>
            ) : (
              <textarea
                value={text}
                onChange={e => setText(e.target.value.slice(0, MAX_TEXT_CHARS))}
                placeholder={t.paste_ph}
                style={S.textarea}
              />
            )}

            <button onClick={handleAnalyse} disabled={canAnalyse} style={S.btn(canAnalyse)}>
              {loading ? `⏳ ${t.btn_loading}` : `🔍 ${t.btn_analyse}`}
            </button>
          </>
        )}

        {/* Error */}
        {error && <div style={S.err}>⚠️ {error}</div>}

        {/* Result */}
        {result && (
          <div style={{ marginTop:'20px' }}>
            <div style={S.result}>
              <h2 style={{ fontSize:'17px', fontWeight:700, marginBottom:'14px', color:'#1a1a2e' }}>
                📋 {t.result_title}
              </h2>
              <div style={{ fontSize:'15px', lineHeight:1.8, color:'#374151', whiteSpace:'pre-wrap' }}>
                {result}
              </div>
            </div>
            <div style={S.disc}>{t.disclaimer}</div>
            <button style={S.newBtn} onClick={reset}>🔄 {t.btn_new}</button>
          </div>
        )}
      </main>

      {/* Paywall modal */}
      {showPay && (
        <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) setShowPay(false); }}>
          <div style={S.modal}>
            <h2 style={{ fontSize:'20px', fontWeight:700, marginBottom:'6px', color:'#1a1a2e' }}>{t.pay_title}</h2>
            <p style={{ color:'#6b7280', marginBottom:'16px', fontSize:'14px' }}>{t.pay_sub}</p>

            {/* Monatlich / Jährlich Toggle */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginBottom:'18px' }}>
              <span style={{ fontSize:'13px', color: yearly ? '#9ca3af' : '#1a1a2e', fontWeight: yearly ? 400 : 600 }}>Monatlich</span>
              <div
                onClick={() => setYearly(y => !y)}
                style={{ width:'42px', height:'23px', borderRadius:'12px', background: yearly ? '#C9963A' : '#d1d5db', position:'relative', cursor:'pointer', transition:'background 0.2s' }}
              >
                <div style={{ position:'absolute', top:'3px', left: yearly ? '21px' : '3px', width:'17px', height:'17px', borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
              <span style={{ fontSize:'13px', color: yearly ? '#1a1a2e' : '#9ca3af', fontWeight: yearly ? 600 : 400 }}>Jährlich</span>
              {yearly && <span style={{ background:'#FEF3C7', color:'#92400E', fontSize:'11px', fontWeight:700, padding:'2px 8px', borderRadius:'10px' }}>2 Monate gratis</span>}
            </div>

            {/* 3 Plans */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'20px' }}>
              {([
                { key:'verstehen' as const, name:'Verstehen', mp:'€2,99', yp:'€2,49', yt:'€24,90/Jahr', highlight:false, features:['Unbegrenzte Analysen','82 Rechtsbereiche','Fristen & Empfehlungen','RIS-Gesetzescheck'] },
                { key:'handeln'   as const, name:'Handeln',   mp:'€4,99', yp:'€4,19', yt:'€41,90/Jahr', highlight:true,  features:['Alles in Verstehen','Fertiger Einspruch','Mustervorlagen'] },
                { key:'familie'   as const, name:'Familie',   mp:'€7,99', yp:'€6,79', yt:'€67,90/Jahr', highlight:false, features:['Alles in Handeln','Ganze Familie','1 Abo für alle'] },
              ]).map(p => (
                <button
                  key={p.key}
                  onClick={() => openPaddle(yearly ? PADDLE_PRICES.yearly[p.key] : PADDLE_PRICES.monthly[p.key])}
                  style={{ padding:'12px 8px', borderRadius:'10px', border: p.highlight ? '2px solid #C9963A' : '2px solid #e5e7eb', background: p.highlight ? 'rgba(201,150,58,0.06)' : '#fff', cursor:'pointer', textAlign:'center' as const, position:'relative' as const }}
                >
                  {p.highlight && (
                    <div style={{ position:'absolute', top:'-11px', left:'50%', transform:'translateX(-50%)', background:'#C9963A', color:'#fff', fontSize:'10px', fontWeight:700, padding:'2px 8px', borderRadius:'10px', whiteSpace:'nowrap' as const }}>⭐ Meistgewählt</div>
                  )}
                  <div style={{ fontWeight:700, fontSize:'13px', marginBottom:'2px', color:'#1a1a2e' }}>{p.name}</div>
                  <div style={{ color:'#C9963A', fontWeight:800, fontSize:'18px' }}>{yearly ? p.yp : p.mp}</div>
                  <div style={{ color:'#9ca3af', fontSize:'10px', marginBottom:'6px' }}>{yearly ? p.yt : '/Monat'}</div>
                  {p.features.map((f, i) => (
                    <div key={i} style={{ fontSize:'11px', color:'#6b7280', textAlign:'left' as const, marginBottom:'2px' }}>✓ {f}</div>
                  ))}
                </button>
              ))}
            </div>

            <div style={{ borderTop:'1px solid #f3f4f6', paddingTop:'18px' }}>
              <p style={{ fontSize:'13px', color:'#6b7280', marginBottom:'8px' }}>{t.pay_existing}</p>
              <div style={{ display:'flex', gap:'8px' }}>
                <input
                  type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t.pay_email_ph}
                  style={{ flex:1, padding:'9px 12px', borderRadius:'8px', border:'1px solid #e5e7eb', fontSize:'14px', outline:'none' }}
                  onKeyDown={e => e.key === 'Enter' && handleVerify()}
                />
                <button
                  onClick={handleVerify} disabled={verifying}
                  style={{ padding:'9px 14px', borderRadius:'8px', background:'#1a1a2e', color:'#fff', fontWeight:600, fontSize:'14px', border:'none', cursor:'pointer' }}
                >
                  {verifying ? t.pay_verifying : t.pay_verify}
                </button>
              </div>
            </div>

            <button onClick={() => setShowPay(false)} style={{ marginTop:'14px', width:'100%', padding:'9px', background:'transparent', border:'none', color:'#9ca3af', fontSize:'13px', cursor:'pointer' }}>
              ✕ {t.pay_close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
